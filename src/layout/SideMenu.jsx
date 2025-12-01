// src/layout/SideMenu.jsx
import "./SideMenu.css";

export function SideMenu({
                             image,
                             bookmarks = [],
                             onCitySelect,
                             onRemoveBookmark,
                             isAuthenticated
                         }) {

    if (!Array.isArray(bookmarks)) {
        console.error('bookmarks is not array!');
        return null;
    }
    return (
        <aside>
            <div className="side-container">
                <div className="logo">
                    <img src={image} alt="logo" />
                </div>

                <div className="cities-logout">

                    <div className="current-city-header">

                    </div>




                        {isAuthenticated && bookmarks.length > 0 && (
                            <div className="bookmarks-list-side">
                                {bookmarks.map((bookmark) => (
                                    <div
                                        key={bookmark.id}
                                        className="bookmark-item-side"
                                    >
                                        <button
                                            onClick={() => onCitySelect(bookmark.city)}
                                            className="bookmark-btn-side"
                                        >
                                        <span className="bookmark-city-name">
                                            {bookmark.city}
                                        </span>
                                            <span className="bookmark-temp-side">
                                            {bookmark.temperature}°
                                        </span>
                                        </button>

                                        <button
                                            onClick={() => onRemoveBookmark(bookmark.id)}
                                            className="bookmark-remove-side"
                                            title="Удалить"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                    {/* Кнопка выхода */}
                    <div className="logout">
                        <button>
                            <img src="/logout.svg" alt="logout"/>
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    );
}

/**
 * ========================================
 * ОБЪЯСНЕНИЕ ИЗМЕНЕНИЙ
 * ========================================
 *
 * 1. НОВЫЕ ПРОПСЫ
 *    bookmarks - массив сохранённых городов
 *    onCitySelect - функция для загрузки погоды города
 *    onRemoveBookmark - функция удаления закладки
 *    isAuthenticated - проверка авторизации
 *
 * 2. УСЛОВНЫЙ РЕНДЕР
 *    {!isAuthenticated && <...>} - если НЕ авторизован
 *    {bookmarks.length === 0 && <...>} - если нет закладок
 *    {bookmarks.length > 0 && <...>} - если есть закладки
 *
 * 3. MAP для списка
 *    bookmarks.map() - для каждой закладки создаём элемент
 *    key={bookmark.id} - уникальный ключ для React
 *
 * 4. СТРУКТУРА
 *    - Текущий город (заголовок)
 *    - Список сохранённых городов
 *    - Кнопка выхода
 */