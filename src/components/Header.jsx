import { NavLink } from 'react-router-dom';

export default function Header() {
  return (
    <header>
      <nav>
        <div className="logo">
          <svg viewBox="0 0 64 64" fill="none">
            <path d="M32 6C18 6 8 16 8 32c0 14 9 26 24 26 2-11 3-19 11-27 5-5 13-8 13-8-3 16-9 24-19 29-6 3-13 2-18-3C12 42 9 35 11 27 14 14 22 6 32 6z" fill="#c8ff4d" />
          </svg>
          EcoRoute
        </div>
        <ul className="nav-links">
          <li><NavLink to="/">Home</NavLink></li>
          <li><NavLink to="/how-it-works">How it works</NavLink></li>
          <li><NavLink to="/extension">Extension</NavLink></li>
          <li><NavLink to="/dashboard">Dashboard</NavLink></li>
        </ul>
        <NavLink to="/product" className="btn">
          Get started
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
          </svg>
        </NavLink>
      </nav>
    </header>
  );
}
