import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Package, ShieldCheck, Zap, Download, BookOpen } from 'lucide-react';
import { api } from '../lib/api';

interface PluginMarketplaceProps {
  onClose: () => void;
  onDeploy: (plugin: string) => void;
  agentSite: string;
}

export const PluginMarketplace: React.FC<PluginMarketplaceProps> = ({ onClose, onDeploy, agentSite }) => {
  const [plugins, setPlugins] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/market-plugins').then(r => {
      setPlugins(r.data);
      setLoading(false);
    });
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-black overflow-hidden"
    >
      <div className="absolute top-10 right-10">
        <button onClick={onClose} className="p-4 bg-white/5 border border-white/10 rounded-full hover:bg-red-500/20 hover:border-red-500/40 text-white transition-all z-[210]">
          <X size={28} />
        </button>
      </div>

      <div className="max-w-7xl w-full h-full flex flex-col pt-10">
        <header className="mb-12 text-center">
            <h2 className="text-5xl font-black italic tracking-tighter text-white glow-text uppercase mb-2">App Store</h2>
            <div className="flex items-center justify-center gap-4">
              <span className="px-4 py-1.5 bg-blue-600 rounded-xl text-[9px] font-black uppercase tracking-widest text-white shadow-xl shadow-blue-500/40">Tool Repository</span>
              <span className="text-gray-550 font-bold uppercase tracking-widest text-[9px] italic opacity-50">Device: {agentSite}</span>
            </div>
        </header>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-6">
             <div className="w-20 h-20 border-t-2 border-blue-500 rounded-full animate-spin" />
             <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest animate-pulse">Connecting to repository...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 overflow-y-auto pr-6 custom-scrollbar flex-1 pb-10">
             {plugins.map(p => (
               <motion.div 
                 key={p}
                 whileHover={{ y: -10, scale: 1.02 }}
                 className="glass-card p-10 pb-16 border-white/10 group hover:border-blue-500/40 hover:bg-blue-600/5 transition-all relative overflow-hidden flex flex-col shadow-2xl shadow-black h-fit min-h-[440px]"
               >
                  {/* Decorative background icon */}
                  <div className="absolute -bottom-10 -right-10 opacity-5 group-hover:opacity-10 group-hover:text-blue-500 transition-all pointer-events-none">
                     <Package size={200} />
                  </div>

                  <div className="flex-1 relative z-10">
                    <div className="w-16 h-16 bg-blue-600/10 border border-blue-500/30 rounded-3xl flex items-center justify-center mb-10 text-blue-400 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-xl">
                       {p.includes('pago') ? <Zap size={30} /> : <Package size={30} />}
                    </div>
                    
                    <h3 className="text-2xl font-black italic text-white uppercase tracking-tighter mb-4 truncate">{p.replace('-', ' ')}.so</h3>
                    <p className="text-gray-500 text-sm font-bold uppercase leading-relaxed tracking-tight mb-8 line-clamp-3 overflow-hidden text-justify">
                       {p === 'mercado-pago' 
                         ? 'Official Mercado Pago gateway integration. Securely process credit cards, Pix, and digital wallets through high-performance encrypted tunnels.' 
                         : 'Advanced database orchestration module. Enables distributed SQL execution, real-time telemetry persistence, and high-concurrency data migrations across the fleet.'}
                    </p>

                    <div className="flex items-center gap-2 mb-10">
                       <ShieldCheck size={14} className="text-blue-500" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-blue-500/60">VERIFIED</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={() => { onDeploy(p); onClose(); }}
                      className="flex-1 py-5 bg-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-blue-500 shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95"
                    >
                      <Download size={16} /> INSTALL
                    </button>
                    <button 
                      onClick={() => window.open('https://docs.woogo.com/plugins/' + p, '_blank')}
                      className="px-6 py-5 bg-white/5 border border-white/10 rounded-2xl text-gray-400 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center group/btn"
                    >
                      <BookOpen size={16} className="group-hover/btn:scale-110 transition-transform" />
                    </button>
                  </div>
               </motion.div>
             ))}
             
             {/* Coming Soon Case */}
              <div className="glass-card p-10 border-dashed border-white/5 flex flex-col items-center justify-center opacity-30">
                  <Package size={60} className="text-gray-600 mb-6" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">More tools coming soon...</h3>
              </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
