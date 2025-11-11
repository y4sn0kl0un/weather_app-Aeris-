import "./Highlights.css"

export function Highlights({  rainValue, uvValue, windValue, humidityValue }) {
    return (
        <div className="highlights">
            <h2>Today's Highlights</h2>
            <div className="highlight-cards">

                <div className="rain">
                    <h3>Chance of Rain</h3>

                    <h1 className="value">{rainValue || 0}%</h1>
                </div>

                <div className="uv">
                    <h3>UV Index</h3>
                    <h1 className="value">{uvValue || 0}</h1>
                </div>

                <div className="wind">
                    <h3>Wind Status</h3>
                    <h1 className="value">{windValue || 0} km/h</h1>
                </div>

                <div className="humidity">
                    <h3>Humidity</h3>
                    <h1 className="value">{humidityValue || 0}%</h1>
                </div>
            </div>
        </div>
    );
}