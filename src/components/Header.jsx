import { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isHomePage = location.pathname === '/';

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
          <li><NavLink to="/" end>Home</NavLink></li>
          <li><NavLink to="/how-it-works">How it works</NavLink></li>
          <li><NavLink to="/extension">Extension</NavLink></li>
          <li><NavLink to="/dashboard">Dashboard</NavLink></li>
        </ul>

        <div className="header-auth-slot">
          {isAuthenticated ? (
            <div className="profile-container" ref={menuRef}>
              <button 
                className={`profile-trigger ${menuOpen ? 'active' : ''}`}
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="User profile menu"
                aria-expanded={menuOpen}
              >
                <div className="profile-avatar">
                  {user?.initial || (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  )}
                </div>
                <span className="profile-status-dot"></span>
              </button>

              {menuOpen && (
                <div className="profile-dropdown">
                  <div className="profile-header-info">
                    <div className="profile-user-name">{user?.name || 'EcoRoute User'}</div>
                    <div className="profile-user-email">{user?.email}</div>
                    <span className="profile-user-tag">Member</span>
                  </div>
                  <div className="profile-dropdown-divider"></div>
                  <button 
                    className="profile-logout-btn" 
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Log out
                  </button>
                </div>
              )}
            </div>
          ) : isHomePage ? (
            <NavLink to="/signin" className="btn">
              Get started
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
              </svg>
            </NavLink>
          ) : null}
        </div>
      </nav>
    </header>
  );
}
