import React, { useState } from 'react';
import { Zap, User as UserIcon, Lock, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import type { UserSession } from '../types';

interface LoginProps {
  onLogin: (user: UserSession) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const resp = await api.post('/login', { email, password });
      onLogin(resp.data);
      setError('');
    } catch (err) {
      setError('Credenciales invlidas');
    }
  };

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-6 relative overflow-hidden">
      <div className="mesh-gradient opacity-40" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card w-full max-w-md p-10 shadow-3xl shadow-black relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 animate-gradient-x" />
        <div className="flex flex-col items-center mb-10 text-center">
          <Zap className="w-12 h-12 text-blue-500 glow-text mb-4" />
          <h1 className="text-3xl font-black tracking-tighter italic uppercase text-white">wooGo-Proxy Access</h1>
        </div>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest mb-2 block">Email Address</label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-12 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white" required placeholder="you@email.com" />
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest mb-2 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 theme-invert" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-12 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white" required placeholder="" />
            </div>
          </div>
          {error && <div className="text-red-500 text-xs font-bold text-center">{error}</div>}
          <button type="submit" className="w-full bg-blue-600 text-white font-black py-4 rounded-xl shadow-xl shadow-blue-500/20 hover:bg-blue-500 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs">
            SIGN IN <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </motion.div>
    </div>
  );
};
