import { Weather } from "./layout/Weather.jsx";
import { SideMenu } from "./layout/SideMenu.jsx";
import { Search } from "./layout/Search.jsx";
import { WeeklyWeather } from "./layout/WeeklyWeather.jsx";
import { Highlights } from "./layout/Highlights.jsx";
import { Profile } from "./layout/Profile.jsx";
import { useState, useEffect } from "react";
import "./App.css";

function App() {
    const API_URL = "https://backend-production-78d0.up.railway.app";

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    const [weatherData, setWeatherData] = useState({
        city: "Seoul",
        weekDay: "",
        temperature: "",
        currentTime:"",
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

    // Проверяем сохраненные данные при загрузке
    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        const savedToken = localStorage.getItem('token');

        if (savedUser && savedToken) {
            try {
                const parsedUser = JSON.parse(savedUser);
                setIsAuthenticated(true);
                setCurrentUser(parsedUser);
                console.log('User already logged in:', parsedUser);
            } catch (e) {
                console.error('Error parsing user data:', e);
                localStorage.removeItem('user');
                localStorage.removeItem('token');
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
        const options = {month: 'short', day: 'numeric', year: 'numeric'};
        return date.toLocaleDateString('en-US', options);
    };

    const getCurrentHour = (timeString) => {
        const date = new Date(timeString);
        return date.getHours() + 'PM' || date.getHours() + 'AM';
    };

    const formatHourTime = (isoString) => {
        const date = new Date(isoString);
        return date.getHours() + 'PM' || date.getHours() + 'AM';
    };

    const formatSunTime = (isoString) => {
        if (!isoString) return '';

        if (typeof isoString === 'string' && isoString.includes('T')) {
            const currentHour = isoString.split('T')[1].slice(0, 5);
            return currentHour;
        }

        if (typeof isoString === 'number') {
            const date = new Date(isoString * 1000);
            const hours = date.getHours().toString().padStart(2, '0');
            return `${hours}`;
        }

        try {
            const date = new Date(isoString);
            const hours = date.getHours().toString().padStart(2);
            return `${hours}`;
        } catch (e) {
            console.error('Error formatting sun time:', e);
            return '';
        }
    };

    const fetchWeatherData = (cityName) => {
        setLoading(true);
        setError(null);

        fetch(`${API_URL}/api/weather?city=${cityName}`, {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        })
            .then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .then(data => {
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

    const handleLogin = (user) => {
        setIsAuthenticated(true);
        setCurrentUser(user);
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setCurrentUser(null);
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
        <div className="layout">
            <div className="sidemenu">
                <SideMenu
                    image="/logo.svg"
                    city={weatherData.city}
                    temperature={`${weatherData.temperature}°`}
                />
            </div>
            <div className="search">
                <Search onCitySelect={fetchWeatherData}/>

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
                        bookmark="/bookmark.png"
                        bookmarked="bookmarked.png"
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
                image={currentUser?.picture || "/default.svg"}
                username={currentUser?.name || currentUser?.username || "Guest"}
                isAuthenticated={isAuthenticated}
                onLogin={handleLogin}
                onLogout={handleLogout}
                setIsAuthenticated={setIsAuthenticated}
                setCurrentUser={setCurrentUser}
            />

            <Highlights
                rainValue={weatherData.rainChance}
                humidityValue={weatherData.humidity}
                uvValue={weatherData.uvIndex}
                windValue={weatherData.windSpeed}
            />
        </div>
    );
}

export default App;