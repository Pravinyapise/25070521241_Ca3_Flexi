const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function getToken() {
  return sessionStorage.getItem('campusconnect_token');
}

export async function api(path, options = {}) {
  const token = getToken();
  const headers = { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const contentType = response.headers.get('content-type') || '';
  if (!response.ok) {
    const data = contentType.includes('application/json') ? await response.json() : { message: await response.text() };
    throw new Error(data.message || 'Request failed');
  }
  if (options.raw) return response;
  return contentType.includes('application/json') ? response.json() : response.text();
}

export { API_URL };
