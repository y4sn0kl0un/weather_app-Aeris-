import './Search.css'
import {useEffect, useState} from "react";

export function Search() {
        const [searchCity, setSearchCity] = useState('');
        const [results, setResults] = useState("");
        const [dropdown, setDropdown] = useState(false);

    useEffect(() => {
        if(searchCity.length > 0){
            const filtered = searchCity.filter((city) =>
                city.toLowerCase().includes(searchCity.toLowerCase())
            );
            setResults(filtered);
            setDropdown(filtered.length > 0);
        } else {
            setResults([]);
            setDropdown(false);
        }
    }, [searchCity]);
    return (
        <div className="search">
            <input type="text"
                   value={searchCity}
                   onChange={(e) => setSearchCity(e.target.value)}
                   placeholder="Search City..."

            />
            {setDropdown && (
                <div className="dropdown">
                    {results.map((city) => (
                        <div key={city} className="dropdown-item">
                            {city}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
