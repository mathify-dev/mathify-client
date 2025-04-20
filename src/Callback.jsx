// pages/Callback.jsx
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const Callback = ({ setUser }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const id = searchParams.get('id');
    const name = searchParams.get('name');
    const email = searchParams.get('email');
    const isAdmin = searchParams.get('isAdmin') === 'true';
    const avatar = searchParams.get('avatar')

    if (token && id && name && email) {
      localStorage.setItem('token', token);
      setUser({ id, name, email , avatar});

      navigate(isAdmin ? '/adminDashboard' : '/studentDashboard');
    } else {
      navigate('/fallback');
    }
  }, []);

  return <div className="text-center mt-10 text-lg">Processing login...</div>;
};

export default Callback;
