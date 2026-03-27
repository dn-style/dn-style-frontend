import React, { useState, useEffect, useMemo } from 'react';
import { Server, ChevronRight, Terminal, Package, ShieldCheck, Settings, Plus, Tag as TagIcon, X, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';
import type { Agent, UserSession } from '../types';

interface DashboardProps {
  user: UserSession;
  notify: (msg: string, type?: any) => void;
}

import { PluginMarketplace } from './PluginMarketplace';
import { ConfigModal } from './ConfigModal';
import { ProvisionModal } from './ProvisionModal';

export const Dashboard: React.FC<DashboardProps> = ({ user, notify }) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [config, setConfig] = useState<{[key: string]: string}>({ "domain": "", "wc_key": "" });
  const [showMarket, setShowMarket] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [tagSearch, setTagSearch] = useState('');
  const [showTagModal, setShowTagModal] = useState(false);
  const [tagTarget, setTagTarget] = useState<{token: string, tags?: string} | null>(null);
  const [showProvision, setShowProvision] = useState(false);
  const selectedAgent = Array.isArray(agents) ? agents.find(a => a.token === selectedToken) : null;

  const fetchAgents = async () => {
    try {
      const r = await api.get('/online');
      setAgents(r.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchAgents();
    const i = setInterval(fetchAgents, 10000);
    return () => clearInterval(i);
  }, [user]);

  const handleProvision = async (site: string) => {
    if (user.plan && agents.length >= user.plan.max_agents) {
      notify(`LIMIT REACHED: Your plan only allows ${user.plan.max_agents} devices.`, 'error');
      return null;
    }
    try {
      const r = await api.post('/agents', { site_id: site });
      fetchAgents();
      return r.data.token;
    } catch (err) {
      notify('Failed to add device', 'error');
      return null;
    }
  };

  const handleRemoveNode = async (token: string) => {
    if (!confirm('Are you sure you want to PERMANENTLY remove this node?')) return;
    try {
      await api.delete(`/agents/delete?token=${token}`);
      notify('NODE_DECOMMISSIONED', 'success');
      fetchAgents();
      if (selectedToken === token) setSelectedToken(null);
    } catch (err) { notify('Failed to remove node', 'error'); }
  };

  const pushConfig = async () => {
    if (!selectedToken) return;
    try {
      const resp = await api.post('/push-config', { token: selectedToken, config });
      notify(resp.data.status, 'success');
    } catch (err) {
      notify('Connection failed: Broadcast error', 'error');
    }
  };

  const deployAsset = async (token: string, type: 'plugin' | 'template', name: string) => {
    try {
      await api.post('/deploy-asset', { token, type, name });
      notify(`App installed: ${name}`, 'success');
    } catch (err) { notify('App installation failed', 'error'); }
  };

   const triggerUpdate = async (token: string) => {
     try {
       await api.post('/trigger-update', { token });
       notify('Update signal broadcasted', 'success');
     } catch (err) { notify('Failed to trigger update', 'error'); }
   };

   const filteredAgents = useMemo(() => {
     if (!Array.isArray(agents)) return [];
     return agents.filter(a => {
       const term = tagSearch.toLowerCase();
       const matchSite = a.site.toLowerCase().includes(term);
       const matchToken = a.token.toLowerCase().includes(term);
       let tags = [];
       try { tags = a.tags ? JSON.parse(a.tags) : []; } catch(e) {}
       const matchTags = tags.some((t: any) => t.label.toLowerCase().includes(term));
       return matchSite || matchToken || matchTags;
     });
   }, [agents, tagSearch]);

   const updateTags = async (token: string, newTags: any[]) => {
     try {
       await api.patch('/update-tags', { token, tags: JSON.stringify(newTags) });
       fetchAgents();
       notify('Information updated successfully', 'success');
     } catch (err) {
       notify('Update failed', 'error');
     }
   };

   const addTag = (token: string, currentTags: string | undefined) => {
     setTagTarget({ token, tags: currentTags });
     setShowTagModal(true);
   };

   const confirmTag = (label: string) => {
     if (!label || !tagTarget) return;
     const colors = ['#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#f59e0b', '#ec4899'];
     const color = colors[Math.floor(Math.random() * colors.length)];
     let tags = [];
     try { if(tagTarget.tags) tags = JSON.parse(tagTarget.tags); } catch(e){}
     updateTags(tagTarget.token, [...tags, { label: label.toUpperCase(), color }]);
     setShowTagModal(false);
   };

   const removeTag = (token: string, currentTags: string, tagLabel: string) => {
     try {
       const tags = JSON.parse(currentTags);
       updateTags(token, tags.filter((t: any) => t.label !== tagLabel));
     } catch(e){}
   };

   return (
     <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-end mb-12">
           <div>
              <h1 className="text-5xl font-black italic tracking-tighter glow-text text-white uppercase">Network</h1>
              {user.plan && (
                <div className="mt-2 flex items-center gap-3">
                   <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{user.plan.name} Plan</div>
                   <div className="h-1 w-24 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${(agents.length / user.plan.max_agents) * 100}%` }} />
                   </div>
                   <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{agents.length} / {user.plan.max_agents} DEVICES Active</div>
                </div>
              )}
           </div>
        </div>

       <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
         <div className="space-y-4">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
              <div className="flex items-center gap-4">
                 <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em]">Nodes Overview</h3>
              </div>
              <div className="relative flex-1 max-w-xs group">
                 <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-blue-500 transition-colors" />
                 <input
                   placeholder="SEARCH BY SITE OR TAG..."
                   value={tagSearch}
                   onChange={(e) => setTagSearch(e.target.value)}
                   className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-12 pr-4 text-[10px] font-black uppercase text-white placeholder:text-gray-700 outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
                 />
              </div>
              <button onClick={() => setShowProvision(true)} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black text-blue-400 hover:bg-blue-600 hover:text-white transition-all tracking-widest uppercase italic">+ ADD_DEVICE</button>
           </div>

           <AnimatePresence mode="wait">
              <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                {filteredAgents.map(a => (
                  <div key={a.token} onClick={() => {
                    setSelectedToken(a.token);
                    const baseConfig = {
                      "domain": "",
                      "wc_wp_url": "",
                      "redis_host": "127.0.0.1",
                      "redis_port": "6379",
                      "redis_user": "",
                      "redis_pass": "",
                      "redis_prefix": "woogo:"
                    };
                    if (a.config) {
                      try { setConfig({ ...baseConfig, ...JSON.parse(a.config) }); } catch(e) { setConfig(baseConfig); }
                    } else {
                      setConfig(baseConfig);
                    }
                  }} className={`glass-card p-6 cursor-pointer flex flex-col gap-4 justify-between transition-all ${selectedToken === a.token ? 'border-blue-500 bg-blue-500/5 shadow-2xl shadow-blue-500/20 scale-[1.01]' : 'hover:bg-white/5 opacity-70 hover:opacity-100 border-white/5'}`}>
                    <div className="flex justify-between items-center w-full">
                       <div className="flex items-center gap-4 text-blue-400">
                         <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center border border-blue-500/20"><Server /></div>
                         <div>
                            <h3 className="flex items-center justify-between font-bold underline uppercase italic text-white leading-none mb-1 text-sm">
                               {a.site}
                               <button 
                                 onClick={(e) => { e.stopPropagation(); handleRemoveNode(a.token); }}
                                 className="text-[8px] font-black text-gray-700 hover:text-red-500 transition-colors uppercase tracking-widest px-2 py-1 rounded-md hover:bg-red-500/5 border border-transparent hover:border-red-500/20 no-underline not-italic"
                               >
                                  [DEL]
                               </button>
                            </h3>
                            <span className={`text-[10px] uppercase font-black tracking-widest ${a.status === 'ONLINE' ? 'text-blue-500' : 'text-gray-600'}`}>
                               {a.status === 'ONLINE' ? 'CONNECTED' : 'OFFLINE'}
                            </span>
                         </div>
                       </div>
                       <ChevronRight className="text-gray-500" />
                    </div>

                    {a.tags && (
                       <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                          {JSON.parse(a.tags).map((t: any) => (
                            <span key={t.label} className="px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest text-white border border-white/10" style={{ backgroundColor: `${t.color}20`, borderColor: `${t.color}40`, color: t.color }}>
                               {t.label}
                            </span>
                          ))}
                       </div>
                    )}
                  </div>
                ))}
              </motion.div>
           </AnimatePresence>

          {agents.length === 0 && (
             <div className="glass-card p-12 text-center border-dashed border-white/5 opacity-30">
                <p className="text-[10px] font-black text-white uppercase tracking-widest">Waiting for active signal...</p>
             </div>
          )}
        </div>

        <div className="min-h-[500px]">
          <AnimatePresence mode="wait">
            {selectedAgent ? (
               <motion.div key={selectedAgent.token} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="glass-card p-10 border-white/10 relative overflow-hidden h-fit shadow-3xl shadow-black group">
                 <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none"><Terminal size={150} className="text-blue-500"/></div>

                  <div className="flex flex-col md:flex-row md:items-end justify-between items-start mb-8 border-b border-white/5 pb-6 bg-gradient-to-r from-blue-600/5 via-transparent to-transparent gap-6">
                     <div className="flex-1">
                        <h2 className="text-4xl font-black italic uppercase text-white tracking-tighter mb-2 leading-none">{selectedAgent.site}</h2>
                         <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest mb-6">
                            <div className={`w-1.5 h-1.5 rounded-full ${selectedAgent.status === 'ONLINE' ? 'bg-blue-500 animate-pulse shadow-lg shadow-blue-500' : 'bg-gray-700'}`} />
                            <span className={selectedAgent.status === 'ONLINE' ? 'text-blue-400' : 'text-gray-600'}>
                               {selectedAgent.status === 'ONLINE' ? 'STABLE CONNECTION' : 'WAITING FOR HANDSHAKE'}
                            </span>
                         </div>

                        {/* TAGS SYSTEM */}
                        <div className="flex flex-wrap items-center gap-3">
                           {selectedAgent.tags && JSON.parse(selectedAgent.tags).map((t: any) => (
                             <div key={t.label} className="flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] text-white border transition-all hover:scale-105 group shadow-lg" style={{ backgroundColor: `${t.color}15`, borderColor: `${t.color}30`, color: t.color }}>
                                <TagIcon size={12} className="opacity-60" />
                                {t.label}
                                <button onClick={() => removeTag(selectedAgent.token, selectedAgent.tags!, t.label)} className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity hover:text-white p-0.5 bg-black/20 rounded-md">
                                   <X size={10} />
                                </button>
                             </div>
                           ))}
                            <button onClick={() => addTag(selectedAgent.token, selectedAgent.tags)} className="px-5 py-2 rounded-xl bg-white/5 border border-dashed border-white/20 flex items-center justify-center gap-2 text-[8px] font-black text-gray-500 hover:bg-blue-600/20 hover:text-blue-400 hover:border-blue-500/50 transition-all uppercase tracking-widest">
                              <Plus size={14} /> Add_Tag
                           </button>
                        </div>
                     </div>
                     <div className="px-3 py-1 bg-black/40 border border-white/10 rounded-lg text-[9px] font-mono text-gray-500 self-start">
                        ID: {selectedAgent.token.substring(0, 10)}...
                     </div>
                  </div>

                 <div className="space-y-8 text-left">
                    <div className="space-y-6">
                         <div className="flex justify-between items-center border-b border-white/5 pb-4">
                           <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">System Configuration</h3>
                           <button onClick={() => setShowConfig(true)} className="flex items-center gap-2 text-blue-500 hover:text-white transition-all text-[9px] font-black uppercase tracking-widest underline italic underline-offset-4 pointer-events-auto relative z-[60]">
                              <Settings size={12} /> Manage_Settings
                           </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                           {Object.entries(config).slice(0, 4).map(([k, v]) => (
                             <div key={k} className="bg-black/40 border border-white/5 rounded-xl px-5 py-4 flex justify-between items-center group hover:bg-black/60 transition-colors">
                                <span className="text-[9px] font-mono text-blue-400/60 uppercase truncate w-1/3">{k}</span>
                                <span className="text-[10px] text-white font-mono truncate flex-1 text-right italic opacity-50 font-bold">
                                   {(k.toLowerCase().includes('pass') || k.toLowerCase().includes('secret') || k.toLowerCase().includes('token') || k.toLowerCase().includes('jwt')) ? '' : v}
                                </span>
                             </div>
                           ))}
                           {Object.keys(config).length > 4 && (
                             <div className="bg-black/20 border border-dashed border-white/5 rounded-xl px-4 py-3 flex items-center justify-center opacity-30">
                                <span className="text-[8px] font-black text-gray-500 uppercase">+{Object.keys(config).length - 4} more_parameters</span>
                             </div>
                           )}
                        </div>
                    </div>

                     <div className="space-y-4 pt-4 border-t border-white/5">
                       <div className="flex justify-between items-center mb-2">
                          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Apps & Extensions</h3>
                          <button onClick={() => setShowMarket(true)} className="text-[9px] font-black text-blue-500 hover:text-white transition-colors uppercase tracking-tighter underline italic decoration-blue-500/30 underline-offset-4">Open_App_Store</button>
                       </div>

                       <div className="p-6 bg-blue-600/5 rounded-2xl border border-blue-500/10 flex items-center justify-between group hover:border-blue-500/30 transition-all relative overflow-hidden">
                          <div className="flex items-center gap-4 relative z-10">
                             <div className="w-10 h-10 bg-blue-600/10 rounded-xl border border-blue-500/20 flex items-center justify-center italic text-blue-500 font-black"><Package size={20} /></div>
                             <div className="flex-1">
                                <div className="text-[10px] font-black text-white uppercase tracking-tighter">Core Engine</div>
                                <div className="flex items-center gap-3 mt-0.5">
                                   <div className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">v4.3.0 (SIGNED)</div>
                                   <button onClick={() => triggerUpdate(selectedAgent.token)} className="text-[7px] font-black text-blue-500 hover:text-white transition-colors bg-blue-500/10 hover:bg-blue-600 px-2 py-0.5 rounded-md uppercase tracking-[0.2em] border border-blue-500/20">Check_for_Updates</button>
                                </div>
                             </div>
                          </div>
                          <ShieldCheck size={18} className="text-blue-500/40" />
                       </div>
                    </div>
                 </div>
              </motion.div>
             ) : null}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {showMarket && selectedToken && (
           <PluginMarketplace
             agentSite={selectedAgent?.site || 'Unknown'}
             onClose={() => setShowMarket(false)}
             onDeploy={(plugin) => deployAsset(selectedToken, 'plugin', plugin)}
           />
        )}
        {showConfig && selectedToken && (
           <ConfigModal
             agentSite={selectedAgent?.site || 'Unknown'}
             config={config}
             setConfig={setConfig}
             onSync={pushConfig}
             onClose={() => setShowConfig(false)}
           />
        )}
        {showTagModal && (
           <TagModal onClose={() => setShowTagModal(false)} onConfirm={confirmTag} />
        )}
        {showProvision && (
           <ProvisionModal onClose={() => setShowProvision(false)} onProvision={handleProvision} />
        )}
      </AnimatePresence>
    </div>
  );
};

