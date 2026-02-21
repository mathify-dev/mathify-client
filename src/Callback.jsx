// pages/Callback.jsx
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import makeRequest from './apiClient';

const Callback = ({ setUser }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      navigate('/fallback');
      return;
    }

    // Store token first so the interceptor can attach it
    localStorage.setItem('token', token);

    // Validate token with the server before trusting it
    makeRequest('get', '/api/profile')
      .then((user) => {
        const userData = {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          isAdmin: user.isAdmin,
        };
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        navigate(user.isAdmin ? '/adminDashboard' : '/studentDashboard');
      })
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/fallback');
      });
  }, []);

  return <div className="text-center mt-10 text-lg">Processing login...</div>;
};

export default Callback;
