import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'info' | 'secure';

export interface NotificationProps {
  id: string;
  message: string;
  type: NotificationType;
  onClose: (id: string) => void;
}

export const Notification: React.FC<NotificationProps> = ({ id, message, type, onClose }) => {
  const icons = {
    success: <CheckCircle className="text-blue-400" size={20} />,
    error: <XCircle className="text-red-400" size={20} />,
    info: <AlertTriangle className="text-yellow-400" size={20} />,
    secure: <ShieldCheck className="text-blue-500" size={20} />,
  };

  const bgStyles = {
    success: 'bg-blue-600/10 border-blue-500/20',
    error: 'bg-red-600/10 border-red-500/20',
    info: 'bg-yellow-600/10 border-yellow-500/20',
    secure: 'bg-blue-600/20 border-blue-400/30',
  };

  React.useEffect(() => {
    const timer = setTimeout(() => onClose(id), 5000);
    return () => clearTimeout(timer);
  }, [id, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, x: 20 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.8, x: 40 }}
      className={`glass-card mb-4 px-6 py-5 flex items-center gap-4 border shadow-3xl shadow-black select-none pointer-events-auto min-w-[320px] max-w-md ${bgStyles[type]}`}
    >
      <div className="flex-shrink-0 animate-pulse">{icons[type]}</div>
      <div className="flex-1">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1 leading-none">Command Response</h4>
        <p className="text-[12px] font-bold text-white tracking-tight leading-tight uppercase italic">{message}</p>
      </div>
      <button 
        onClick={() => onClose(id)} 
        className="text-white/20 hover:text-white transition-colors text-[10px] font-black"
      >
        ACK
      </button>
    </motion.div>
  );
};

export const NotificationProvider: React.FC<{ children: (notify: (msg: string, type?: NotificationType) => void) => React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = React.useState<{id: string, message: string, type: NotificationType}[]>([]);

  const notify = (message: string, type: NotificationType = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);
  };

  const remove = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <>
      <div className="fixed bottom-10 right-10 z-[100] pointer-events-none">
        <AnimatePresence>
          {notifications.map(n => (
            <Notification key={n.id} {...n} onClose={remove} />
          ))}
        </AnimatePresence>
      </div>
      {children(notify)}
    </>
  );
};
