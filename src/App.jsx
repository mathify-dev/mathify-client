// App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { App as AntApp, Spin } from 'antd';
import Home from './Home';
import Callback from './Callback';
import Fallback from './Fallback';
import AdminDashboard from './AdminDashboard';
import StudentDashboard from './StudentDashboard';
import makeRequest from './apiClient';

// Only allows access if the user is logged in AND has the required role
const ProtectedRoute = ({ user, requiredRole, children }) => {
  if (!user.id) return <Navigate to="/" replace />;
  if (requiredRole === 'admin' && !user.isAdmin) return <Navigate to="/studentDashboard" replace />;
  if (requiredRole === 'student' && user.isAdmin) return <Navigate to="/adminDashboard" replace />;
  return children;
};

function App() {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : { id: '', name: '', email: '', avatar: '', isAdmin: false };
  });

  // Only show loader if there is a token that needs to be verified
  const [authChecking, setAuthChecking] = useState(() => !!localStorage.getItem('token'));

  // On every app load, re-validate the stored token with the server
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    makeRequest('get', '/api/profile')
      .then((serverUser) => {
        const userData = {
          id: serverUser.id,
          name: serverUser.name,
          email: serverUser.email,
          avatar: serverUser.avatar,
          isAdmin: serverUser.isAdmin,
        };
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
      })
      .catch(() => {
        // Token is expired or invalid — clear everything
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser({ id: '', name: '', email: '', avatar: '', isAdmin: false });
      })
      .finally(() => {
        setAuthChecking(false);
      });
  }, []);

  if (authChecking) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="Verifying session..." />
      </div>
    );
  }

  return (
    <AntApp>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/callback" element={<Callback setUser={setUser} />} />
          <Route path="/fallback" element={<Fallback />} />
          <Route path="/adminDashboard" element={
            <ProtectedRoute user={user} requiredRole="admin">
              <AdminDashboard user={user} />
            </ProtectedRoute>
          } />
          <Route path="/studentDashboard" element={
            <ProtectedRoute user={user} requiredRole="student">
              <StudentDashboard user={user} />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AntApp>
  );
}

export default App;
