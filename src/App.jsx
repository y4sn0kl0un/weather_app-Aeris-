import { Weather } from "./layout/Weather.jsx";
import { SideMenu } from "./layout/SideMenu.jsx";
import { Search } from "./layout/Search.jsx";
import { WeeklyWeather } from "./layout/WeeklyWeather.jsx";
import { Highlights } from "./layout/Highlights.jsx";
import { Profile } from "./layout/Profile.jsx";
import { useState, useEffect } from "react";
import "./App.css";

function App() {
    const API_URL = "https://alternately-nonpejorative-maisha.ngrok-free.dev";

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
        hourlyData: []
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
                    hourlyData: hourlyForecast
                });
                setLoading(false);
            })
            .catch(err => {
                console.error("FULL ERROR:", err);
                setError(err.message);
                setLoading(false);
            });
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
                    <SideMenu image="/logo.svg"/>
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
                        />
                        <WeeklyWeather
                            hourlyData={weatherData.hourlyData}
                            tomorrowCondition={weatherData.tomorrowCondition}
                        />
                    </div>
                </div>

                <div className="profile">
                    <Profile image="/default.svg" username="user" />
                </div>

                <Highlights
                    rain={"/Sun.svg"}
                    uv={"/uv.svg"}
                    wind={"/wind.svg"}
                    humidity={"/humidity.svg"}
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