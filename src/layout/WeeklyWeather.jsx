import "./WeeklyWeather.css"

export function WeeklyWeather({ sunset, sunrise, hourlyData, tomorrowCondition }) {
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
                    <img src={image} />
                </div>
            </div>
            <div className="sunset-sunrise">
                <div className="sunrise">
               <h3>Sunrise:</h3>
                <h2> {sunrise}</h2>
                </div>
                <div className="sunrise">
                    <h3>Sunset:</h3>
                    <h2> {sunset}</h2>
                </div>

            </div>
        </div>
    );
}