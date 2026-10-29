import { useEffect, useState } from 'react';
import { ArrowDownToLine, ArrowUpRight, CalendarDays, ChartNoAxesCombined, CirclePlus, Users, UserRoundCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api, API_URL, getToken } from '../api.js';
import { formatDate } from '../components/EventCard.jsx';
import Notice from '../components/Notice.jsx';

function StatCard({ icon: Icon, label, value, note }) {
  return <div className="stat-card"><div className="stat-card-top"><span>{label}</span><span className="stat-icon"><Icon size={19} /></span></div><div className="stat-value">{value ?? '—'}</div><div className="stat-note">{note}</div></div>;
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState('');

  async function load() {
    const [analytics, eventData] = await Promise.all([api('/admin/analytics'), api('/events?limit=100')]);
    setData(analytics);
    setEvents(eventData.events);
  }
  useEffect(() => { load().catch(err => setError(err.message)); }, []);

  async function deleteEvent(id) {
    if (!window.confirm('Delete this event and all its registrations? This cannot be undone.')) return;
    setDeleting(id); setError('');
    try { await api(`/events/${id}`, { method: 'DELETE' }); await load(); }
    catch (err) { setError(err.message); }
    finally { setDeleting(''); }
  }

  async function exportCsv() {
    try {
      const response = await fetch(`${API_URL}/admin/registrations.csv`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || 'Export failed');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url; anchor.download = 'campusconnect-registrations.csv'; anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) { setError(err.message); }
  }

  const summary = data?.summary;
  return <section className="section admin-section">
    <div className="admin-heading"><div><div className="eyebrow"><span className="eyebrow-dot" /> CONTROL CENTER</div><h1 className="page-title">Admin <span className="gradient-text">overview.</span></h1><p className="page-lead">A pulse on your campus community.</p></div><Link to="/admin/events/new" className="button button-primary"><CirclePlus size={17} /> Create event</Link></div>
    <Notice>{error}</Notice>
    <div className="stats-grid">
      <StatCard icon={Users} label="Student accounts" value={summary?.totalUsers} note="Registered students" />
      <StatCard icon={CalendarDays} label="Total events" value={summary?.totalEvents} note="Across all categories" />
      <StatCard icon={UserRoundCheck} label="Active registrations" value={summary?.activeRegistrations} note="Students signed up" />
      <StatCard icon={ChartNoAxesCombined} label="Upcoming events" value={summary?.upcomingEvents} note="Still ahead on the calendar" />
    </div>
    <div className="admin-content-grid">
      <div className="panel analytics-panel"><div className="panel-heading"><div><span className="panel-kicker">EVENT MIX</span><h2>Events by category</h2></div><span className="panel-heading-icon"><ChartNoAxesCombined size={18} /></span></div>
        {data?.categoryStats?.length ? <div className="bar-chart">{data.categoryStats.map(item => { const max = Math.max(...data.categoryStats.map(x => x.count), 1); return <div className="bar-row" key={item.category}><div className="bar-label"><span>{item.category}</span><b>{item.count}</b></div><div className="bar-track"><span style={{ width: `${(item.count / max) * 100}%` }} /></div></div>; })}</div> : <div className="chart-empty">Create events to see category analytics.</div>}
      </div>
      <div className="panel popular-panel"><div className="panel-heading"><div><span className="panel-kicker">WHAT'S TRENDING</span><h2>Popular events</h2></div></div>
        {data?.eventStats?.length ? <div className="popular-list">{data.eventStats.map((item, i) => <div className="popular-item" key={item.title}><span className="popular-rank">0{i + 1}</span><div className="popular-info"><b>{item.title}</b><div className="popular-track"><span style={{ width: `${Math.min(100, item.registrations / Math.max(item.capacity, 1) * 100)}%` }} /></div></div><span className="popular-count">{item.registrations}</span></div>)}</div> : <div className="chart-empty">Registration activity will appear here.</div>}
      </div>
    </div>
    <div className="panel event-management-panel"><div className="panel-heading"><div><span className="panel-kicker">YOUR PROGRAMMING</span><h2>Manage events</h2></div><div className="panel-actions"><button className="button button-outline button-small" onClick={exportCsv}><ArrowDownToLine size={15} /> Export registrations</button><Link className="text-link" to="/">View public site <ArrowUpRight size={15} /></Link></div></div>
      <div className="table-wrap"><table className="admin-table"><thead><tr><th>Event</th><th>Category</th><th>Date</th><th>Capacity</th><th>Actions</th></tr></thead><tbody>{events.map(event => <tr key={event._id}><td><div className="table-event"><span className="table-event-thumb">{event.imageUrl ? <img src={event.imageUrl} alt="" /> : <CalendarDays size={16} />}</span><b>{event.title}</b></div></td><td><span className="table-category">{event.category}</span></td><td>{formatDate(event.startsAt)}</td><td>{event.registeredCount || 0} / {event.capacity}</td><td><div className="table-actions"><Link to={`/admin/events/${event._id}/edit`}>Edit</Link><button onClick={() => deleteEvent(event._id)} disabled={deleting === event._id}>{deleting === event._id ? '…' : 'Delete'}</button></div></td></tr>)}</tbody></table>{!events.length && <div className="chart-empty">No events yet. Create your first event.</div>}</div>
    </div>
    <div className="panel recent-panel"><div className="panel-heading"><div><span className="panel-kicker">LATEST ACTIVITY</span><h2>Recent registrations</h2></div></div>
      {data?.recentRegistrations?.length ? <div className="recent-list">{data.recentRegistrations.map(r => <div className="recent-item" key={r._id}><span className="recent-avatar">{r.user?.name?.charAt(0)?.toUpperCase() || '?'}</span><div className="recent-copy"><b>{r.user?.name || 'Unknown student'}</b><span>registered for <strong>{r.event?.title || 'Deleted event'}</strong></span></div><time>{new Date(r.createdAt).toLocaleDateString()}</time></div>)}</div> : <div className="chart-empty">No registrations yet.</div>}
    </div>
  </section>;
}
