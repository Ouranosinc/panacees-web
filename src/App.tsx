import React, { useEffect, useState, FC } from 'react';
import { createHashHistory, Location } from 'history';
import UrlPattern from 'url-pattern'
import MarkdownPage from './MarkdownPage';
import { CellPage } from './CellPage';
import { SelectCell } from './SelectCell';

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

  // Render the main contents
  const renderContents = () => {
    // Check for match
    const match = (pattern: string) => new UrlPattern(pattern).match(location.pathname)
    let result

    if (match("/")) {
      return <div className="container">
        <MarkdownPage path="markdown/acceuil.md"/>
      </div>
    }

    if (match("/projet")) {
      return <div className="container">
        <MarkdownPage path="markdown/projet.md"/>
      </div>
    }

    if (match("/panacees")) {
      return <div className="container">
        <MarkdownPage path="markdown/panacees.md"/>
      </div>
    }

    if (match("/adaptation")) {
      return <div className="container">
        <MarkdownPage path="markdown/adaptation.md"/>
      </div>
    }

    if (match("/liens")) {
      return <div className="container">
        <MarkdownPage path="markdown/liens.md"/>
      </div>
    }

    if (match("/faq")) {
      return <div className="container">
        <MarkdownPage path="markdown/faq.md"/>
      </div>
    }

    if (match("/outil")) {
      return <SelectCell history={history}/>
    }
    
    result = match("/outil/:id")
    if (result) {
      return <CellPage history={history} cellId={result.id}/>
    }

    return <div>Page non trouvée</div>
  }

  return (
    <div>
      <Navbar location={location}/>
      <div style={{paddingTop: 56}}>
        {renderContents()}
      </div>
    </div>
  )
}

export default App;

/** Top navbar */
const Navbar = (props: { location: Location }) => {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark fixed-top">
      <div className="container-fluid">
        <a className="navbar-brand" href="#">
          <img src="ouranos.png" alt="Ouranos" style={{ position: "relative", display: "inline-block", top: -2, height: 27, left: -14, cursor: "pointer" }} />
        </a>
        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav mr-auto">
            <NavLink pattern="/" url="/" location={props.location}>
              Accueil
            </NavLink>
            <NavLink pattern="/projet" url="/projet" location={props.location}>
              Le projet
            </NavLink>
            <NavLink pattern="/panacees*" url="/panacees" location={props.location}>
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

/** Link in navbar which lights up based on URL */
const NavLink: FC<{ pattern: string, url: string, location: Location }> = (props) => {
  const active = new UrlPattern(props.pattern).match(props.location.pathname)

  return (
    <li className={ active ? "nav-item active" : "nav-item" }>
      <a className="nav-link" href={"#" + props.url}>{props.children}</a>
    </li>
  )
}

