// src/components/BookmarksList.jsx
import React from 'react';

export function BookmarksList({ bookmarks, onRemove, onSelect, isAuthenticated }) {

    // ========================================
    // ЗАЩИТА ОТ ОШИБОК
    // ========================================

    // Проверка 1: bookmarks существует и это массив
    if (!bookmarks || !Array.isArray(bookmarks)) {
        console.error('BookmarksList: bookmarks is not an array', bookmarks);
        return null; // Не рендерим ничего
    }

    // Проверка 2: функции существуют
    if (typeof onRemove !== 'function') {
        console.error('BookmarksList: onRemove is not a function');
        return null;
    }

    if (typeof onSelect !== 'function') {
        console.error('BookmarksList: onSelect is not a function');
        return null;
    }

    // ========================================
    // ПРОВЕРКА: Пользователь не авторизован
    // ========================================
    if (!isAuthenticated) {
        return (
            <div className="bookmarks-container">
                <div className="bookmarks-empty">
                    <img src="/bookmark.png" alt="bookmark" className="empty-icon" />
                    <p className="empty-text">Войдите, чтобы сохранять города</p>
                </div>
            </div>
        );
    }

    // ========================================
    // ПРОВЕРКА: Нет сохранённых закладок
    // ========================================
    if (bookmarks.length === 0) {
        return (
            <div className="bookmarks-container">
                <h3 className="bookmarks-title">Сохранённые города</h3>
                <div className="bookmarks-empty">
                    <img src="/bookmark.png" alt="bookmark" className="empty-icon" />
                    <p className="empty-text">Закладок пока нет</p>
                    <p className="empty-hint">Добавьте города для быстрого доступа</p>
                </div>
            </div>
        );
    }

    // ========================================
    // ОСНОВНОЙ РЕНДЕР: Список закладок
    // ========================================
    return (
        <div className="bookmarks-container">
            <h3 className="bookmarks-title">
                Сохранённые города
                <span className="bookmarks-count">({bookmarks.length})</span>
            </h3>

            <div className="bookmarks-list">
                {bookmarks.map((bookmark) => {
                    // Проверка: у закладки есть ID
                    if (!bookmark || !bookmark.id) {
                        console.error('Invalid bookmark:', bookmark);
                        return null;
                    }

                    return (
                        <div
                            key={bookmark.id}
                            className="bookmark-card"
                        >
                            {/* Информация о городе */}
                            <button
                                onClick={() => onSelect(bookmark.city)}
                                className="bookmark-info"
                                title={`Показать погоду в ${bookmark.city}`}
                            >
                                <div className="bookmark-city">{bookmark.city || 'Неизвестный город'}</div>
                                <div className="bookmark-details">
                                    <span className="bookmark-temp">
                                        {bookmark.temperature || '--'}°
                                    </span>
                                    <span className="bookmark-condition">
                                        {bookmark.condition || 'Нет данных'}
                                    </span>
                                </div>
                                <div className="bookmark-date">
                                    Добавлено: {formatDate(bookmark.addedAt)}
                                </div>
                            </button>

                            {/* Кнопка удаления */}
                            <button
                                onClick={() => onRemove(bookmark.id)}
                                className="bookmark-remove"
                                title="Удалить из закладок"
                            >
                                <span className="remove-icon">🗑️</span>
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// Вспомогательная функция форматирования даты
function formatDate(isoString) {
    if (!isoString) return 'Неизвестно';

    try {
        const date = new Date(isoString);
        const options = {
            month: 'short',
            day: 'numeric'
        };
        return date.toLocaleDateString('ru-RU', options);
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Неизвестно';
    }
}