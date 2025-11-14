from fastapi import FastAPI, HTTPException, Request, Response
import requests
from fastapi.middleware.cors import CORSMiddleware
import uuid

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


sessions = {}

def get_session_id(request: Request):
    return request.cookies.get("session_id")

def get_or_create_session_id(request: Request, response: Response):
    session_id = get_session_id(request)
    if not session_id or session_id not in sessions:
        session_id = str(uuid.uuid4())
        sessions[session_id] = {"bookmarks": []}
        response.set_cookie("session_id", session_id, httponly=True)

    return session_id


@app.get("/bookmarks")
def bookmarks_list(request: Request, response: Response):
    session_id = get_or_create_session_id(request, response)
    bookmarks = sessions[session_id]["bookmarks"]

    return {"bookmarks": bookmarks}

@app.get("/bookmarks/add")
def add_bookmarks(request: Request, response: Response, city: str):
    session_id = get_or_create_session_id(request, response)
    bookmarks = sessions[session_id]["bookmarks"]

    city = city.strip().title()
    if city not in bookmarks:
        bookmarks.append(city)
    return {"bookmarks": bookmarks}

@app.get("/bookmarks/delete")
def delete_bookmarks(request: Request, response: Response, city: str):
    session_id = get_or_create_session_id(request, response)
    bookmarks = sessions[session_id]["bookmarks"]

    city = city.strip().title()
    if city in bookmarks:
        bookmarks.remove(city)
    return {"bookmarks": bookmarks}

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


@app.get("/test")
def test():
    return {"city": "Moscow",
            "temperature": 32}
    

@app.get("/api")
def home():

    lat = 37.57
    lon = 126.98
    city_name = "Seoul"
    country_name = "South Korea"

    weather_url = "https://api.open-meteo.com/v1/forecast"
    weather_params = {
        "latitude": lat,
        "longitude": lon,
        "timezone": "auto",
        "current_weather": True,
        "hourly": "temperature_2m,weathercode,relative_humidity_2m,precipitation_probability,uv_index",
        "daily": "temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max",
    }

    weather_response = requests.get(weather_url, params=weather_params)
    if weather_response.status_code != 200:
        raise HTTPException(status_code=400, detail="Weather API request failed")

    data = weather_response.json()

    current = data["current_weather"]
    current_code = current["weathercode"]

    return {
        "city": city_name,
        "country": country_name,
        "latitude": lat,
        "longitude": lon,
        "current": {
            "temperature": current["temperature"],
            "wind_speed": current["windspeed"],
            "wind_direction": current["winddirection"],
            "weather_code": current_code,
            "weather_text": WEATHER_CODES.get(current_code, "Unknown"),
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
        },
    }

@app.get("/api/weather")
def get_weather(city: str):

    geo_url = "https://geocoding-api.open-meteo.com/v1/search"
    geo_params = {"name": city, "count": 1}
    geo_response = requests.get(geo_url, params=geo_params)

    if geo_response.status_code != 200:
        raise HTTPException(status_code=400, detail="Geocoding API request failed")

    geo_data = geo_response.json()
    if "results" not in geo_data or len(geo_data["results"]) == 0:
        raise HTTPException(status_code=404, detail=f"City '{city}' not found")

    result = geo_data["results"][0]
    lat, lon = result["latitude"], result["longitude"]

    weather_url = "https://api.open-meteo.com/v1/forecast"
    weather_params = {
        "latitude": lat,
        "longitude": lon,
        "timezone": "auto",
        "current_weather": True,
        "hourly": "temperature_2m,weathercode,relative_humidity_2m,precipitation_probability,uv_index",
        "daily": "temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max",
    }

    weather_response = requests.get(weather_url, params=weather_params)
    if weather_response.status_code != 200:
        raise HTTPException(status_code=400, detail="Weather API request failed")

    data = weather_response.json()

    current = data["current_weather"]
    current_code = current["weathercode"]

    response = {
        "city": result["name"],
        "country": result.get("country", ""),
        "latitude": lat,
        "longitude": lon,
        "current": {
            "temperature": current["temperature"],
            "wind_speed": current["windspeed"],
            "wind_direction": current["winddirection"],
            "weather_code": current_code,
            "weather_text": WEATHER_CODES.get(current_code, "Unknown"),
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
        },
    }

    return response



