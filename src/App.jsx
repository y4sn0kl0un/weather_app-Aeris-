import { Weather } from "./layout/Weather.jsx";
import { SideMenu } from "./layout/SideMenu.jsx";
import { Search } from "./layout/Search.jsx";
import { WeeklyWeather } from "./layout/WeeklyWeather.jsx";
import { Highlights } from "./layout/Highlights.jsx";
import { Profile } from "./layout/Profile.jsx";
import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import CallbackPage from "./CallbackPage";

import "./App.css";

function App() {
    const API_URL = "https://aeris-75gf.onrender.com";

    // ✅ Добавили состояние авторизации
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    const [weatherData, setWeatherData] = useState({
        city: "Seoul",
        weekDay: "",
        temperature: "",
        hour: "",
        condition: "",
        date: "",
        feelDegree: "",
        lowDegree: "",
        highDegree: "",
        tomorrowCondition: "",
        humidity: "",
        uvIndex: "",
        windSpeed: "",
        rainChance: "",
        hourlyData: [],
        sunset: "",
        sunrise: ""
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // ✅ Проверка авторизации при загрузке приложения
    useEffect(() => {
        const user = localStorage.getItem('user');
        if (user) {
            try {
                const parsedUser = JSON.parse(user);
                setIsAuthenticated(true);
                setCurrentUser(parsedUser);
                console.log('User logged in:', parsedUser);
            } catch (e) {
                console.error('Error parsing user data:', e);
                localStorage.removeItem('user');
            }
        }
    }, []);

    const getWeekDay = (dateString) => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const date = new Date(dateString);
        return days[date.getDay()];
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    };

    const getCurrentHour = (timeString) => {
        const date = new Date(timeString);
        return date.getHours() + ':00';
    };

    const formatHourTime = (isoString) => {
        const date = new Date(isoString);
        return date.getHours() + ':00';
    };

    const formatSunTime = (isoString) => {
        if (!isoString) return '';

        if (typeof isoString === 'string' && isoString.includes('T')) {
            const time = isoString.split('T')[1].slice(0, 5);
            return time;
        }

        if (typeof isoString === 'number') {
            const date = new Date(isoString * 1000);
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            return `${hours}:${minutes}`;
        }

        try {
            const date = new Date(isoString);
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            return `${hours}:${minutes}`;
        } catch (e) {
            console.error('Error formatting sun time:', e);
            return '';
        }
    };

    const fetchWeatherData = (cityName) => {
        console.log("Загружаем погоду для города:", cityName);
        setLoading(true);
        setError(null);

        fetch(`${API_URL}/api/weather?city=${cityName}`, {
            headers: {
                'ngrok-skip-browser-warning': 'true'
            }
        })
            .then(res => {
                console.log("Response status:", res.status);
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .then(data => {
                console.log("Weather data:", data);
                console.log("Sunset data:", data.daily?.sunset?.[0]);
                console.log("Sunrise data:", data.daily?.sunrise?.[0]);

                const currentDate = new Date(data.current.time);
                const currentHour = currentDate.getHours();

                const currentHourIndex = data.hourly.time.findIndex(time => {
                    const hourDate = new Date(time);
                    return hourDate.getHours() === currentHour;
                });

                const startIndex = currentHourIndex >= 0 ? currentHourIndex : 0;
                const hourlyForecast = data.hourly.time.slice(startIndex, startIndex + 5).map((time, index) => ({
                    time: formatHourTime(time),
                    temperature: Math.round(data.hourly.temperature_2m[startIndex + index]),
                    image: "/cloud.svg"
                }));

                setWeatherData({
                    city: cityName,
                    weekDay: getWeekDay(data.current.time),
                    temperature: Math.round(data.current.temperature),
                    hour: getCurrentHour(data.current.time),
                    condition: data.current.weather_text || "",
                    date: formatDate(data.current.time),
                    feelDegree: Math.round(data.current.temperature),
                    lowDegree: Math.round(data.daily.temperature_min[0]),
                    highDegree: Math.round(data.daily.temperature_max[0]),
                    tomorrowCondition: data.current.weather_text || "",
                    humidity: data.hourly.humidity[0] || 0,
                    uvIndex: data.hourly.uv_index[0] || 0,
                    windSpeed: Math.round(data.current.wind_speed) || 0,
                    rainChance: data.hourly.precipitation_probability[0] || 0,
                    hourlyData: hourlyForecast,
                    sunset: formatSunTime(data.daily?.sunset?.[0]),
                    sunrise: formatSunTime(data.daily?.sunrise?.[0])
                });
                setLoading(false);
            })
            .catch(err => {
                console.error("FULL ERROR:", err);
                setError(err.message);
                setLoading(false);
            });
    };

    // ✅ Функции для логина и логаута
    const handleLogin = (user) => {
        setIsAuthenticated(true);
        setCurrentUser(user);
        console.log('User logged in:', user);
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setCurrentUser(null);
        console.log('User logged out');
    };

    useEffect(() => {
        fetchWeatherData("Seoul");
    }, []);

    if (loading) {
        return <div className="loading">Loading weather data...</div>;
    }

    if (error) {
        return <div className="error">Error: {error}</div>;
    }

    return (
        <>

            <div className="layout">
                <div className="sidemenu">
                    <SideMenu image="/logo.svg"
                    city={weatherData.city}
                    temperature={`${weatherData.temperature}°`}
                    />
                </div>
                <div className="search">
                    <Search onCitySelect={fetchWeatherData} />

                    <div className="weather">
                        <Weather
                            currentLocation={weatherData.city}
                            image="/cloud.svg"
                            weekDay={weatherData.weekDay}
                            temperature={`${weatherData.temperature}°`}
                            condition={weatherData.condition}
                            date={weatherData.date}
                            feelDegree={`${weatherData.feelDegree}°`}
                            lowDegree={`${weatherData.lowDegree}°`}
                            highDegree={`${weatherData.highDegree}°`}
                            isAuthenticated={isAuthenticated}
                            userId={currentUser?.id}
                        />
                        <WeeklyWeather
                            hourlyData={weatherData.hourlyData}
                            tomorrowCondition={weatherData.tomorrowCondition}
                            sunset={weatherData.sunset}
                            sunrise={weatherData.sunrise}
                            image="/cloud.svg"
                        />
                    </div>
                </div>

                <Profile
                    image="/default.svg"
                    username={currentUser?.username || "user"}
                    isAuthenticated={isAuthenticated}
                    onLogin={handleLogin}
                    onLogout={handleLogout}
                />

                <Highlights
                    rainValue={weatherData.rainChance}
                    humidityValue={weatherData.humidity}
                    uvValue={weatherData.uvIndex}
                    windValue={weatherData.windSpeed}
                />
            </div>
        </>
    )
}

export default App