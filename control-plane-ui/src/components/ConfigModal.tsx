import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, Eye, EyeOff, Plus, Terminal, Trash2, RefreshCcw, Info, Database, Shield, Globe, Mail, Box, Search } from 'lucide-react';

const HINTS: {[key: string]: string} = {
  domain: "Primary public URL of the application instance.",
  wc_wp_url: "Internal bridge URL for WordPress/WooCommerce sync.",
  redis_host: "Network address of the Redis caching node.",
  redis_port: "Input/Output port for Redis (default 6379).",
  redis_prefix: "Database namespace to avoid key collisions.",
  redis_user: "Security identity for Redis cluster access.",
  redis_pass: "Cryptographic secret for Redis authentication.",
  smtp_host: "Outgoing mail server address (e.g. smtp.gmail.com).",
  smtp_user: "Service account for automated email delivery.",
  smtp_pass: "Encryption secret for the mailbox linkage.",
  jwt_secret: "Principal key for signing secure node tokens.",
  s3_endpoint: "S3-compatible API endpoint (e.g. MinIO, AWS, Cloudflare).",
  s3_access_key: "Public identifier for cloud storage access.",
  s3_secret_key: "Private cryptographic secret for S3 authentication."
};

const PLACEHOLDERS: {[key: string]: string} = {
  db_name: "e.g. woogo_production",
  db_user: "e.g. root or dbuser",
  db_password: "e.g. **********",
  db_host: "e.g. localhost or 127.0.0.1",
  domain: "e.g. https://system.tesla.com",
  port: "e.g. 80, 443, 3000",
  redis_host: "e.g. redis-service or 127.0.0.1",
  redis_port: "e.g. 6379",
  s3_endpoint: "e.g. http://s3.amazonaws.com or http://minio:9000",
  s3_bucket: "e.g. production-storage",
  smtp_host: "e.g. smtp.postmarkapp.com",
  smtp_port: "e.g. 587 (TLS) or 465 (SSL)",
  smtp_user: "e.g. relay@tesla.com",
  smtp_pass: "e.g. my_secret_app_pass",
  smtp_secure: "e.g. true or false",
  email_sender: "e.g. System Notifications <noreply@tesla.com>"
};

const PROTECTED_KEYS = new Set([
  'domain', 'wc_wp_url', 'redis_host', 'redis_port', 
  'redis_prefix', 'redis_user', 'redis_pass',
  'smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_secure',
  'email_sender', 'email_sender_name',
  's3_endpoint', 's3_access_key', 's3_secret_key',
  'jwt_secret'
]);

type Category = 'CORE' | 'DATA' | 'MAIL' | 'S3' | 'SECURITY' | 'CUSTOM';

interface ConfigModalProps {
  config: {[key: string]: string};
  setConfig: (c: {[key: string]: string}) => void;
  onClose: () => void;
  onSync: () => void;
  agentSite: string;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({ config, setConfig, onClose, onSync, agentSite }) => {
  const [showSecrets, setShowSecrets] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newVal, setNewVal] = useState('');
  const [activeCat, setActiveCat] = useState<Category>('CORE');
  const [search, setSearch] = useState('');

  const isSensitive = (k: string) => {
    const key = k.toLowerCase();
    return key.includes('pass') || key.includes('secret') || key.includes('token') || key.includes('jwt') || key.includes('key');
  };

  const categorizedData = useMemo(() => {
    const groups: { [key in Category]: [string, string][] } = {
       CORE: [], DATA: [], MAIL: [], S3: [], SECURITY: [], CUSTOM: []
    };
    Object.entries(config).forEach(([k, v]) => {
       const key = k.toLowerCase();
       if (isSensitive(k)) groups.SECURITY.push([k, v]);
       else if (key === 'domain' || key === 'wc_wp_url') groups.CORE.push([k, v]);
       else if (key.includes('s3')) groups.S3.push([k, v]);
       else if (key.includes('redis') || key.includes('db') || key.includes('sql')) groups.DATA.push([k, v]);
       else if (key.includes('smtp') || key.includes('mail')) groups.MAIL.push([k, v]);
       else groups.CUSTOM.push([k, v]);
    });
    return groups;
  }, [config]);

  const addField = () => {
    if (!newKey) return;
    setConfig({ ...config, [newKey]: newVal });
    setNewKey('');
    setNewVal('');
  };

