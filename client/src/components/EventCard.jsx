import { CalendarDays, MapPin, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export function formatDate(date) {
  return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function EventCard({ event }) {
  const count = event.registeredCount || 0;
  const percent = Math.min(100, Math.round((count / event.capacity) * 100));
  return (
    <article className="event-card">
      <Link to={`/events/${event._id}`} className="event-image-wrap">
        {event.imageUrl ? <img src={event.imageUrl} alt="" className="event-image" loading="lazy" /> : <div className="event-image-placeholder"><CalendarDays size={36} /></div>}
        <span className="category-pill">{event.category}</span>
      </Link>
      <div className="event-card-body">
        <div className="event-date"><CalendarDays size={14} /> {formatDate(event.startsAt)}</div>
        <Link to={`/events/${event._id}`} className="event-title"><h3>{event.title}</h3></Link>
        <p className="event-description">{event.description}</p>
        <div className="event-meta"><span><MapPin size={15} />{event.venue}</span><span><Users size={15} />{Math.max(0, event.capacity - count)} spots left</span></div>
        <div className="capacity-track"><span style={{ width: `${percent}%` }} /></div>
        <div className="capacity-label"><span>{count} attending</span><span>{percent}% full</span></div>
        <Link className="button button-outline button-full" to={`/events/${event._id}`}>Explore event <span aria-hidden="true">↗</span></Link>
      </div>
    </article>
  );
}
