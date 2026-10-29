import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Clock3, MapPin, ShieldCheck, Users } from 'lucide-react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatDate } from '../components/EventCard.jsx';
import Notice from '../components/Notice.jsx';

export default function EventDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [registered, setRegistered] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    const data = await api(`/events/${id}`);
    setEvent(data.event);
    if (user?.role === 'student') {
      const mine = await api('/registrations/mine');
      setRegistered(mine.registrations.some(r => r.event?._id === id && r.status === 'registered'));
    }
  }
  useEffect(() => { load().catch(err => setError(err.message)); }, [id, user?.id]);

  async function toggleRegistration() {
    if (!user) return navigate('/login', { state: { from: `/events/${id}` } });
    if (user.role !== 'student') return;
    setBusy(true); setError(''); setMessage('');
    try {
      if (registered) {
        const result = await api(`/registrations/${id}`, { method: 'DELETE' });
        setRegistered(false); setMessage(result.message);
      } else {
        const result = await api(`/registrations/${id}`, { method: 'POST' });
        setRegistered(true); setMessage(result.message);
      }
      await load();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  if (error && !event) return <div className="section"><Notice>{error}</Notice><Link to="/" className="button button-outline">Back to events</Link></div>;
  if (!event) return <div className="page-loading">Loading event…</div>;

  const remaining = Math.max(0, event.capacity - (event.registeredCount || 0));
  const started = new Date(event.startsAt) <= new Date();
  return (
    <section className="section detail-section">
      <Link to="/" className="back-link"><ArrowLeft size={16} /> All events</Link>
      <div className="detail-layout">
        <div className="detail-main">
          <div className="detail-image">{event.imageUrl ? <img src={event.imageUrl} alt="" /> : <div className="event-image-placeholder"><CalendarDays size={48} /></div>}<span className="category-pill">{event.category}</span></div>
          <div className="detail-copy"><div className="eyebrow"><span className="eyebrow-dot" /> THE CAMPUS CALENDAR</div><h1>{event.title}</h1><p className="detail-description">{event.description}</p><h3>About this event</h3><p className="detail-body">Make time for something new. Join fellow students, exchange ideas, and take part in an experience designed to bring your campus community together.</p><div className="detail-trust"><ShieldCheck size={18} /><span>Registration is managed securely through CampusConnect.</span></div></div>
        </div>
        <aside className="detail-sidebar">
          <div className="detail-info-card"><span className="sidebar-kicker">EVENT DETAILS</span><div className="info-row"><span className="info-icon"><CalendarDays size={18} /></span><div><small>DATE</small><b>{formatDate(event.startsAt)}</b></div></div><div className="info-row"><span className="info-icon"><Clock3 size={18} /></span><div><small>TIME</small><b>{new Date(event.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(event.endsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</b></div></div><div className="info-row"><span className="info-icon"><MapPin size={18} /></span><div><small>LOCATION</small><b>{event.venue}</b></div></div><div className="info-row"><span className="info-icon"><Users size={18} /></span><div><small>AVAILABILITY</small><b>{remaining} of {event.capacity} spots left</b></div></div><div className="capacity-track detail-capacity"><span style={{ width: `${Math.min(100, (event.registeredCount / event.capacity) * 100)}%` }} /></div><Notice type="success">{message}</Notice><Notice>{error}</Notice>
            {user?.role === 'admin' ? <Link className="button button-primary button-full" to={`/admin/events/${event._id}/edit`}>Edit event</Link> :
              <button className={`button ${registered ? 'button-outline' : 'button-primary'} button-full`} onClick={toggleRegistration} disabled={busy || started || (!registered && remaining === 0)}>{busy ? 'Please wait…' : started ? 'Registration closed' : registered ? 'Cancel registration' : remaining === 0 ? 'Event is full' : 'Register for event'}</button>}
            {!user && <p className="sidebar-note">You'll need an account to register. <Link to="/signup">Create one free</Link>.</p>}
            {registered && <p className="sidebar-note">You're on the list. You can manage this registration from My events.</p>}
          </div>
          <div className="sidebar-note-card"><span>✦</span><p><b>Show up curious.</b><br />You never know who you'll meet or what you'll learn.</p></div>
        </aside>
      </div>
    </section>
  );
}
