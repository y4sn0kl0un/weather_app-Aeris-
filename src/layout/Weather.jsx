import "./Weather.css"
import {useEffect, useState} from "react";
export  function Weather({currentLocation,
                             image,  date, temperature,
                             feelDegree, condition, lowDegree, highDegree, bookmark}) {

    const API_URL = "https://backend-production-78d0.up.railway.app/";


    const [data, setData] = useState(null);
    useEffect(() => {
        fetch(`${API_URL}/api/weather?city=Seoul`)
        .then(res => res.json())
            .then(data => {
                console.log(data);
                setData(data);
            });
    },[data])
  return (

        <div className="weather-info">

            <div className="current-location">

                <h4>{currentLocation}
                    <button>
                        <img src={bookmark} alt={bookmark}/>
                    </button>
                </h4>
            </div>
            <div className="day-temp">
                <div className="date">
                    <h2>{date}</h2>
                </div>
                <div className="temp">
                    <h1>{temperature}</h1>
                    <h4>High:{highDegree} Low:{lowDegree}</h4>
                </div>
            </div>
                <div className="icon-con">
                    <div className="weather-icon">
                        <img src={image} alt="" />
                    </div>

                    <div className="condition">
                        {condition}
                        <p>Feels like: {feelDegree}</p>
                    </div>

                </div>





        </div>

  );
}