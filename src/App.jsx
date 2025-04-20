// App.jsx
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Home from './Home';
import Callback from './Callback';
import Fallback from './Fallback';
import AdminDashboard from './AdminDashboard';
import StudentDashboard from './StudentDashboard';


function App() {
  const [user, setUser] = useState({
    id: '',
    name: '',
    email: '',
    avatar:''
  });

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/callback" element={<Callback setUser={setUser} />} />
        <Route path="/fallback" element={<Fallback />} />
        <Route path="/adminDashboard" element={<AdminDashboard user={user} />} />
        <Route path="/studentDashboard" element={<StudentDashboard user={user} />} />
      </Routes>
    </Router>
  );
}

export default App;
