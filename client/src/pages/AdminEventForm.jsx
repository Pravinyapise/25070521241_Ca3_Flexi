import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { api } from '../api.js';
import Notice from '../components/Notice.jsx';

const initial = { title: '', description: '', category: 'Technology', venue: '', startsAt: '', endsAt: '', capacity: '100', imageUrl: '' };
function toLocalInput(value) {
  const d = new Date(value);
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
}

export default function AdminEventForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!editing) return;
    api(`/events/${id}`).then(({ event }) => setForm({
      title: event.title, description: event.description, category: event.category, venue: event.venue,
      startsAt: toLocalInput(event.startsAt), endsAt: toLocalInput(event.endsAt),
      capacity: String(event.capacity), imageUrl: event.imageUrl || ''
    })).catch(err => setError(err.message));
  }, [id, editing]);

  function change(e) { setForm(old => ({ ...old, [e.target.name]: e.target.value })); }

  async function submit(e) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const payload = { ...form, capacity: Number(form.capacity), startsAt: new Date(form.startsAt).toISOString(), endsAt: new Date(form.endsAt).toISOString() };
      if (editing) await api(`/events/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
      else await api('/events', { method: 'POST', body: JSON.stringify(payload) });
      navigate('/admin');
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  return <section className="section form-page"><Link to="/admin" className="back-link"><ArrowLeft size={16} /> Admin dashboard</Link><div className="eyebrow"><span className="eyebrow-dot" /> EVENT MANAGEMENT</div><h1 className="page-title">{editing ? 'Edit your ' : 'Create an '}<span className="gradient-text">event.</span></h1><p className="page-lead">Give your campus something to look forward to.</p><div className="form-panel"><Notice>{error}</Notice><form onSubmit={submit} className="event-form">
    <label className="form-label">Event title<input className="text-input" name="title" value={form.title} onChange={change} required minLength={3} maxLength={120} placeholder="e.g. AI & Future Tech Summit" /></label>
    <label className="form-label">Description<textarea className="text-input" name="description" value={form.description} onChange={change} required minLength={10} maxLength={5000} rows={5} placeholder="What will students experience at this event?" /></label>
    <div className="form-two-col"><label className="form-label">Category<select className="text-input" name="category" value={form.category} onChange={change}>{['Technology', 'Cultural', 'Workshop', 'Sports', 'Business', 'Other'].map(c => <option key={c}>{c}</option>)}</select></label><label className="form-label">Venue<input className="text-input" name="venue" value={form.venue} onChange={change} required minLength={2} maxLength={180} placeholder="e.g. Main Auditorium" /></label></div>
    <div className="form-two-col"><label className="form-label">Starts at<input className="text-input" type="datetime-local" name="startsAt" value={form.startsAt} onChange={change} required /></label><label className="form-label">Ends at<input className="text-input" type="datetime-local" name="endsAt" value={form.endsAt} onChange={change} required /></label></div>
    <div className="form-two-col"><label className="form-label">Participant capacity<input className="text-input" type="number" name="capacity" value={form.capacity} onChange={change} required min="1" max="100000" /></label><label className="form-label">Image URL <span className="optional-label">optional</span><input className="text-input" type="url" name="imageUrl" value={form.imageUrl} onChange={change} placeholder="https://…" /></label></div>
    <div className="form-footer"><span>Double-check dates and capacity before publishing.</span><button className="button button-primary" disabled={busy} type="submit"><Save size={16} /> {busy ? 'Saving…' : editing ? 'Save changes' : 'Publish event'}</button></div>
  </form></div></section>;
}
