from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
import os
from urllib.parse import urlencode
from datetime import datetime, timedelta
from jose import jwt
from dotenv import load_dotenv
import httpx

from database import get_db, engine
from models import Base, User, Bookmark

load_dotenv()

app = FastAPI()
Base.metadata.create_all(bind=engine)

# ============================================
# MIDDLEWARE
# ============================================
app.add_middleware(GZipMiddleware, minimum_size=1000)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# КОНФИГУРАЦИЯ
# ============================================
CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")
JWT_SECRET = os.getenv("JWT_SECRET", "testsecret")
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://frontend-production-95bb.up.railway.app")
JWT_ALG = "HS256"

# ============================================
# HTTP КЛИЕНТ - создаётся один раз и переиспользуется
# ============================================
http_client = httpx.AsyncClient(
    timeout=15.0,  # Максимум 15 секунд на запрос
    limits=httpx.Limits(
        max_connections=100,  # Максимум 100 одновременных соединений
        max_keepalive_connections=20  # 20 соединений остаются открытыми для переиспользования
    ),
)

@app.on_event("shutdown")
async def shutdown():
    """Закрываем HTTP клиент при выключении приложения"""
    await http_client.aclose()

# ============================================
# КЭШИРОВАНИЕ - словари для хранения данных в памяти
# ============================================

# Кэш для погодных данных
# Структура: {"weather:london": (данные_о_погоде, datetime(когда_сохранили))}
weather_cache = {}

# Кэш для координат городов (геокодирование)
# Структура: {"geo:paris": (данные_о_городе, datetime(когда_сохранили))}
geo_cache = {}

# Время жизни кэша в секундах
WEATHER_CACHE_DURATION = 600  # 10 минут - погода обновляется часто
GEO_CACHE_DURATION = 86400  # 24 часа - координаты городов не меняются


def get_from_cache(cache_dict: dict, cache_key: str, duration_seconds: int):
    """
    Получить данные из кэша, если они ещё свежие
    
    Параметры:
    - cache_dict: словарь с кэшем (weather_cache или geo_cache)
    - cache_key: ключ для поиска (например "weather:london")
    - duration_seconds: сколько секунд данные считаются свежими
    
    Возвращает:
    - данные из кэша, если они свежие
    - None, если данных нет или они устарели
    """
    # Проверяем, есть ли этот ключ в словаре
    if cache_key in cache_dict:
        # Достаём кортеж (данные, время_сохранения)
        cached_data, cached_time = cache_dict[cache_key]
        
        # Вычисляем, сколько секунд прошло с момента сохранения
        seconds_passed = (datetime.utcnow() - cached_time).total_seconds()
        
        # Если прошло меньше времени, чем duration_seconds
        if seconds_passed < duration_seconds:
            print(f"✅ Нашёл в кэше: {cache_key} (возраст: {seconds_passed:.1f}s)")
            return cached_data
        else:
            print(f"⏰ Кэш устарел: {cache_key} (возраст: {seconds_passed:.1f}s)")
    else:
        print(f"❌ Не нашёл в кэше: {cache_key}")
    
    return None


def save_to_cache(cache_dict: dict, cache_key: str, data):
    """
    Сохранить данные в кэш
    
    Параметры:
    - cache_dict: словарь для хранения (weather_cache или geo_cache)
    - cache_key: ключ для сохранения
    - data: данные для сохранения
    """
    # Сохраняем кортеж: (данные, текущее_время)
    cache_dict[cache_key] = (data, datetime.utcnow())
    print(f"💾 Сохранил в кэш: {cache_key}")


# ============================================
# КОНСТАНТЫ
# ============================================
WEATHER_CODES = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    80: "Rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    95: "Thunderstorm",
    96: "Thunderstorm with hail",
    99: "Severe thunderstorm with hail",
}

