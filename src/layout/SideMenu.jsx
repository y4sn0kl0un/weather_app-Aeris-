import "./sidemenu.css";

export function SideMenu({image}) {
  return (
    <aside>
        <div className="side-container">
            <div className="logo">
                <img src={image} alt="logo" />

            </div>

            <div className="navigation">
                <div className="moreOptions">
                       <button>
                          <img src="/more.svg" alt=""/>
                       </button>
                </div>
                    <div className="geo">
                        <button>
                            <img src="/geo.svg" alt=""/>
                        </button>
                    </div>


          <div className="settings">
                    <button>
                        <img src="/settings.svg" alt=""/>
                    </button>
                </div>


            </div>

            <div className="logout">
                <button>
                    <img src="/logout.svg" alt=""/>
                </button>
            </div>
        </div>




    </aside>
  )
}