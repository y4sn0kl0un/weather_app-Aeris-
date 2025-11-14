import './Search.css'
import { useEffect, useState } from "react";

export function Search({ onCitySelect }) {
    const [searchCity, setSearchCity] = useState('');
    const [results, setResults] = useState([]);
    const [dropdown, setDropdown] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Если текст пустой - ничего не делаем
        if (searchCity.length === 0) {
            setResults([]);
            setDropdown(false);
            return;
        }

        // Если меньше 2 символов - не ищем (экономим запросы)
        if (searchCity.length < 2) {
            return;
        }

        // Задержка перед запросом (debounce)
        // Чтобы не делать запрос на каждую букву
        const timer = setTimeout(() => {
            searchCities(searchCity);
        }, 500); // 500ms задержка

        // Отменяем предыдущий таймер при новом вводе
        return () => clearTimeout(timer);
    }, [searchCity]);

    const searchCities = async (query) => {
        setLoading(true);

        try {
            // API для поиска городов (бесплатный)
            const response = await fetch(
                `https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=10&language=en&format=json`
            );

            const data = await response.json();

            if (data.results) {
                // Форматируем результаты
                const cities = data.results.map(city => ({
                    name: city.name,
                    country: city.country,
                    // Полное название с страной для отображения
                    displayName: `${city.name}, ${city.country}`,
                    // Координаты (если понадобятся)
                    lat: city.latitude,
                    lon: city.longitude
                }));

                setResults(cities);
                setDropdown(cities.length > 0);
            } else {
                setResults([]);
                setDropdown(false);
            }
        } catch (error) {
            console.error('Ошибка поиска городов:', error);
            setResults([]);
            setDropdown(false);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (city) => {
        setSearchCity(city.displayName);
        setDropdown(false);

        // Передаём только название города (без страны)
        if (onCitySelect) {
            onCitySelect(city.name);
        }
    };

    return (
        <div className="search-container">
            <div className="search-input-wrapper">
                <input
                    type="text"
                    className="search-input"
                    value={searchCity}
                    onChange={(e) => setSearchCity(e.target.value)}
                    placeholder="Search City..."
                />
                {loading && <span className="search-loading">🔄</span>}
            </div>

            {dropdown && (
                <div className="dropdown">
                    {results.map((city, index) => (
                        <div
                            key={`${city.name}-${city.country}-${index}`}
                            className="dropdown-item"
                            onClick={() => handleSelect(city)}
                        >
                            <div className="city-name">{city.name}</div>
                            <div className="city-country">{city.country}</div>
                        </div>
                    ))}
                </div>
            )}

            {searchCity.length >= 2 && !loading && results.length === 0 && !dropdown && (
                <div className="dropdown">
                    <div className="dropdown-item no-results">
                        Город не найден
                    </div>
                </div>
            )}
        </div>
    );
}