const TagModal: React.FC<{ onClose: () => void; onConfirm: (label: string) => void; }> = ({ onClose, onConfirm }) => {
  const [label, setLabel] = useState('');
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
       <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#0a0a0a] border border-white/10 p-10 rounded-[2.5rem] w-full max-w-md shadow-3xl shadow-blue-500/20 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />
          <h3 className="text-3xl font-black italic uppercase tracking-tighter text-white mb-2">Create_Tag</h3>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-8">Device categorization</p>

          <div className="bg-black/40 border border-white/5 p-6 rounded-2xl mb-10 shadow-inner">
             <input autoFocus placeholder="Device name (e.g. Office HQ)" value={label} onChange={(e) => setLabel(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === 'Enter' && onConfirm(label)} className="bg-transparent border-none outline-none w-full text-[14px] font-black tracking-widest text-blue-400 placeholder:text-gray-800" />
          </div>

          <div className="flex gap-4">
             <button onClick={onClose} className="flex-1 py-5 bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-all border border-white/5">Cancel</button>
             <button onClick={() => onConfirm(label)} className="flex-[1.5] py-5 bg-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-blue-500/40 hover:bg-blue-500 transition-all active:scale-95">Save</button>
          </div>
       </motion.div>
    </motion.div>
  );
};
