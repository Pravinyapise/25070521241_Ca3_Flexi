import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarDays, LockKeyhole, Mail, Sparkles, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import Notice from '../components/Notice.jsx';

export default function Auth({ mode }) {
  const isSignup = mode === 'signup';
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = isSignup ? await signup(name, email, password) : await login(email, password);
      navigate(user.role === 'admin' ? '/admin' : (location.state?.from || '/'), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-layout">
      <div className="auth-visual"><div className="auth-visual-glow" /><Link className="brand" to="/"><span className="brand-mark"><Sparkles size={19} /></span><span>campus<span className="brand-accent">connect</span></span></Link><div className="auth-visual-copy"><div className="eyebrow"><span className="eyebrow-dot" /> YOUR PEOPLE ARE HERE</div><h1>Life happens<br />when you <span className="gradient-text">show up.</span></h1><p>One campus. A thousand possibilities. Find the events that turn ordinary days into your favorite stories.</p><div className="auth-mini-card"><div className="auth-mini-icon"><CalendarDays size={20} /></div><div><b>Your next memory is waiting.</b><small>Discover events. Meet your people.</small></div><span>✦</span></div></div><div className="auth-visual-foot">MAKE YOUR CAMPUS YEARS COUNT <span>✳</span></div></div>
      <div className="auth-form-side"><div className="auth-form-wrap"><div className="auth-form-icon"><Sparkles size={22} /></div><div className="eyebrow">{isSignup ? 'START YOUR STORY' : 'WELCOME BACK'}</div><h2>{isSignup ? 'Join the community.' : 'Good to see you.'}</h2><p className="auth-subtitle">{isSignup ? 'Create your account and find your next campus adventure.' : 'Sign in to pick up where your campus life left off.'}</p>
        <Notice>{error}</Notice>
        <form className="auth-form" onSubmit={handleSubmit}>
          {isSignup && <label className="form-label">Full name<div className="input-wrap"><UserRound size={17} /><input value={name} onChange={e => setName(e.target.value)} required minLength={2} maxLength={80} placeholder="Your name" autoComplete="name" /></div></label>}
          <label className="form-label">Email address<div className="input-wrap"><Mail size={17} /><input type="email" value={email} onChange={e => setEmail(e.target.value)} required maxLength={254} placeholder="you@college.edu" autoComplete="email" /></div></label>
          <label className="form-label">Password<div className="input-wrap"><LockKeyhole size={17} /><input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} maxLength={128} placeholder="At least 8 characters" autoComplete={isSignup ? 'new-password' : 'current-password'} /></div></label>
          <button className="button button-primary button-large button-full" type="submit" disabled={busy}>{busy ? 'Please wait…' : isSignup ? 'Create account' : 'Sign in'} <ArrowRight size={17} /></button>
        </form>
        <p className="auth-switch">{isSignup ? 'Already part of the community?' : 'New to CampusConnect?'} <Link to={isSignup ? '/login' : '/signup'}>{isSignup ? 'Log in' : 'Create an account'}</Link></p>
        <p className="auth-safe">Protected access · Your account stays yours</p>
      </div></div>
    </section>
  );
}
