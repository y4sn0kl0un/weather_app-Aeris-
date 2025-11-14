import './Search.css'
import { useEffect, useState } from "react";

export function Search({onCitySelect}) {
    const [searchCity, setSearchCity] = useState('');
    const [results, setResults] = useState([]);
    const [dropdown, setDropdown] = useState(false);

    // Массив городов для поиска
    const cities = [
        'Seoul', 'Tokyo', 'New York', 'London', 'Paris',
        'Moscow', 'Beijing', 'Dubai', 'Singapore', 'Berlin',
        'Madrid', 'Rome', 'Sydney', 'Toronto', 'Mumbai'
    ];

    useEffect(() => {
        if (searchCity.length > 0) {
            // Фильтруем МАССИВ cities, а не строку searchCity
            const filtered = cities.filter((city) =>
                city.toLowerCase().includes(searchCity.toLowerCase())
            );
            setResults(filtered);
            setDropdown(filtered.length > 0);
        } else {
            setResults([]);
            setDropdown(false);
        }
    }, [searchCity]);

    const handleSelect = (city) => {
        setSearchCity(city);
        setDropdown(false);
        if (onCitySelect) {
            onCitySelect(city);
        }
    };

    return (
        <div className="search-container">
            <input
                type="text"
                className="search-input"
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                placeholder="Search City..."
            />

            {dropdown && (
                <div className="dropdown">
                    {results.map((city) => (
                        <div
                            key={city}
                            className="dropdown-item"
                            onClick={() => handleSelect(city)}
                        >
                            {city}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}