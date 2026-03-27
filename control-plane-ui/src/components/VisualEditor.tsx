import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Save, Send, Code, Shield, HelpCircle } from 'lucide-react';
import { api } from '../lib/api';
import type { DBTemplate, UserSession } from '../types';
import { VariableDocs } from './VariableDocs';

interface VisualEditorProps {
  user: UserSession;
  notify: (msg: string, type?: any) => void;
}

export const VisualEditor: React.FC<VisualEditorProps> = ({ user, notify }) => {
  const [templates, setTemplates] = useState<DBTemplate[]>([]);
  const [selected, setSelected] = useState<DBTemplate | null>(null);
  const [htmlContent, setHtmlContent] = useState('');
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('preview');
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    api.get('/templates').then(r => setTemplates(r.data));
  }, [user]);

  const handleSave = async () => {
    if (!selected) return;
    const updated = { ...selected, html: htmlContent };
    await api.post('/templates', updated);
    setTemplates(templates.map(t => t.id === updated.id ? updated : t));
    setSelected(updated);
    notify('Template synchronization successful', 'success');
  };

  const createTemplate = async () => {
    const name = prompt("Template Name (e.g. WELCOME_EMAIL):");
    if (!name) return;
    const newT: Partial<DBTemplate> = {
      name: name.toUpperCase(),
      html: `<!DOCTYPE html><html><body><h1>${name}</h1></body></html>`
    };
    const r = await api.post('/templates', newT);
    setTemplates([...templates, r.data]);
    setSelected(r.data);
    setHtmlContent(r.data.html);
  };

  const syncToFleet = async () => {
    notify('Propagating Master Assets to all Autonomous Nodes...', 'info');
  };

  const formatHTML = (code: string) => {
    let formatted = '';
    let indent = '';
    const tab = '  ';
    const lines = code.replace(/>\s*</g, '>\n<').split('\n');
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      if (trimmed.match(/^<\//)) indent = indent.substring(tab.length);
      formatted += indent + trimmed + '\n';
      if (trimmed.match(/^<[^/!][^>]*[^/]>$/) && !trimmed.includes('<img') && !trimmed.includes('<input') && !trimmed.includes('<br') && !trimmed.includes('<hr') && !trimmed.includes('<meta')) {
        indent += tab;
      }
    });
    return formatted.trim();
  };

  const handleSelect = (t: DBTemplate) => {
    setSelected(t);
    setHtmlContent(formatHTML(t.html));
  };

  const formatHTMLCode = () => {
    setHtmlContent(formatHTML(htmlContent));
    notify('Code beautified successfully', 'success');
  };

  return (
    <div className="flex flex-col h-[85vh]">
      <header className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-5xl font-black italic tracking-tighter glow-text uppercase text-white leading-none">Visual Editor</h1>
          <p className="text-gray-500 text-sm font-bold mt-3 italic tracking-tighter opacity-70 uppercase tracking-widest leading-none">DN SHOP DESIGN ENGINE v4.0</p>
        </div>
        <div className="flex gap-4">
          <button onClick={handleSave} className="flex items-center gap-2 px-8 py-3 bg-blue-600 rounded-2xl font-black text-[10px] tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all text-white hover:bg-blue-500"><Save size={16}/> SAVE</button>
          <button onClick={() => setShowHelp(true)} className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl font-black text-[10px] tracking-widest hover:border-blue-500 transition-all text-blue-400 uppercase italic"><HelpCircle size={16}/> HELP</button>
          <button onClick={syncToFleet} className="flex items-center gap-2 px-8 py-3 bg-white/5 border border-white/10 rounded-2xl font-black text-[10px] tracking-widest hover:border-blue-500 transition-all text-white uppercase"><Send size={16}/> SYNC_TO_FLEET</button>
        </div>
      </header>

      <div className="flex-1 flex gap-8 overflow-hidden">
        {/* Sidebar Archives */}
        <div className="w-80 space-y-4 shrink-0 overflow-y-auto pr-4 custom-scrollbar">
           <div className="flex justify-between items-center mb-4">
              <div className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Saved Templates</div>
              <button onClick={createTemplate} className="text-[9px] font-black text-blue-500 hover:text-white transition-colors">+ NEW_TEMPLATE</button>
           </div>
           {templates.map(t => (
             <button key={t.id} onClick={() => handleSelect(t)} className={`glass-card p-6 w-full text-left transition-all ${selected?.id === t.id ? 'border-blue-500 bg-blue-500/10' : 'hover:border-white/20 border-white/5 opacity-80'}`}>
                <div className="h-28 w-full bg-white rounded-xl overflow-hidden mb-4 border border-white/10 relative group-hover:scale-[1.02] transition-transform pointer-events-none">
                   <iframe 
                      srcDoc={t.html} 
                      title={t.name}
                      className="w-[1000px] h-[800px] border-none scale-[0.25] origin-top-left absolute top-0 left-0"
                   />
                </div>
                <div className="flex justify-between items-center mb-2">
                   <div className="text-[9px] text-blue-500 font-black uppercase tracking-widest leading-none">TYPE: HTML</div>
                   <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                </div>
                <div className="text-sm font-black uppercase tracking-tighter text-white truncate">{t.name}</div>
             </button>
           ))}
        </div>

        {/* Studio Editor Area */}
        {selected ? (
          <div className="flex-1 glass-card overflow-hidden flex flex-col relative border-white/10 shadow-3xl shadow-black">
             <div className="flex items-center justify-between p-2 bg-black/40 border-b border-white/5">
                <div className="flex gap-1">
                  <button onClick={() => setActiveTab('edit')} className={`px-6 py-2.5 text-[10px] font-black rounded-xl transition-all ${activeTab === 'edit' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>SOURCE_CODE</button>
                  <button onClick={() => setActiveTab('preview')} className={`px-6 py-2.5 text-[10px] font-black rounded-xl transition-all ${activeTab === 'preview' ? 'bg-white/10 text-white shadow-xl shadow-white/5' : 'text-gray-500 hover:text-gray-300'}`}>LIVE_PREVIEW</button>
                </div>
                <button onClick={formatHTMLCode} className="px-4 py-2 text-[9px] font-black text-blue-500 hover:text-white flex items-center gap-2 transition-all uppercase tracking-widest italic opacity-70 hover:opacity-100">FORMAT_CODE</button>
             </div>
             
             {activeTab === 'edit' ? (
               <textarea 
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  className="flex-1 bg-[#05070a] text-blue-400 font-mono text-sm p-12 outline-none resize-none spellcheck-false border-none line-height-relaxed"
                  spellCheck="false"
               />
             ) : (
               <div className="flex-1 bg-white overflow-hidden p-0 relative">
                  <iframe 
                    title="Live Preview"
                    srcDoc={htmlContent}
                    className="w-full h-full border-none"
                  />
               </div>
             )}

             <div className="absolute top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-blue-600/10 border border-blue-500/20 rounded-full text-[10px] font-black text-blue-500 tracking-widest flex items-center gap-2 backdrop-blur-xl">
                <Shield size={12}/> SYNC STATUS: SECURE
             </div>
          </div>
        ) : (
          <div className="flex-1 border-2 border-dashed border-white/5 rounded-[40px] flex flex-col items-center justify-center p-20 text-center bg-white/1">
             <Code size={72} className="text-gray-800 animate-pulse mb-8" />
             <h3 className="text-3xl font-black text-gray-700 uppercase italic mb-4 tracking-tighter">SELECT A TEMPLATE</h3>
             <p className="text-[10px] text-gray-500 max-w-xs uppercase font-black tracking-widest leading-relaxed">Select a template from the list to start editing.</p>
          </div>
        )}
      </div>
      <AnimatePresence>
        {showHelp && <VariableDocs onClose={() => setShowHelp(false)} />}
      </AnimatePresence>
    </div>
  );
};
