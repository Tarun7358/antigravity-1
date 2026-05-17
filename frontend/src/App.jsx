import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import OAuthCallback from './pages/OAuthCallback';
import InviteJoin from './pages/InviteJoin';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="h-screen w-full bg-slate-950 text-slate-200 overflow-hidden font-sans">
          <Routes>
            <Route path="/" element={<Navigate to="/app" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/invite/:code" element={<InviteJoin />} />
            <Route path="/oauth-callback" element={<OAuthCallback />} />
            <Route path="/app/*" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
