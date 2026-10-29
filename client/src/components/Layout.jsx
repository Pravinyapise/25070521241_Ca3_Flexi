import { Link, NavLink, useNavigate } from 'react-router-dom';
import { CalendarDays, LayoutDashboard, LogOut, Plus, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  function signOut() {
    logout();
    navigate('/');
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/">
          <span className="brand-mark"><Sparkles size={19} /></span>
          <span>campus<span className="brand-accent">connect</span></span>
        </Link>
        <nav className="nav-links">
          <NavLink to="/" end>Discover</NavLink>
          {user?.role === 'student' && <NavLink to="/my-events">My events</NavLink>}
          {user?.role === 'admin' && <NavLink to="/admin"><LayoutDashboard size={16} /> Dashboard</NavLink>}
        </nav>
        <div className="top-actions">
          {user ? (
            <>
              <div className="user-chip"><span className="avatar">{user.name?.charAt(0)?.toUpperCase()}</span><span className="user-name">{user.name}</span></div>
              {user.role === 'admin' && <Link className="button button-primary button-small" to="/admin/events/new"><Plus size={16} /> Create event</Link>}
              <button className="icon-button" onClick={signOut} title="Sign out" aria-label="Sign out"><LogOut size={18} /></button>
            </>
          ) : (
            <>
              <Link className="nav-login" to="/login">Log in</Link>
              <Link className="button button-primary button-small" to="/signup">Get started</Link>
            </>
          )}
        </div>
      </header>
      <main>{children}</main>
      <footer className="footer">
        <Link className="brand footer-brand" to="/"><span className="brand-mark"><CalendarDays size={17} /></span><span>campus<span className="brand-accent">connect</span></span></Link>
        <span>Make campus life count.</span>
        <span>© {new Date().getFullYear()} CampusConnect</span>
      </footer>
    </div>
  );
}
