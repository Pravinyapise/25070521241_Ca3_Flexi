import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Home from './pages/Home.jsx';
import Auth from './pages/Auth.jsx';
import EventDetails from './pages/EventDetails.jsx';
import MyEvents from './pages/MyEvents.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminEventForm from './pages/AdminEventForm.jsx';

export default function App() {
  return <Layout><Routes>
    <Route path="/" element={<Home />} />
    <Route path="/login" element={<Auth mode="login" />} />
    <Route path="/signup" element={<Auth mode="signup" />} />
    <Route path="/events/:id" element={<EventDetails />} />
    <Route path="/my-events" element={<ProtectedRoute role="student"><MyEvents /></ProtectedRoute>} />
    <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
    <Route path="/admin/events/new" element={<ProtectedRoute role="admin"><AdminEventForm /></ProtectedRoute>} />
    <Route path="/admin/events/:id/edit" element={<ProtectedRoute role="admin"><AdminEventForm /></ProtectedRoute>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></Layout>;
}
