from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
import requests
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")
JWT_SECRET = os.getenv("JWT_SECRET", "testsecret")
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://aeris-frontend-gh0t.onrender.com")
JWT_ALG = "HS256"


# ИСПРАВЛЕНО: Переместили get_current_user ВЫШЕ, чтобы его можно было использовать
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
def google_callback(code: str, db: Session = Depends(get_db)):
    token_data = {
        "code": code,
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "redirect_uri": REDIRECT_URI,
        "grant_type": "authorization_code"
    }

    tokens = requests.post("https://oauth2.googleapis.com/token", data=token_data).json()
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

    # ИСПРАВЛЕНО: Добавлен return для redirect
    frontend_url = f"{FRONTEND_URL}/auth/callback?token={token}"
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
    
    # ИСПРАВЛЕНО: Правильный отступ
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


@app.get("/api")
async def home():
    lat = 37.57
    lon = 126.98

    async with httpx.AsyncClient() as client:
        r = await client.get(
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

    return {
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


@app.get("/api/weather")
async def get_weather(city: str):
    async with httpx.AsyncClient() as client:
        geo = await client.get(
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
        
        # ИСПРАВЛЕНО: Правильный отступ
        weather = await client.get(
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

    return {
        "city": result["name"],
        "country": result.get("country", ""),
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
