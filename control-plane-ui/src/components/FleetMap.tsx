import React from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import type { Agent } from '../types';

interface FleetMapProps {
  agents: Agent[];
  onSelect: (a: Agent) => void;
  selectedId?: string;
}

export const FleetMap: React.FC<FleetMapProps> = ({ agents, onSelect, selectedId }) => {
  // Simple projection: converting lat/lng to % of Container
  const getPos = (lat: number, lng: number) => {
    // Basic projection for a world map
    const x = ((lng + 180) * 100) / 360;
    const y = ((90 - lat) * 100) / 180;
    return { left: `${x}%`, top: `${y}%` };
  };

  return (
    <div className="relative w-full aspect-[2/1] bg-black/40 rounded-3xl border border-white/5 overflow-hidden group">
      {/* Dynamic Background Grid */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #3b82f6 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      
      {/* World Map SVG placeholder (Basic outline) */}
      <svg viewBox="0 0 1000 500" className="w-full h-full opacity-20 fill-gray-800">
         <path d="M211,105 L220,110 L225,100 Z M300,200 L320,210 L310,230 Z M800,100 L820,110 L810,120 Z" />
         {/* Representacin conceptual de continentes */}
         <rect x="150" y="100" width="150" height="200" rx="40" />
         <rect x="450" y="80" width="200" height="250" rx="60" />
         <rect x="700" y="150" width="100" height="200" rx="30" />
         <rect x="250" y="320" width="120" height="150" rx="30" />
      </svg>

      <div className="absolute inset-0">
        {agents.map(a => {
          const pos = getPos(a.lat || 0, a.lng || 0);
          const isOnline = a.status === 'ONLINE';
          const isSelected = selectedId === a.token;

          return (
            <motion.div
              key={a.token}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.2 }}
              onClick={() => onSelect(a)}
              className="absolute cursor-pointer -translate-x-1/2 -translate-y-1/2 z-10"
              style={pos}
            >
               {/* Pulsing Aura */}
               {isOnline && (
                 <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20 scale-150" />
               )}
               
               <div className={`relative px-3 py-2 rounded-xl border transition-all flex items-center gap-2 ${isSelected ? 'bg-blue-600 border-blue-400 shadow-xl shadow-blue-500/40' : 'bg-dark-800/90 border-white/10 opacity-70 hover:opacity-100 shadow-2xl shadow-black/60'}`}>
                  <Zap size={10} className={isOnline ? 'text-blue-200' : 'text-gray-600'} />
                  <span className="text-[9px] font-black uppercase tracking-tighter text-white whitespace-nowrap">{a.site}</span>
               </div>

               {/* Marker Stem */}
               <div className={`w-[1px] h-6 mx-auto ${isSelected ? 'bg-blue-400' : 'bg-white/10'}`} />
            </motion.div>
          );
        })}
      </div>

      <div className="absolute bottom-6 left-6 flex items-center gap-4 bg-black/60 backdrop-blur-xl border border-white/5 py-3 px-6 rounded-2xl shadow-2xl">
         <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-glow" />
            <span className="text-[9px] font-black uppercase tracking-widest text-blue-400">Server Link: ACTIVE</span>
         </div>
      </div>
    </div>
  );
};
