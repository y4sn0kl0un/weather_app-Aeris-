import "./WeeklyWeather.css"

export function WeeklyWeather({ hourlyData, tomorrowCondition }) {
    return (
        <div className="weekly-weather">
            <h3>Today / Week</h3>
            <div className="weekly-weather-info">
                <div className="hour-info-list">
                    {hourlyData && hourlyData.map((hour, index) => (
                        <div className="hour-card" key={index}>
                            <div className="info-top">
                                <div className="hour">
                                    {hour.time}
                                </div>
                                <img src={hour.image} alt="weather icon" />
                                <div className="temp">{hour.temperature}°</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="tomorrow-weather">
                <div className="tomorrow-info">
                    <h3>Tomorrow</h3>
                    <div className="tomorrow-infop">
                        <p>{tomorrowCondition}</p>
                    </div>
                </div>
            </div>
            <div className="sunset"></div>

        </div>
    );
}