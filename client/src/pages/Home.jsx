import { useEffect, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, CalendarDays, Search, Sparkles, Users, Zap } from 'lucide-react';
import { api } from '../api.js';
import EventCard from '../components/EventCard.jsx';
import Notice from '../components/Notice.jsx';

const categories = ['All events', 'Technology', 'Cultural', 'Workshop', 'Sports', 'Business', 'Other'];

export default function Home() {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All events');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    const params = new URLSearchParams({ limit: '12' });
    if (search.trim()) params.set('search', search.trim());
    if (category !== 'All events') params.set('category', category);
    api(`/events?${params}`)
      .then(data => { if (active) { setEvents(data.events); setError(''); } })
      .catch(err => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [search, category]);

  return (
    <>
      <section className="hero">
        <div className="hero-glow hero-glow-one" /><div className="hero-glow hero-glow-two" />
        <div className="hero-content">
          <div className="eyebrow"><span className="eyebrow-dot" /><Sparkles size={14} /> YOUR CAMPUS. YOUR COMMUNITY.</div>
          <h1>Make your campus<br />life <span className="gradient-text">unforgettable.</span></h1>
          <p className="hero-copy">Find your people. Discover what inspires you. Your next great campus memory starts here.</p>
          <div className="hero-buttons">
            <a href="#discover" className="button button-primary button-large">Explore events <ArrowDownRight size={17} /></a>
            <span className="hero-note"><span className="online-dot" /> Real events. Real connections.</span>
          </div>
          <div className="hero-stats">
            <div><strong><Users size={18} /> Student-first</strong><span>Made for campus life</span></div>
            <div><strong><CalendarDays size={18} /> One place</strong><span>Every opportunity</span></div>
            <div><strong><Zap size={18} /> Easy to join</strong><span>Register in seconds</span></div>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <div className="hero-art-card art-card-back"><span className="art-symbol">✳</span><span>CREATE SOMETHING<br />AMAZING</span></div>
          <div className="hero-art-card art-card-front"><div className="art-card-top"><span className="live-tag">● UPCOMING</span><span>↗</span></div><div className="art-date">OCT<br /><b>31</b></div><div className="art-card-title">Ideas meet<br /><span>possibility.</span></div><div className="art-people"><i>A</i><i>M</i><i>R</i><span>your community awaits</span></div></div>
          <div className="floating-tag floating-tag-top"><span className="floating-icon">✦</span><span><b>Find your people</b><small>Build your community</small></span></div>
          <div className="floating-tag floating-tag-bottom"><span className="floating-icon purple">↗</span><span><b>New experiences</b><small>Just around the corner</small></span></div>
        </div>
        <div className="hero-bottom-label"><span>SCROLL TO DISCOVER</span><span className="hero-line" /></div>
      </section>

      <section className="section discover-section" id="discover">
        <div className="section-heading">
          <div><div className="eyebrow"><span className="eyebrow-dot" /> THE CAMPUS CALENDAR</div><h2>Find your <span className="gradient-text">next thing.</span></h2><p>Big ideas, new skills, and memories worth making.</p></div>
          <a href="#discover" className="text-link">Discover your interests <ArrowUpRight size={16} /></a>
        </div>
        <div className="filter-bar">
          <div className="search-field"><Search size={18} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search events, venues, ideas…" aria-label="Search events" /></div>
          <div className="category-tabs" role="group" aria-label="Filter by category">
            {categories.map(item => <button key={item} className={`category-tab ${category === item ? 'active' : ''}`} onClick={() => setCategory(item)}>{item}</button>)}
          </div>
        </div>
        <Notice>{error}</Notice>
        {loading ? <div className="loading-grid">{[1, 2, 3].map(n => <div className="skeleton-card" key={n} />)}</div> :
          events.length ? <div className="event-grid">{events.map(event => <EventCard key={event._id} event={event} />)}</div> :
          <div className="empty-state"><span className="empty-icon"><CalendarDays size={26} /></span><h3>No events found just yet</h3><p>Try another search or category. Your next campus experience might be one click away.</p><button className="button button-outline" onClick={() => { setSearch(''); setCategory('All events'); }}>Clear filters</button></div>}
      </section>
      <section className="community-banner">
        <div className="banner-orb" /><div><div className="eyebrow"><span className="eyebrow-dot" /> YOUR NEXT CHAPTER</div><h2>Campus is better<br />when you're <span className="gradient-text">part of it.</span></h2><p>Show up curious. Leave with a story.</p></div><div className="banner-sticker">MAKE<br /><span>IT</span><br />COUNT ✦</div>
      </section>
    </>
  );
}
