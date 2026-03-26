import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import type { UserSession } from './types';
import { Login } from './components/Login';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { VisualEditor } from './components/VisualEditor';
import { Billing } from './components/Billing';
import { Security } from './components/Security';
import { NotificationProvider } from './components/Notification';
import { Team } from './components/Team';
import { setAuthToken } from './lib/api';

const AppContent = () => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const savedUser = localStorage.getItem('nexus_session');
    if (savedUser) {
      const u = JSON.parse(savedUser);
      setAuthToken(u.token);
      setUser(u);
    }
    setLoading(false);
  }, []);

  const handleLogin = (u: UserSession) => {
    localStorage.setItem('nexus_session', JSON.stringify(u));
    setAuthToken(u.token);
    setUser(u);
    navigate('/dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('nexus_session');
    setAuthToken(null);
    setUser(null);
    navigate('/');
  };

  if (loading) return null;

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const currentView = location.pathname.substring(1) || 'dashboard';

  return (
    <NotificationProvider>
      {(notify) => (
        <div className="min-h-screen bg-transparent text-gray-100 flex overflow-hidden font-sans">
          <div className="mesh-gradient" />
          
          <Sidebar 
            user={user} 
            view={currentView} 
            setView={(v) => navigate(`/${v}`)} 
            onLogout={handleLogout} 
          />

          <main className="flex-1 overflow-y-auto p-12 relative z-10 transition-all duration-500 scroll-smooth">
            <AnimatePresence mode="wait">
              <motion.div 
                key={location.pathname} 
                initial={{ opacity: 0, x: 10, filter: 'blur(10px)' }} 
                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }} 
                exit={{ opacity: 0, x: -10, filter: 'blur(10px)' }} 
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="max-w-[1600px] mx-auto"
              >
                <Routes>
                  <Route path="/dashboard" element={<Dashboard user={user} notify={notify} />} />
                  <Route path="/templates" element={<VisualEditor user={user} notify={notify} />} />
                  <Route path="/security" element={<Security user={user} />} />
                  <Route path="/team" element={<Team user={user} notify={notify} />} />
                  <Route path="/billing" element={<Billing user={user} />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      )}
    </NotificationProvider>
  );
};

const App = () => (
  <Router>
    <AppContent />
  </Router>
);

export default App;
