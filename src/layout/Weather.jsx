import "./Weather.css"
import {useEffect, useState} from "react";

export function Weather({
                            currentLocation,
                            image,
                            date,
                            temperature,
                            feelDegree,
                            condition,
                            lowDegree,
                            highDegree,
                            bookmark,
                            // ========================================
                            // НОВЫЕ ПРОПСЫ для работы с закладками
                            // ========================================
                            bookmarked,        // Иконка "уже в закладках"
                            isAuthenticated,   // Авторизован ли пользователь?
                            onAddBookmark,     // Функция добавления закладки
                            isBookmarked       // Проверка: этот город уже в закладках?
                        }) {

    const API_URL = "https://backend-production-78d0.up.railway.app";

    const [data, setData] = useState(null);

    useEffect(() => {
        fetch(`${API_URL}/api/weather?city=Seoul`)
            .then(res => res.json())
            .then(data => {
                console.log(data);
                setData(data);
            })
            .catch(err => console.log("Weatherfetch error", err));
    }, [])

    // ========================================
    // ОБРАБОТЧИК КЛИКА ПО КНОПКЕ ЗАКЛАДКИ
    // ========================================
    const handleBookmarkClick = () => {
        // Шаг 1: Проверяем авторизацию
        if (!isAuthenticated) {
            alert('Пожалуйста, войдите в систему для сохранения закладок');
            return; // Прерываем функцию
        }

        // Шаг 2: Вызываем функцию из App.jsx
        // Она добавит или удалит закладку
        onAddBookmark();
    };

    return (
        <div className="weather-info">

            <div className="current-location">
                <h4>
                    {currentLocation}

                    {/* ========================================
                        ОБНОВЛЁННАЯ КНОПКА ЗАКЛАДКИ
                        ======================================== */}
                    <button
                        onClick={handleBookmarkClick}
                        className={`bookmark-btn ${isBookmarked ? 'active' : ''}`}
                        title={isBookmarked ? 'Удалить из закладок' : 'Добавить в закладки'}
                    >
                        {/* Показываем разные иконки в зависимости от состояния */}
                        <img
                            src={isBookmarked ? bookmarked : bookmark}
                            alt="bookmark"
                        />
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
                    <img src={image} alt="weather icon"/>
                </div>

                <div className="condition">
                    {condition}
                    <p>Feels like: {feelDegree}</p>
                </div>
            </div>

        </div>
    );
}

/**
 * ========================================
 * РАЗБОР ИЗМЕНЕНИЙ
 * ========================================
 *
 * 1. НОВЫЕ ПРОПСЫ
 *    - bookmarked: путь к иконке "заполненная звезда"
 *    - isAuthenticated: boolean (true/false)
 *    - onAddBookmark: функция из App.jsx
 *    - isBookmarked: boolean - проверка состояния
 *
 * 2. handleBookmarkClick()
 *    Эта функция выполняется при клике на кнопку:
 *
 *    a) Проверяет авторизацию
 *       if (!isAuthenticated) - если НЕ авторизован
 *       alert() - показывает предупреждение
 *       return - останавливает выполнение
 *
 *    b) Вызывает onAddBookmark()
 *       Эта функция приходит из App.jsx
 *       Она решает: добавить или удалить закладку
 *
 * 3. УСЛОВНЫЙ РЕНДЕР ИКОНКИ
 *    src={isBookmarked ? bookmarked : bookmark}
 *
 *    Как это работает:
 *    - Если isBookmarked = true → показываем "bookmarked"
 *    - Если isBookmarked = false → показываем "bookmark"
 *
 *    Это называется ТЕРНАРНЫЙ ОПЕРАТОР:
 *    условие ? еслиTrue : еслиFalse
 *
 * 4. ДИНАМИЧЕСКИЙ КЛАСС
 *    className={`bookmark-btn ${isBookmarked ? 'active' : ''}`}
 *
 *    Template literal (обратные кавычки):
 *    - Всегда добавляется класс 'bookmark-btn'
 *    - Если isBookmarked = true, добавляется 'active'
 *    - Если isBookmarked = false, ничего не добавляется
 *
 *    Примеры результата:
 *    isBookmarked = false → className="bookmark-btn"
 *    isBookmarked = true → className="bookmark-btn active"
 *
 * 5. TITLE АТРИБУТ
 *    title={isBookmarked ? 'Удалить...' : 'Добавить...'}
 *
 *    Показывает подсказку при наведении мыши
 *    Текст меняется в зависимости от состояния
 */