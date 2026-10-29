import { useEffect, useState } from 'react';
import { CalendarDays, MapPin, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { formatDate } from '../components/EventCard.jsx';
import Notice from '../components/Notice.jsx';

export default function MyEvents() {
  const [registrations, setRegistrations] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busyId, setBusyId] = useState('');

  async function load() {
    const data = await api('/registrations/mine');
    setRegistrations(data.registrations);
  }
  useEffect(() => { load().catch(err => setError(err.message)); }, []);

  async function cancel(id) {
    setBusyId(id); setError(''); setMessage('');
    try {
      const result = await api(`/registrations/${id}`, { method: 'DELETE' });
      setMessage(result.message);
      await load();
    } catch (err) { setError(err.message); }
    finally { setBusyId(''); }
  }

  const active = registrations.filter(r => r.status === 'registered');
  const past = registrations.filter(r => r.status !== 'registered');
  return <section className="section my-events-section">
    <div className="eyebrow"><span className="eyebrow-dot" /> YOUR CAMPUS STORY</div><h1 className="page-title">My <span className="gradient-text">events.</span></h1><p className="page-lead">All your campus plans, in one place.</p>
    <Notice>{error}</Notice><Notice type="success">{message}</Notice>
    <div className="subsection-heading"><h2>Coming up <span className="count-badge">{active.length}</span></h2><Link className="text-link" to="/">Find more events ↗</Link></div>
    {!active.length ? <div className="empty-state"><span className="empty-icon"><CalendarDays size={26} /></span><h3>Your next adventure is out there</h3><p>You haven't registered for an upcoming event yet.</p><Link className="button button-primary" to="/">Explore events</Link></div> :
      <div className="registration-list">{active.map(reg => reg.event && <article className="registration-card" key={reg._id}><div className="registration-thumb">{reg.event.imageUrl ? <img src={reg.event.imageUrl} alt="" /> : <CalendarDays />}</div><div className="registration-info"><span className="category-text">{reg.event.category}</span><Link to={`/events/${reg.event._id}`}><h3>{reg.event.title}</h3></Link><p><CalendarDays size={14} /> {formatDate(reg.event.startsAt)} <span>·</span> <MapPin size={14} /> {reg.event.venue}</p></div><span className="status-pill"><i /> Registered</span><button className="icon-button cancel-button" onClick={() => cancel(reg.event._id)} disabled={busyId === reg.event._id} aria-label="Cancel registration" title="Cancel registration"><XCircle size={18} /></button></article>)}</div>}
    {past.length > 0 && <><div className="subsection-heading past-heading"><h2>Cancelled registrations <span className="count-badge">{past.length}</span></h2></div><div className="registration-list">{past.map(reg => <article className="registration-card muted-card" key={reg._id}><div className="registration-thumb">{reg.event?.imageUrl ? <img src={reg.event.imageUrl} alt="" /> : <CalendarDays />}</div><div className="registration-info"><span className="category-text">{reg.event?.category || 'Event'}</span><h3>{reg.event?.title || 'Deleted event'}</h3><p>{reg.event?.startsAt ? formatDate(reg.event.startsAt) : 'Event unavailable'}</p></div><span className="status-pill status-cancelled">Cancelled</span></article>)}</div></>}
  </section>;
}
