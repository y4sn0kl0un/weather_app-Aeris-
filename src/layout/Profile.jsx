import "./Profile.css"

export function Profile({image, username}) {
    return (
        <div className="profile">
            <img src={image} alt="Profile"
                 className="profile-pic" />
            <div className="username">
                <h3>{username}</h3>
            </div>
        </div>
    );
}