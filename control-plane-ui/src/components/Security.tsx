import React, { useState, useEffect } from 'react';
import { Shield, Key, Copy, CheckCircle } from 'lucide-react';
import { api } from '../lib/api';
import type { UserSession } from '../types';

interface APIKeyData {
  id: number;
  name: string;
  key: string;
  status: string;
  created_at: string;
}

export const Security: React.FC<{ user: UserSession }> = ({ user }) => {
  const [keys, setKeys] = useState<APIKeyData[]>([]);
  const [newName, setNewName] = useState('');
  const [copied, setCopied] = useState<number | null>(null);

  useEffect(() => {
    fetchKeys();
  }, [user]);

  const fetchKeys = async () => {
    const r = await api.get('/keys');
    setKeys(r.data);
  };

  const rotateKey = async () => {
    if (!newName) return;
    await api.post('/keys/rotate', { name: newName });
    setNewName('');
    fetchKeys();
  };

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-16">
          <div className="flex items-center gap-3 mb-4">
             <Shield className="text-blue-500 w-5 h-5" />
             <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">Security & Access Control</span>
          </div>
          <h1 className="text-6xl font-black mb-4 tracking-tighter glow-text uppercase italic text-white">API Master Keys</h1>
          <p className="text-gray-500 text-lg font-black uppercase italic tracking-tighter opacity-70">Generate long-lived tokens for external service orchestration and autonomous agent provisioning.</p>
      </header>

      <div className="glass-card p-10 mb-12 border-white/10">
          <h3 className="text-xl font-black mb-8 italic uppercase text-white tracking-tighter">Rotation Infrastructure</h3>
          <div className="flex gap-4">
             <input 
               type="text" 
               value={newName}
               onChange={(e) => setNewName(e.target.value)}
               placeholder="Update label (e.g. Master Key v2)..."
               className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white" 
             />
             <button onClick={rotateKey} className="px-8 py-4 bg-blue-600 rounded-2xl font-black text-[10px] tracking-widest text-white hover:bg-blue-500 transition-all shadow-xl shadow-blue-500/20 flex items-center gap-2 uppercase">
                {keys.length > 0 ? 'ROTATE_MASTER_KEY' : 'INIT_MASTER_ACCESS'}
             </button>
          </div>
      </div>

      <div className="space-y-4">
         <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-6">Current Network Authorization Object</h3>
         {keys.length === 0 ? (
            <div className="p-20 text-center border-2 border-dashed border-white/5 rounded-[2.5rem] opacity-30">
               <p className="text-[10px] font-bold text-white uppercase tracking-widest">No keys provisioned. Initialize system access above.</p>
            </div>
         ) : (
            keys.map(k => (
              <div key={k.id} className="glass-card p-10 flex flex-col md:flex-row justify-between items-start md:items-center group hover:border-blue-500/30 transition-all border-white/5 gap-8 overflow-hidden relative">
                 <div className="absolute top-0 left-0 w-1 h-full bg-blue-600 group-hover:shadow-[0_0_20px_rgba(37,99,235,0.5)] transition-all" />
                 <div className="flex items-center gap-10">
                    <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center border border-blue-500/20 text-blue-500 shadow-inner">
                       <Key size={32} />
                    </div>
                    <div>
                       <div className="text-[10px] font-black uppercase text-blue-500 tracking-[0.3em] mb-2 font-mono">ENCRYPTED_MASTER_TOKEN</div>
                       <div className="text-xl font-black uppercase italic text-white mb-4 tracking-tighter">{k.name}</div>
                       <div className="flex items-center gap-4 bg-black/40 p-4 rounded-xl border border-white/5">
                          <code className="text-[12px] font-mono text-gray-400 select-all tracking-tight break-all">
                             {k.key}
                          </code>
                          <button onClick={() => copyToClipboard(k.key, k.id)} className="p-3 bg-white/5 rounded-xl text-gray-500 hover:text-blue-400 transition-all border border-white/10 shrink-0">
                             {copied === k.id ? <CheckCircle size={20} className="text-green-500"/> : <Copy size={20}/>}
                          </button>
                       </div>
                    </div>
                 </div>
                 <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="text-[10px] text-blue-500 font-bold uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">LIVE_OBJECT</div>
                    <div className="text-right">
                       <div className="text-[9px] text-gray-600 font-bold uppercase tracking-widest opacity-60">Last Rotation</div>
                       <div className="text-[11px] text-gray-500 font-mono italic">{new Date(k.created_at).toLocaleString()}</div>
                    </div>
                 </div>
              </div>
            ))
         )}
      </div>
    </div>
  );
};
