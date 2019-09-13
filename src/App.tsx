import React, { useEffect, useState, FC } from 'react';
import './App.css';
import { createHashHistory, Location } from 'history';
import UrlPattern from 'url-pattern'

const history = createHashHistory()

const App = () => {
  const [location, setLocation] = useState(history.location)

  useEffect(() => {
    // Listen for changes to the current location.
    const unlisten = history.listen((location) => {
      setLocation(location)
    })
    return unlisten
  }, [])

  return (
    <div>
      <Navbar location={location}/>
      <div className="container">
        <h1>{location.pathname}</h1>
      </div>
    </div>
  )
}

export default App;


const NavLink: FC<{ pattern: string, url: string, location: Location }> = (props) => {
  const active = new UrlPattern(props.pattern).match(props.location.pathname)

  return (
    <li className={ active ? "nav-item active" : "nav-item" }>
      <a className="nav-link" href={"#" + props.url}>{props.children}</a>
    </li>
  )
}


const Navbar = (props: { location: Location }) => {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <a className="navbar-brand" tabIndex={1}>Ouranos</a>
        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav mr-auto">
            <NavLink pattern="/" url="/" location={props.location}>
              Accueil
            </NavLink>
            <NavLink pattern="/" url="/projet" location={props.location}>
              Le projet
            </NavLink>
            <NavLink pattern="/panacees" url="/panacees" location={props.location}>
              PANACÉES
            </NavLink>
            <NavLink pattern="/adaptation" url="/adaptation" location={props.location}>
              Vers l'adaptation
            </NavLink>
            <NavLink pattern="/liens" url="/liens" location={props.location}>
              Liens utiles
            </NavLink>
            <NavLink pattern="/faq" url="/faq" location={props.location}>
              FAQ
            </NavLink>
          </ul>
        </div>
      </div>
    </nav>)
}