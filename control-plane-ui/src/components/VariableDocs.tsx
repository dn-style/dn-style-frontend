import React from 'react';
import { motion } from 'framer-motion';
import { X, Info, Terminal } from 'lucide-react';

interface VariableDocsProps {
  onClose: () => void;
}

export const VariableDocs: React.FC<VariableDocsProps> = ({ onClose }) => {
  const vars = [
    { key: '{{name}}', desc: 'Full name of the customer as registered in the order.', type: 'String' },
    { key: '{{order_id}}', desc: 'Unique identifier for the order (e.g. #1234).', type: 'Integer/String' },
    { key: '{{total}}', desc: 'The final amount charged to the customer after taxes.', type: 'Currency' },
    { key: '{{year}}', desc: 'Current calendar year for copyright footers.', type: 'Integer' },
    { key: '{{items}}', desc: 'List of purchased items. Must be used with a loop tag.', type: 'Array' },
    { key: '{{#each items}}', desc: 'Liquid/Handlebars loop to iterate over purchased products.', type: 'Control Flow' },
    { key: '{{quantity}}', desc: 'Number of units for a specific item (inside loop).', type: 'Integer' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-black/70 backdrop-blur-3xl"
    >
      <div className="max-w-4xl w-full glass-card p-12 border-white/10 relative shadow-4xl shadow-black h-[80vh] flex flex-col">
         <button onClick={onClose} className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors">
            <X size={24} />
         </button>

         <header className="mb-10 shrink-0">
            <div className="flex items-center gap-4 mb-2">
               <div className="p-3 bg-blue-600/20 rounded-xl border border-blue-500/20 text-blue-500"><Terminal size={24}/></div>
               <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter">Liquid Variable Console</h2>
            </div>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic decoration-blue-500/30 underline underline-offset-4">Fleet Master Documentation v1.0</p>
         </header>

         <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-4">
            {vars.map(v => (
              <div key={v.key} className="p-6 bg-white/3 border border-white/5 rounded-2xl hover:bg-blue-600/5 hover:border-blue-500/20 transition-all flex justify-between items-start gap-8 group">
                 <div className="flex-1">
                    <div className="text-blue-400 font-mono font-bold text-lg mb-2 group-hover:text-blue-300 transition-colors uppercase italic">{v.key}</div>
                    <div className="text-gray-500 text-[11px] font-bold uppercase tracking-tight leading-relaxed">{v.desc}</div>
                 </div>
                 <div className="px-4 py-1.5 bg-black/40 border border-white/10 rounded-lg text-[9px] font-black text-white/40 uppercase tracking-widest">{v.type}</div>
              </div>
            ))}

            <div className="p-8 bg-blue-600 border border-blue-500 rounded-3xl mt-10 shadow-2xl shadow-blue-500/20">
               <div className="flex items-center gap-3 mb-4 text-white">
                  <Info size={18} />
                  <span className="text-xs font-black uppercase tracking-widest">Master Instruction</span>
               </div>
               <p className="text-sm font-bold text-blue-100 italic leading-relaxed">Ensure all variables are wrapped in double curly braces. Misspelling a variable key will result in a raw render rejection on the node fleet.</p>
            </div>
         </div>
      </div>
    </motion.div>
  );
};
