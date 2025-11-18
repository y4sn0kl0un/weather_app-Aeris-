import { useState, useEffect, useRef } from "react";
import "./Profile.css";

export function Profile({ image, username, isAuthenticated, onLogin, onLogout }) {
    const [showDropdown, setShowDropdown] = useState(false);
    const profileRef = useRef(null);

    // ✅ Обработка токена из URL при возврате от Google
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get("token");

        if (token) {
            // Сохраняем токен
            localStorage.setItem("token", token);

            // Получаем данные пользователя с бэкенда
            fetch("http://your-backend.com/api/user/me", {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            })
                .then(res => res.json())
                .then(userData => {
                    // Сохраняем данные пользователя
                    localStorage.setItem("user", JSON.stringify(userData));

                    // Вызываем onLogin чтобы обновить состояние в родительском компоненте
                    onLogin(userData);

                    // Очищаем URL от параметра token
                    window.history.replaceState({}, document.title, window.location.pathname);
                })
                .catch(error => {
                    console.error("Error fetching user data:", error);
                    localStorage.removeItem("token");
                });
        }
    }, [onLogin]);

    // ✅ Закрытие dropdown при клике вне профиля
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

    // ✅ Авторизация через Google
    const handleGoogleLogin = (e) => {
        e.stopPropagation();
        // Редирект на ваш бэкенд для начала OAuth flow
        window.location.href = "https://aeris-75gf.onrender.com/auth/google/login";
    };

    const handleLogout = (e) => {
        e.stopPropagation();
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
            className={`profile ${isAuthenticated ? 'authenticated' : 'guest'}`}
            onClick={toggleDropdown}
        >
            <img src={image} alt="Profile" className="profile-pic" />
            <h3 className="username">{isAuthenticated ? username : 'Guest'}</h3>

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