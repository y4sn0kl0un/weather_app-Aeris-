import "./SideMenu.css";

export function SideMenu({city, temperature, image}) {
  return (
    <aside>
        <div className="side-container">
            <div className="logo">
                <img src={image} alt="logo" />
            </div>
            <div className="cities-logout">

                <div className="city-container">

                    <div className="city-name">
                        <h2>{city}</h2>

                    </div>

                    <div className="city-temp">
                        <p>{temperature}</p>
                    </div>


                </div>

                <div className="logout">
                    <button>
                        <img src="/logout.svg" alt=""/>
                    </button>
                </div>
            </div>



        </div>




    </aside>
  )
}