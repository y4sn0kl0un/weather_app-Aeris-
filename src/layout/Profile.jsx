import { useState, useEffect, useRef } from "react";
import "./Profile.css";

export function Profile({
                            image,
                            username,
                            isAuthenticated,
                            onLogin,
                            onLogout,
                            setIsAuthenticated,
                            setCurrentUser
                        }) {
    const API_URL = "https://aeris-75gf.onrender.com";

    const [showDropdown, setShowDropdown] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const profileRef = useRef(null);

    // Обработка OAuth callback от Google
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get("token");

        if (token && !isLoading) {
            setIsLoading(true);
            console.log("✅ Token получен из URL:", token);
            localStorage.setItem("token", token);

            // Теперь используем правильный endpoint
            const userEndpoint = `${API_URL}/auth/me`;
            console.log(`📡 Запрашиваем данные с: ${userEndpoint}`);

            fetch(userEndpoint, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })
                .then(res => {
                    console.log(`📡 Ответ от сервера: ${res.status} ${res.statusText}`);

                    if (!res.ok) {
                        throw new Error(`HTTP error! status: ${res.status}`);
                    }
                    return res.json();
                })
                .then(user => {
                    console.log("✅ Данные пользователя получены:", user);

                    // Сохраняем данные пользователя
                    localStorage.setItem("user", JSON.stringify(user));

                    setIsAuthenticated(true);
                    setCurrentUser(user);
                    onLogin(user);

                    // Очищаем URL от токена
                    window.history.replaceState({}, document.title, window.location.pathname);
                    setIsLoading(false);
                })
                .catch(err => {
                    console.error("❌ Ошибка получения данных пользователя:", err);
                    console.error("❌ Детали:", err.message);

                    // Очищаем токен при ошибке
                    localStorage.removeItem('token');
                    setIsAuthenticated(false);
                    setIsLoading(false);

                    alert("Ошибка авторизации. Попробуйте снова.");
                });
        }
    }, [API_URL, setIsAuthenticated, setCurrentUser, onLogin, isLoading]);

    // Закрытие dropdown при клике вне его
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        if (showDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showDropdown]);

    const handleGoogleLogin = (e) => {
        e.stopPropagation();
        const loginUrl = `${API_URL}/auth/google/login`;
        console.log("🔄 Перенаправление на:", loginUrl);
        window.location.href = loginUrl;
    };

    const handleLogout = (e) => {
        e.stopPropagation();
        console.log("👋 Выход из системы");
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        onLogout();
        setShowDropdown(false);
    };

    const toggleDropdown = () => {
        setShowDropdown(!showDropdown);
    };

    return (
        <div
            ref={profileRef}
            className={`profile ${isAuthenticated ? 'authenticated' : 'username'}`}
            onClick={toggleDropdown}
        >
            {isLoading ? (
                <div className="loading-spinner">Загрузка...</div>
            ) : (
                <>
                    <img
                        src={image}
                        alt="Profile"
                        className="profile-pic"
                        onError={(e) => {
                            console.log("⚠️ Ошибка загрузки изображения, использую default");
                            e.target.src = "/default.svg";
                        }}
                    />
                    <h3 className="username">{username}</h3>
                </>
            )}

            {showDropdown && (
                <div className="dropdown" onClick={(e) => e.stopPropagation()}>
                    {!isAuthenticated ? (
                        <div className="dropdown-item">
                            <button className="google-login-btn" onClick={handleGoogleLogin}>
                                Login via Google
                            </button>
                        </div>
                    ) : (
                        <div className="dropdown-item" onClick={handleLogout}>
                            <div className="item-name">Logout</div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}