// src/hooks/useBookmarks.js
import { useState, useEffect } from 'react';

/**
 * Кастомный хук для управления закладками городов
 * @param {string} userId - ID текущего пользователя
 * @returns {Object} - Объект с закладками и функциями управления
 */
export function useBookmarks(userId) {
    // Состояние для хранения массива закладок
    const [bookmarks, setBookmarks] = useState([]);

    // Генерация уникального ключа для localStorage
    // Каждый пользователь имеет свои закладки
    const getStorageKey = () => {
        return userId ? `weather_bookmarks_${userId}` : 'weather_bookmarks_guest';
    };

    // Загрузка закладок из localStorage при монтировании компонента
    useEffect(() => {
        const storageKey = getStorageKey();
        const saved = localStorage.getItem(storageKey);

        if (saved) {
            try {
                const parsedBookmarks = JSON.parse(saved);
                setBookmarks(parsedBookmarks);
                console.log('Закладки загружены:', parsedBookmarks.length);
            } catch (error) {
                console.error('Ошибка загрузки закладок:', error);
                setBookmarks([]);
            }
        }
    }, [userId]);

    // Функция добавления закладки
    const addBookmark = (cityData) => {
        // Проверка: город уже в закладках?
        const exists = bookmarks.some(b =>
            b.city.toLowerCase() === cityData.city.toLowerCase()
        );

        if (exists) {
            console.log('Город уже в закладках:', cityData.city);
            return;
        }

        // Создаём новую закладку
        const newBookmark = {
            id: Date.now(),
            city: cityData.city,
            temperature: cityData.temperature,
            condition: cityData.condition,
            date: cityData.date,
            addedAt: new Date().toISOString()
        };

        // Создаём новый массив с добавленной закладкой
        const newBookmarks = [...bookmarks, newBookmark];

        // Обновляем состояние
        setBookmarks(newBookmarks);

        // Сохраняем в localStorage
        const storageKey = getStorageKey();
        localStorage.setItem(storageKey, JSON.stringify(newBookmarks));

        console.log('Закладка добавлена:', cityData.city);
    };

    // Функция удаления закладки
    const removeBookmark = (bookmarkId) => {
        // Фильтруем массив, убирая закладку с данным ID
        const newBookmarks = bookmarks.filter(bookmark => bookmark.id !== bookmarkId);

        // Обновляем состояние
        setBookmarks(newBookmarks);

        // Сохраняем в localStorage
        const storageKey = getStorageKey();
        localStorage.setItem(storageKey, JSON.stringify(newBookmarks));

        console.log('Закладка удалена, ID:', bookmarkId);
    };

    // Функция проверки: есть ли город в закладках
    const isBookmarked = (cityName) => {
        return bookmarks.some(bookmark =>
            bookmark.city.toLowerCase() === cityName.toLowerCase()
        );
    };

    // Функция получения ID закладки по имени города
    const getBookmarkId = (cityName) => {
        const bookmark = bookmarks.find(b =>
            b.city.toLowerCase() === cityName.toLowerCase()
        );
        return bookmark ? bookmark.id : null;
    };

    // Возвращаем объект с данными и функциями
    return {
        bookmarks,
        addBookmark,
        removeBookmark,
        isBookmarked,
        getBookmarkId,
        bookmarksCount: bookmarks.length
    };
}