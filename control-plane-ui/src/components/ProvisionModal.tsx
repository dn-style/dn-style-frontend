import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Terminal, Copy, CheckCircle, ShieldCheck, Download } from 'lucide-react';

interface ProvisionModalProps {
  onClose: () => void;
  onProvision: (site: string) => Promise<string | null>;
}

export const ProvisionModal: React.FC<ProvisionModalProps> = ({ onClose, onProvision }) => {
  const [site, setSite] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    if (!site) return;
    setLoading(true);
    const newToken = await onProvision(site);
    setToken(newToken);
    setLoading(false);
  };

  const copyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const installCommand = `curl -sSL ${window.location.origin.replace(':3000', ':5000')}/install.sh | sudo bash -s -- --token ${token || 'GENERATING...'} --auto-update`;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6">
       <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="bg-[#0a0a0a] border border-white/10 p-12 rounded-[3rem] w-full max-w-2xl shadow-3xl shadow-blue-500/20 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />
          
          <button onClick={onClose} className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors">
             <X size={24} />
          </button>

          <header className="mb-10">
             <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="text-blue-500 w-5 h-5" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">Autonomous Node Provisioning</span>
             </div>
             <h3 className="text-4xl font-black italic uppercase tracking-tighter text-white mb-2">Deploy_New_Agent</h3>
             <p className="text-sm text-gray-500 font-bold uppercase tracking-widest opacity-60 italic">Standard CI/CD & bare-metal installation protocol</p>
          </header>

          {!token ? (
            <div className="space-y-8">
               <div className="bg-black/40 border border-white/5 p-8 rounded-3xl shadow-inner">
                  <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-4 block">Physical or Logical Location</label>
                  <input 
                    autoFocus 
                    placeholder="e.g. AWS-EAST-01, OFFICE-RETIRO..." 
                    value={site} 
                    onChange={(e) => setSite(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                    className="bg-transparent border-none outline-none w-full text-2xl font-black tracking-tighter text-blue-400 placeholder:text-gray-900 uppercase italic" 
                  />
               </div>
               <div className="flex gap-4">
                  <button onClick={onClose} className="flex-1 py-5 bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-all border border-white/5 shadow-lg">Cancel</button>
                  <button 
                    onClick={handleCreate} 
                    disabled={!site || loading}
                    className="flex-[2] py-5 bg-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-white shadow-xl shadow-blue-500/40 hover:bg-blue-500 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? 'GENERATING_CONFIG...' : 'GENERATE_INSTALLATION_BLOCK'}
                  </button>
               </div>
            </div>
          ) : (
            <div className="space-y-8">
               <div className="bg-blue-600/5 border border-blue-500/20 p-8 rounded-3xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><Terminal size={100} className="text-blue-500"/></div>
                  <div className="flex justify-between items-center mb-4">
                     <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest italic flex items-center gap-2">
                        <Terminal size={12} /> Execution Script
                     </span>
                     <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest font-mono">Status: Awaiting_Execution</span>
                  </div>
                  <div className="relative group/cmd">
                     <div className="bg-black/60 p-6 rounded-2xl border border-white/5 font-mono text-[11px] text-gray-300 break-all leading-relaxed shadow-inner">
                        <span className="text-blue-500">sudo</span> bash -c <span className="text-blue-400">"{installCommand}"</span>
                     </div>
                     <button 
                       onClick={() => copyCommand(`sudo bash -c "${installCommand}"`)}
                       className="absolute right-4 top-4 p-3 bg-blue-600 rounded-xl text-white shadow-xl shadow-blue-500/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 text-[10px] font-black uppercase"
                     >
                        {copied ? <CheckCircle size={16}/> : <Copy size={16}/>}
                        {copied ? 'COPIED' : 'COPY_BLOCK'}
                     </button>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                     <h4 className="text-[9px] font-black text-gray-600 uppercase mb-2">Security Hash</h4>
                     <code className="text-[10px] font-mono text-blue-400/60 truncate block">{token}</code>
                  </div>
                  <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                     <h4 className="text-[9px] font-black text-gray-600 uppercase mb-1 flex items-center gap-2"><Download size={10}/> Deployment Status</h4>
                     <p className="text-[10px] font-black text-white italic uppercase tracking-tighter">Ready for orchestration</p>
                  </div>
               </div>

               <button onClick={onClose} className="w-full py-5 bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] text-blue-500 hover:text-white transition-all border border-blue-500/20 hover:bg-blue-600/10">DONE_COMPLETE_SETUP</button>
            </div>
          )}
       </motion.div>
    </motion.div>
  );
};
