import { createContext, useContext, useEffect, useState } from 'react';
import { api, getToken } from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getToken()));

  useEffect(() => {
    if (!getToken()) return;
    api('/auth/me')
      .then(data => setUser(data.user))
      .catch(() => {
        sessionStorage.removeItem('campusconnect_token');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const data = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    sessionStorage.setItem('campusconnect_token', data.token);
    setUser(data.user);
    return data.user;
  }

  async function signup(name, email, password) {
    const data = await api('/auth/signup', { method: 'POST', body: JSON.stringify({ name, email, password }) });
    sessionStorage.setItem('campusconnect_token', data.token);
    setUser(data.user);
    return data.user;
  }

  function logout() {
    sessionStorage.removeItem('campusconnect_token');
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, loading, login, signup, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
