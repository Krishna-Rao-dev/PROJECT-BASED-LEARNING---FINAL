import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Chat from './components/Chat';
import TestDrive from './components/TestDrive';
import SalesHome from './components/SalesHome';
import Dashboard from './components/Dashboard';
import SalesLogin from './components/SalesLogin';

function ProtectedRoute({ children }) {
  const user = localStorage.getItem("ae_user");
  return user ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <Router>
      <div className="h-screen bg-black overflow-hidden">
        <Routes>
          <Route path="/" element={<Chat />} />
          <Route path="/test-drive" element={<TestDrive />} />
          <Route path="/login" element={<SalesLogin />} />
          <Route path="/sales" element={<ProtectedRoute><SalesHome /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
