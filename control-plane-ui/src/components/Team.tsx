import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Trash2, Mail, ShieldCheck, Activity } from 'lucide-react';
import { api } from '../lib/api';
import type { UserSession } from '../types';

interface TeamMember {
  email: string;
  tenant_id: string;
}

interface UsageInfo {
  agents_used: number;
  agents_max: number;
  seats_used: number;
  seats_max: number;
  plan_name: string;
}

export const Team: React.FC<{ user: UserSession; notify: (m: string, t?: any) => void }> = ({ user, notify }) => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [newPass, setNewPass] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      const [teamRes, usageRes] = await Promise.all([
        api.get('/team'),
        api.get('/usage')
      ]);
      setMembers(teamRes.data);
      setUsage(usageRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const addMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPass) return;
    setLoading(true);
    try {
      await api.post('/team', { 
        email: newEmail, 
        password: newPass
      });
      notify('Team member added successfully', 'success');
      setNewEmail('');
      setNewPass('');
      fetchData();
    } catch (err: any) {
      notify(err.response?.data || 'Failed to add member', 'error');
    } finally {
      setLoading(false);
    }
  };

  const removeMember = async (email: string) => {
    if (email === user.email) {
      notify('You cannot remove yourself', 'error');
      return;
    }
    if (!confirm(`Are you sure you want to remove ${email}?`)) return;
    
    try {
      await api.delete(`/team?email=${email}`);
      notify('Member removed', 'success');
      fetchData();
    } catch (err) {
      notify('Failed to remove member', 'error');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4">
      <header className="mb-16">
          <div className="flex items-center gap-3 mb-4">
             <Users className="text-blue-500 w-5 h-5" />
             <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">Resource & Personel Management</span>
          </div>
          <h1 className="text-6xl font-black mb-4 tracking-tighter glow-text uppercase italic text-white flex items-center gap-6">Team_Control <div className="px-4 py-1 bg-blue-600 rounded-2xl text-[12px] not-italic tracking-widest shadow-xl shadow-blue-500/20">{usage?.plan_name}</div></h1>
          <p className="text-gray-500 text-lg font-black uppercase italic tracking-tighter opacity-70">Provision access for engineers, analysts and operators to your secure network perimeter.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         {/* QUOTAS */}
         <div className="lg:col-span-1 space-y-6">
            <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-6 px-2">Operational Limits</h3>
            
            <div className="glass-card p-8 border-white/5 bg-gradient-to-br from-blue-600/5 to-transparent">
               <div className="flex justify-between items-center mb-6">
                  <div className="text-[10px] font-black text-white uppercase tracking-widest">Seats Consumption</div>
                  <div className="text-[10px] font-bold text-blue-400 font-mono tracking-tighter italic">{usage?.seats_used} / {usage?.seats_max}</div>
               </div>
               <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden mb-4 border border-white/5">
                  <div 
                    className="h-full bg-blue-600 transition-all duration-1000 shadow-lg shadow-blue-500/50" 
                    style={{ width: `${((usage?.seats_used || 0) / (usage?.seats_max || 1)) * 100}%` }} 
                  />
               </div>
               <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest italic flex items-center gap-2">
                  <Activity size={10} /> Real-time seat allocation sync
               </p>
            </div>

            <div className="glass-card p-8 border-white/5 bg-gradient-to-br from-blue-600/5 to-transparent">
               <div className="flex justify-between items-center mb-6">
                  <div className="text-[10px] font-black text-white uppercase tracking-widest">Deployments (Active)</div>
                  <div className="text-[10px] font-bold text-blue-400 font-mono tracking-tighter italic">{usage?.agents_used} / {usage?.agents_max}</div>
               </div>
               <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden mb-4 border border-white/5">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-1000 shadow-lg shadow-blue-400/50" 
                    style={{ width: `${((usage?.agents_used || 0) / (usage?.agents_max || 1)) * 100}%` }} 
                  />
               </div>
               <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest italic flex items-center gap-2">
                  <ShieldCheck size={10} /> Hardened agent provisioning status
               </p>
            </div>

            <div className="p-8 border border-dashed border-white/10 rounded-[2rem] bg-black/40">
               <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-4">Security Notice</h4>
               <p className="text-[10px] text-gray-500 font-bold leading-relaxed uppercase tracking-widest">All team members share the same organizational access level. Ensure proper background verification before provisioning new operator seats.</p>
            </div>
         </div>

         {/* TEAM LIST & ADD */}
         <div className="lg:col-span-2 space-y-10">
            <div className="glass-card p-10 border-white/10 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none transform translate-x-8 translate-y--8"><UserPlus size={150} className="text-blue-500"/></div>
               <h3 className="text-xl font-black mb-8 italic uppercase text-white tracking-tighter flex items-center gap-3">
                  Invite_Operator
                  {usage && usage.seats_used >= usage.seats_max && (
                     <span className="text-[9px] font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded">LIMIT REACHED</span>
                   )}
               </h3>
               <form onSubmit={addMember} className="flex flex-col md:flex-row gap-4 mb-2">
                  <div className="flex-1 space-y-2">
                     <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 w-4 h-4" />
                        <input 
                           type="email" 
                           value={newEmail}
                           onChange={(e) => setNewEmail(e.target.value)}
                           placeholder="operator@company.com" 
                           className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white placeholder:text-gray-700 font-black uppercase tracking-widest" 
                        />
                     </div>
                  </div>
                  <div className="flex-1">
                     <input 
                        type="password" 
                        value={newPass}
                        onChange={(e) => setNewPass(e.target.value)}
                        placeholder="" 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white placeholder:text-gray-700" 
                     />
                  </div>
                  <button 
                     disabled={loading || (usage ? usage.seats_used >= usage.seats_max : false)}
                     type="submit" 
                     className={`px-8 py-4 ${loading || (usage && usage.seats_used >= usage.seats_max) ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-500/20'} rounded-2xl font-black text-[10px] tracking-[0.3em] transition-all flex items-center justify-center gap-2 uppercase`}
                  >
                     {loading ? 'PROVISIONING...' : 'ADD_MEMBER'}
                  </button>
               </form>
            </div>

            <div className="space-y-4">
               <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-6 px-2">Active Network Operators</h3>
               <div className="space-y-4">
                  {members.map(m => (
                     <div key={m.email} className="glass-card p-6 flex justify-between items-center group hover:border-blue-500/30 transition-all border-white/5 relative overflow-hidden">
                        <div className="flex items-center gap-6 relative z-10">
                           <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 text-blue-500 shadow-inner">
                              <Users size={20} />
                           </div>
                           <div>
                              <div className="text-sm font-black uppercase italic text-white mb-1 tracking-tighter">{m.email}</div>
                              <div className="flex items-center gap-2">
                                 <span className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] px-2 py-0.5 bg-white/5 rounded-md border border-white/5">Administrator access</span>
                                 {m.email === user.email && <span className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em] px-2 py-0.5 bg-blue-500/10 rounded-md border border-blue-500/20 italic">Primary Auth</span>}
                              </div>
                           </div>
                        </div>
                        <div className="flex items-center gap-4 relative z-10">
                           <button 
                              onClick={() => removeMember(m.email)}
                              disabled={m.email === user.email}
                              className={`p-4 ${m.email === user.email ? 'text-gray-800' : 'text-gray-700 hover:text-red-500 hover:bg-red-500/5'} rounded-2xl transition-all opacity-0 group-hover:opacity-100 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest italic`}
                           >
                              <Trash2 size={16}/> {m.email !== user.email && "Revoke_Access"}
                           </button>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};
