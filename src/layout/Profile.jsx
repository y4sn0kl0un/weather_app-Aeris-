import { useState, useEffect, useRef } from "react";
import "./Profile.css";

export function Profile({ image, username, isAuthenticated, onLogin, onLogout }) {
    const [showDropdown, setShowDropdown] = useState(false);
    const profileRef = useRef(null);

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

    const handleLogin = (e) => {
        e.stopPropagation(); // ✅ Предотвращаем закрытие dropdown
        const user = {
            id: 'user_' + Date.now(),
            username: 'TestUser'
        };
        localStorage.setItem('user', JSON.stringify(user));
        onLogin(user);
        setShowDropdown(false);
    };

    const handleLogout = (e) => {
        e.stopPropagation(); // ✅ Предотвращаем закрытие dropdown
        localStorage.removeItem('user');
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
                        <div className="dropdown-item" onClick={handleLogin}>
                            <div className="item-name"> Login</div>
                        </div>
                    ) : (
                        <>
                            <div className="dropdown-item">
                                <div className="item-name"> Settings</div>
                            </div>
                            <div className="dropdown-item" onClick={handleLogout}>
                                <div className="item-name"> Logout</div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}