  const removeField = (k: string) => {
    if (PROTECTED_KEYS.has(k)) return;
    const newConfig = { ...config };
    delete newConfig[k];
    setConfig(newConfig);
  };

  const visibleKeys = categorizedData[activeCat].filter(([k]) => k.toLowerCase().includes(search.toLowerCase()));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[250] bg-black text-white flex overflow-hidden font-sans">
      
      {/* SIDEBAR NAVIGATION */}
      <nav className="w-24 md:w-80 bg-[#0a0a0a] border-r border-white/5 flex flex-col pt-12 pb-8 px-4 shrink-0 overflow-y-auto">
         <div className="mb-12 px-4">
            <div className="flex items-center gap-4 text-blue-500 mb-2">
               <Terminal size={24} />
               <span className="hidden md:inline text-[9px] font-black tracking-[0.5em] uppercase text-white/40 leading-none">Control Panel</span>
            </div>
            <h2 className="hidden md:block text-2xl font-black tracking-tighter italic uppercase text-white leading-none">Services</h2>
         </div>

         <div className="space-y-2">
            {[
               { id: 'CORE', icon: <Globe size={18} />, label: 'General' },
               { id: 'DATA', icon: <Database size={18} />, label: 'Database' },
               { id: 'S3', icon: <Box size={18} />, label: 'S3 Storage' },
               { id: 'MAIL', icon: <Mail size={18} />, label: 'Messaging' },
               { id: 'SECURITY', icon: <Shield size={18} />, label: 'Security' },
               { id: 'CUSTOM', icon: <Box size={18} />, label: 'Custom Args' }
            ].map((cat) => (
              <button key={cat.id} onClick={() => setActiveCat(cat.id as Category)} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all group ${activeCat === cat.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-gray-500 hover:bg-white/5 hover:text-white'}`}>
                 <span className={`${activeCat === cat.id ? 'text-white' : 'text-gray-600 group-hover:text-blue-400'}`}>{cat.icon}</span>
                 <div className="hidden md:flex flex-col items-start translate-y-0.5">
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">{cat.id}</span>
                    <span className="text-[8px] font-bold opacity-40 uppercase tracking-tighter">{cat.label}</span>
                 </div>
              </button>
            ))}
         </div>

         <div className="mt-auto px-4 pt-8">
            <button onClick={onClose} className="w-full py-4 bg-white/5 hover:bg-red-500/10 border border-white/5 hover:border-red-500/20 rounded-2xl flex items-center justify-center gap-3 transition-all text-gray-500 hover:text-red-400 group">
               <X size={18} />
               <span className="hidden md:inline text-[10px] font-black uppercase tracking-widest">Close</span>
            </button>
         </div>
      </nav>

      {/* MAIN CONSOLE AREA */}
      <main className="flex-1 flex flex-col bg-[#050505] relative overflow-hidden">
         <header className="p-8 md:p-12 border-b border-white/5 flex flex-col md:flex-row md:items-end justify-between gap-6 shrink-0 relative z-10">
            <div>
               <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-[2px] bg-blue-500" />
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em]">Active Configuration ({agentSite})</span>
               </div>
               <h3 className="text-4xl font-black uppercase tracking-tighter text-white italic transition-all">{activeCat} <span className="text-gray-800 underline decoration-blue-500/20">SETTINGS_PANEL</span></h3>
            </div>

            <div className="flex items-center gap-4 bg-white/5 p-1 rounded-2xl border border-white/5 w-full md:w-96 shadow-inner">
               <Search size={16} className="ml-4 text-gray-600" />
               <input placeholder="Filter settings..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 bg-transparent border-none outline-none py-3 px-4 text-[11px] font-bold text-white placeholder:text-gray-700" />
            </div>
         </header>