# ============================================
# ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
# ============================================
def get_current_user(
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Not authenticated")

    token = authorization.split(" ")[1]

    try:
        data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except:
        raise HTTPException(401, "Invalid token")

    user = db.query(User).filter(User.id == data["user_id"]).first()
    if not user:
        raise HTTPException(401, "User not found")

    return user

# ============================================
# AUTHENTICATION ROUTES
# ============================================
@app.get("/auth/google/login")
def google_login():
    params = {
        "client_id": CLIENT_ID,
        "redirect_uri": REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "state": "xyz"
    }
    url = "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(params)
    return RedirectResponse(url)


@app.get("/auth/google/callback")
async def google_callback(code: str, db: Session = Depends(get_db)):
    token_data = {
        "code": code,
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "redirect_uri": REDIRECT_URI,
        "grant_type": "authorization_code"
    }

    # Используем переиспользуемый HTTP клиент вместо requests
    response = await http_client.post("https://oauth2.googleapis.com/token", data=token_data)
    tokens = response.json()
    
    id_token = tokens.get("id_token")
    if not id_token:
        raise HTTPException(400, "Invalid Google login")

    google_user = jwt.get_unverified_claims(id_token)

    google_id = google_user["sub"]
    email = google_user.get("email")
    name = google_user.get("name")
    picture = google_user.get("picture")

    user = db.query(User).filter(User.google_id == google_id).first()

    if not user:
        user = User(
            google_id=google_id,
            email=email,
            name=name,
            picture=picture,
            created_at=datetime.utcnow(),
            last_login=datetime.utcnow(),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        user.last_login = datetime.utcnow()
        db.commit()

    payload = {
        "user_id": user.id,
        "exp": datetime.utcnow() + timedelta(days=7)
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

    frontend_url = f"{FRONTEND_URL}/auth/callback?token={token}"
    print("google token response", tokens)
    return RedirectResponse(frontend_url)


@app.get("/auth/me")
def get_me(current_user: User = Depends(get_current_user)):
    """Получить данные текущего пользователя"""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "picture": current_user.picture,
        "google_id": current_user.google_id
    }

# ============================================
# BOOKMARKS ROUTES
# ============================================
@app.get("/bookmarks")
def get_bookmarks(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    bookmarks = db.query(Bookmark).filter(Bookmark.user_id == current_user.id).all()
    return [b.city_name for b in bookmarks]


@app.post("/bookmarks/add")
def add_bookmark(city: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    city = city.strip().title()
    exists = db.query(Bookmark).filter(
        Bookmark.user_id == current_user.id,
        Bookmark.city_name == city
    ).first()
    
    if exists:
        return {"message": "Already exists"}

    b = Bookmark(user_id=current_user.id, city_name=city)
    db.add(b)
    db.commit()

    return {"message": "Added", "city": city}


@app.delete("/bookmarks/delete")
def delete_bookmark(city: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    deleted = db.query(Bookmark).filter(
        Bookmark.user_id == current_user.id,
        Bookmark.city_name == city
    ).delete()

    db.commit()
    return {"deleted": bool(deleted)}

# ============================================
# WEATHER ROUTES
# ============================================

@app.get("/api")
async def home():
    """
    Получить погоду для Сеула (эндпоинт по умолчанию)
    С кэшированием на 10 минут
    """
    # Ключ кэша для Сеула
    cache_key = "weather:seoul"
    
    # Шаг 1: Проверяем, есть ли данные в кэше
    cached = get_from_cache(weather_cache, cache_key, WEATHER_CACHE_DURATION)
    if cached:
        # Нашли в кэше - возвращаем сразу (очень быстро!)
        return cached
    
    # Шаг 2: Данных нет в кэше, запрашиваем API
    print("🌐 Запрашиваю API погоды для Сеула...")
    
    lat = 37.57
    lon = 126.98

    r = await http_client.get(
        "https://api.open-meteo.com/v1/forecast",
        params={
            "latitude": lat,
            "longitude": lon,
            "timezone": "auto",
            "current_weather": True,
            "hourly": "temperature_2m,weathercode,relative_humidity_2m,precipitation_probability,uv_index",
            "daily": "temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max",
        }
    )

    if r.status_code != 200:
        raise HTTPException(400, "Weather API request failed")

    data = r.json()
    current = data["current_weather"]
    code = current["weathercode"]

    # Формируем ответ
    result = {
        "city": "Seoul",
        "country": "South Korea",
        "latitude": lat,
        "longitude": lon,
        "current": {
            "temperature": current["temperature"],
            "wind_speed": current["windspeed"],
            "wind_direction": current["winddirection"],
            "weather_code": code,
            "weather_text": WEATHER_CODES.get(code, "Unknown"),
            "time": current["time"],
        },
        "hourly": {
            "time": data["hourly"]["time"][:8],
            "temperature_2m": data["hourly"]["temperature_2m"][:8],
            "weathercode": data["hourly"]["weathercode"][:8],
            "humidity": data["hourly"]["relative_humidity_2m"][:8],
            "uv_index": data["hourly"]["uv_index"][:8],
            "precipitation_probability": data["hourly"]["precipitation_probability"][:8],
        },
        "daily": {
            "time": data["daily"]["time"],
            "temperature_max": data["daily"]["temperature_2m_max"],
            "temperature_min": data["daily"]["temperature_2m_min"],
            "sunrise": data["daily"]["sunrise"],
            "sunset": data["daily"]["sunset"],
            "uv_index_max": data["daily"]["uv_index_max"],
            "precipitation_probability_max": data["daily"]["precipitation_probability_max"],
        }
    }
    
    # Шаг 3: Сохраняем результат в кэш
    save_to_cache(weather_cache, cache_key, result)
    
    return result


@app.get("/api/weather")
async def get_weather(city: str):
    """
    Получить погоду для любого города
    С двухуровневым кэшированием:
    - Координаты города (24 часа)
    - Данные о погоде (10 минут)
    """
    # Создаём ключ кэша (приводим к нижнему регистру для единообразия)
    # "London", "london", "LONDON" будут использовать один кэш
    weather_cache_key = f"weather:{city.lower()}"
    
    # ШАГ 1: Проверяем кэш погоды
    print(f"\n🔍 Ищу погоду для {city}...")
    cached_weather = get_from_cache(weather_cache, weather_cache_key, WEATHER_CACHE_DURATION)
    
    if cached_weather:
        # Погода найдена в кэше - возвращаем сразу!
        return cached_weather
    
    # ШАГ 2: Погоды нет в кэше, нужно получить координаты города
    geo_cache_key = f"geo:{city.lower()}"
    
    print(f"🗺️ Ищу координаты для {city}...")
    cached_geo = get_from_cache(geo_cache, geo_cache_key, GEO_CACHE_DURATION)
    
    if cached_geo:
        # Координаты есть в кэше
        lat = cached_geo["latitude"]
        lon = cached_geo["longitude"]
        city_name = cached_geo["name"]
        country = cached_geo["country"]
    else:
        # Координат нет в кэше, запрашиваем API геокодирования
        print(f"🌐 Запрашиваю API геокодирования для {city}...")
        
        geo = await http_client.get(
            "https://geocoding-api.open-meteo.com/v1/search",
            params={"name": city, "count": 1}
        )

        if geo.status_code != 200:
            raise HTTPException(400, "Geocoding API request failed")

        geo_data = geo.json()
        if "results" not in geo_data or not geo_data["results"]:
            raise HTTPException(404, f"City '{city}' not found")

        result = geo_data["results"][0]
        lat = result["latitude"]
        lon = result["longitude"]
        city_name = result["name"]
        country = result.get("country", "")
        
        # Сохраняем координаты в кэш на 24 часа
        geo_info = {
            "latitude": lat,
            "longitude": lon,
            "name": city_name,
            "country": country
        }
        save_to_cache(geo_cache, geo_cache_key, geo_info)
    
    # ШАГ 3: Получаем погоду по координатам
    print(f"🌐 Запрашиваю API погоды для {city_name}...")
    
    weather = await http_client.get(
        "https://api.open-meteo.com/v1/forecast",
        params={
            "latitude": lat,
            "longitude": lon,
            "timezone": "auto",
            "current_weather": True,
            "hourly": "temperature_2m,weathercode,relative_humidity_2m,precipitation_probability,uv_index",
            "daily": "temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max",
        }
    )

    if weather.status_code != 200:
        raise HTTPException(400, "Weather API request failed")

    data = weather.json()
    current = data["current_weather"]
    code = current["weathercode"]

    # Формируем финальный ответ
    result = {
        "city": city_name,
        "country": country,
        "latitude": lat,
        "longitude": lon,
        "current": {
            "temperature": current["temperature"],
            "wind_speed": current["windspeed"],
            "wind_direction": current["winddirection"],
            "weather_code": code,
            "weather_text": WEATHER_CODES.get(code, "Unknown"),
            "time": current["time"],
        },
        "hourly": {
            "time": data["hourly"]["time"][:8],
            "temperature_2m": data["hourly"]["temperature_2m"][:8],
            "weathercode": data["hourly"]["weathercode"][:8],
            "humidity": data["hourly"]["relative_humidity_2m"][:8],
            "uv_index": data["hourly"]["uv_index"][:8],
            "precipitation_probability": data["hourly"]["precipitation_probability"][:8],
        },
        "daily": {
            "time": data["daily"]["time"],
            "temperature_max": data["daily"]["temperature_2m_max"],
            "temperature_min": data["daily"]["temperature_2m_min"],
            "sunrise": data["daily"]["sunrise"],
            "sunset": data["daily"]["sunset"],
            "uv_index_max": data["daily"]["uv_index_max"],
            "precipitation_probability_max": data["daily"]["precipitation_probability_max"],
        }
    }
    
    # ШАГ 4: Сохраняем погоду в кэш на 10 минут
    save_to_cache(weather_cache, weather_cache_key, result)
    
    return result


# ============================================
# UTILITY ENDPOINTS (для отладки и мониторинга)
# ============================================

@app.get("/cache/status")
async def cache_status():
    """
    Посмотреть статус кэша
    Полезно для отладки и мониторинга
    """
    return {
        "weather_cache": {
            "size": len(weather_cache),
            "keys": list(weather_cache.keys()),
            "ttl_seconds": WEATHER_CACHE_DURATION
        },
        "geo_cache": {
            "size": len(geo_cache),
            "keys": list(geo_cache.keys()),
            "ttl_seconds": GEO_CACHE_DURATION
        }
    }


@app.get("/cache/clear")
async def clear_cache():
    """
    Очистить весь кэш
    Используй для тестирования или если нужны свежие данные
    """
    weather_cache.clear()
    geo_cache.clear()
    print("🗑️ Кэш полностью очищен")
    return {"message": "Cache cleared successfully"}


@app.get("/health")
async def health_check():
    """
    Проверка здоровья приложения
    Для мониторинга и load balancer'ов
    """
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "cache_stats": {
            "weather_entries": len(weather_cache),
            "geo_entries": len(geo_cache)
        }
    }



#google login test