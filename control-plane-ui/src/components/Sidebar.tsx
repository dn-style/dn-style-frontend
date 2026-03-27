import React from 'react';
import { Zap, LayoutDashboard, Code, CreditCard, Shield, Users } from 'lucide-react';
import type { UserSession } from '../types';

interface SidebarProps {
  user: UserSession;
  view: string;
  setView: (v: any) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ user, view, setView, onLogout }) => {
  return (
    <nav className="w-64 border-r border-white/5 bg-black/40 backdrop-blur-3xl flex flex-col p-6 z-10 shrink-0">
      <div className="flex items-center gap-3 mb-12">
        <Zap className="w-8 h-8 text-blue-500 glow-text" />
        <span className="text-xl font-black italic text-white uppercase tracking-tighter">wooGo-Proxy</span>
      </div>
      <div className="space-y-2 flex-1">
        <button onClick={() => setView('dashboard')} className={`flex items-center gap-3 w-full p-4 rounded-xl transition-all ${view === 'dashboard' ? 'bg-blue-600/10 text-blue-400 border-l-2 border-blue-600' : 'text-gray-400 hover:text-gray-100'}`}>
          <LayoutDashboard className="w-5 h-5" />
          <span className="font-bold text-[10px] uppercase tracking-widest leading-none">Dashboard</span>
        </button>
        <button onClick={() => setView('templates')} className={`flex items-center gap-3 w-full p-4 rounded-xl transition-all ${view === 'templates' ? 'bg-blue-600/10 text-blue-400 border-l-2 border-blue-600' : 'text-gray-400 hover:text-gray-100'}`}>
          <Code className="w-5 h-5" />
          <span className="font-bold text-[10px] uppercase tracking-widest leading-none">Visual Editor</span>
        </button>
        <button onClick={() => setView('security')} className={`flex items-center gap-3 w-full p-4 rounded-xl transition-all ${view === 'security' ? 'bg-blue-600/10 text-blue-400 border-l-2 border-blue-600' : 'text-gray-400 hover:text-gray-100'}`}>
          <Shield className="w-5 h-5" />
          <span className="font-bold text-[10px] uppercase tracking-widest leading-none">Security</span>
        </button>
        <button onClick={() => setView('team')} className={`flex items-center gap-3 w-full p-4 rounded-xl transition-all ${view === 'team' ? 'bg-blue-600/10 text-blue-400 border-l-2 border-blue-600' : 'text-gray-400 hover:text-gray-100'}`}>
          <Users className="w-5 h-5" />
          <span className="font-bold text-[10px] uppercase tracking-widest leading-none">Team Members</span>
        </button>
        <button onClick={() => setView('billing')} className={`flex items-center gap-3 w-full p-4 rounded-xl transition-all ${view === 'billing' ? 'bg-blue-600/10 text-blue-400 border-l-2 border-blue-600' : 'text-gray-400 hover:text-gray-100'}`}>
          <CreditCard className="w-5 h-5" />
          <span className="font-bold text-[10px] uppercase tracking-widest leading-none">Billing & Plans</span>
        </button>
      </div>
      <div className="pt-6 border-t border-white/5">
        <div className="mb-4 p-4 bg-white/5 rounded-2xl text-[10px] font-bold border border-white/5">
          <div className="text-gray-500 mb-1 uppercase tracking-tighter italic">Auth: {user.tenant}</div>
          <div className="truncate text-white">{user.email}</div>
        </div>
        <button onClick={onLogout} className="w-full py-4 text-[10px] font-black tracking-widest text-red-500 hover:bg-red-500/5 rounded-xl border border-transparent hover:border-red-500/20 transition-all uppercase">Logout</button>
      </div>
    </nav>
  );
};