         {/* LIST AREA */}
         <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar relative z-10">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-20">
               {visibleKeys.length > 0 ? visibleKeys.map(([k, v]) => (
                 <div key={k} className="group relative flex flex-col gap-2 p-6 bg-white/[0.03] border border-white/5 rounded-3xl hover:bg-white/[0.05] hover:border-white/10 transition-all hover:z-[50]">
                    <div className="flex justify-between items-center mb-1">
                       <div className="flex items-center gap-3">
                          {PROTECTED_KEYS.has(k) && <Shield size={12} className="text-blue-500/60" />}
                          <span className={`text-[10px] font-black uppercase tracking-widest ${PROTECTED_KEYS.has(k) ? 'text-blue-400' : 'text-gray-500'}`}>{k}</span>
                          {HINTS[k] && (
                             <div className="group/hint relative">
                                <Info size={12} className="text-gray-700 cursor-help hover:text-blue-500 transition-colors" />
                                <div className="absolute left-0 bottom-full mb-3 w-64 p-4 bg-blue-600 rounded-2xl text-[10px] font-bold text-white opacity-0 group-hover/hint:opacity-100 transition-all pointer-events-none z-[500] shadow-2xl leading-relaxed scale-95 group-hover/hint:scale-100 origin-bottom-left border border-white/10">
                                   {HINTS[k]}
                                </div>
                             </div>
                          )}
                       </div>
                       {!PROTECTED_KEYS.has(k) && (
                          <button onClick={() => removeField(k)} className="p-2 text-gray-700 hover:text-red-500 transition-colors">
                             <Trash2 size={14} />
                          </button>
                       )}
                    </div>
                    <div className="relative">
                       <input 
                          type={isSensitive(k) && !showSecrets ? "password" : "text"}
                          value={v}
                          placeholder={PLACEHOLDERS[k.toLowerCase()] || `Enter ${k.toLowerCase()}...`}
                          spellCheck={false}
                          onChange={(e) => setConfig({...config, [k]: e.target.value})}
                          className="w-full bg-transparent border-none outline-none py-2 text-xl font-bold tracking-tight text-white focus:text-blue-400 transition-colors placeholder:text-gray-800 translate-y-[-2px]"
                       />
                       <div className="absolute bottom-0 left-0 h-[1px] w-full bg-white/5 group-hover:bg-blue-500/30 transition-all" />
                    </div>
                 </div>
               )) : (
                 <div className="col-span-full py-20 text-center opacity-20 italic text-[10px] font-black uppercase tracking-[0.5em]">No_Results_Found</div>
               )}
            </div>
         </div>

          {/* FOOTER ACTION BAR */}
          <footer className="shrink-0 p-6 md:p-8 border-t border-white/5 bg-[#080808] flex flex-col gap-6 relative z-10 shadow-3xl shadow-black">
             <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
                <div className="flex-1 flex gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/5 shadow-inner ring-1 ring-white/5 overflow-hidden">
                   <input placeholder="KEY" value={newKey} autoComplete="off" onChange={(e) => setNewKey(e.target.value)} className="flex-1 min-w-0 bg-transparent border-none px-4 py-3 text-[10px] font-black text-white focus:outline-none uppercase tracking-[0.2em] placeholder:text-gray-700"  />
                   <input placeholder="VALUE" value={newVal} autoComplete="off" onChange={(e) => setNewVal(e.target.value)} className="flex-[1.5] min-w-0 bg-transparent border-none px-4 py-3 text-[10px] font-bold text-white focus:outline-none placeholder:text-gray-700" />
                   <button onClick={addField} className="px-6 bg-white/10 rounded-xl hover:bg-blue-600 text-white transition-all text-xs font-black uppercase tracking-widest active:scale-95 shadow-lg group flex items-center gap-3 shrink-0">
                      <span className="hidden sm:inline">Add</span> <Plus size={16} className="group-hover:rotate-90 transition-transform" />
                   </button>
                </div>
 
                <div className="flex items-center gap-3 w-full lg:w-auto">
                   <button onClick={() => setShowSecrets(!showSecrets)} className={`flex-1 lg:flex-none flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-black text-[9px] tracking-widest transition-all uppercase border ${showSecrets ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-white/3 border-white/10 text-gray-500 hover:text-white'}`}>
                      {showSecrets ? <EyeOff size={14} /> : <Eye size={14} />} 
                      <span className="truncate">{showSecrets ? 'Hide' : 'Show'}</span>
                   </button>
 
                   <button onClick={() => { onSync(); onClose(); }} className="flex-[2] lg:w-64 py-5 bg-blue-600 rounded-2xl font-black text-[10px] tracking-[0.2em] text-white hover:bg-blue-500 shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-4 active:scale-95 uppercase italic cursor-pointer ring-1 ring-white/10 shrink-0">
                      <RefreshCcw size={16} className="animate-spin-slow" /> Save Changes
                   </button>
                </div>
             </div>
          </footer>
      </main>
    </motion.div>
  );
};
