import { useEditor } from '@craftjs/core';
import { Save, Monitor, Smartphone, Tablet, PanelLeft, PanelRight, Settings, Upload } from 'lucide-react';
import { transpileToAstro, transpileToHTML } from '../utils/transpiler';
import { useState } from 'react';
import { PublishModal } from './PublishModal';
import { useDataSourceStore } from '../store/dataSourceStore';

interface TopbarProps {
  device: 'desktop' | 'tablet' | 'mobile';
  setDevice: (device: 'desktop' | 'tablet' | 'mobile') => void;
  showToolbox: boolean;
  setShowToolbox: (show: boolean) => void;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  onOpenConfig?: () => void;
}

export const Topbar = ({ 
  device, setDevice, 
  showToolbox, setShowToolbox, 
  showSettings, setShowSettings,
  onOpenConfig
}: TopbarProps) => {
  const { actions, query, enabled } = useEditor((state) => ({
    enabled: state.options.enabled
  }));

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePublishConfirm = async (name: string) => {
    try {
      const json = query.serialize();
      const sources = useDataSourceStore.getState().sources;
      const astroCode = transpileToAstro(json);
      const htmlCode = transpileToHTML(json, JSON.stringify(sources));
      
      const response = await fetch('http://localhost:4003/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ astroCode, htmlCode, json, sources, name })
      });
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Publish Error:", error);
      return { success: false, message: "Error de red al publicar" };
    }
  };

  return (
    <div className="h-14 bg-white border-b border-gray-200 px-4 flex items-center justify-between z-50 shadow-sm shrink-0">
      {/* Left: Brand & Toolbox Toggle */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setShowToolbox(!showToolbox)}
          className={`p-2 rounded-lg transition-colors ${showToolbox ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-100'}`}
          title="Toggle Toolbox"
        >
          <PanelLeft size={20} />
        </button>
        
        <div className="flex items-center gap-2 border-r border-gray-200 pr-4">
          <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-all">
            <span className="text-white font-black text-xs italic">DN</span>
          </div>
          <h1 className="font-bold text-gray-900 tracking-tight uppercase text-[10px] tracking-widest hidden md:block">Builder</h1>
        </div>

        <button 
          onClick={onOpenConfig}
          className="text-gray-500 hover:text-blue-600 transition-all flex items-center gap-2 group"
          title="Configuración de Workflows"
        >
          <Settings size={18} className="group-hover:rotate-90 transition-transform duration-500" />
          <span className="font-bold uppercase text-[10px] tracking-widest hidden lg:block">Configuración</span>
        </button>
      </div>

      {/* Center: Device Controls */}
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
        <button 
          onClick={() => setDevice('desktop')}
          className={`p-2 rounded-md transition-all ${device === 'desktop' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
          title="Desktop View"
        >
          <Monitor size={18} />
        </button>
        <button 
          onClick={() => setDevice('tablet')}
          className={`p-2 rounded-md transition-all ${device === 'tablet' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
          title="Tablet View"
        >
          <Tablet size={18} />
        </button>
        <button 
          onClick={() => setDevice('mobile')}
          className={`p-2 rounded-md transition-all ${device === 'mobile' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
          title="Mobile View"
        >
          <Smartphone size={18} />
        </button>
      </div>

      {/* Right: Actions & Settings Toggle */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-100">
          <button 
            onClick={() => actions.setOptions((options) => (options.enabled = true))}
            className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${enabled ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Edit
          </button>
          <button 
            onClick={() => actions.setOptions((options) => (options.enabled = false))}
            className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${!enabled ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Preview
          </button>
        </div>

        <button 
          onClick={() => {
            const json = query.serialize();
            console.log("Layout Guardado:", json);
            alert("¡Layout guardado en consola!");
          }}
          className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg font-bold uppercase text-[10px] tracking-widest hover:bg-gray-200 transition-all flex items-center gap-2"
        >
          <Save size={14} />
          <span className="hidden md:inline">Guardar</span>
        </button>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-gray-900 text-white px-4 py-2 rounded-lg font-bold uppercase text-[10px] tracking-widest hover:bg-blue-600 transition-all flex items-center gap-2"
        >
          <Upload size={14} />
          <span className="hidden md:inline">Publicar</span>
        </button>

        <button 
          onClick={() => setShowSettings(!showSettings)}
          className={`p-2 rounded-lg transition-colors border-l border-gray-200 pl-4 ml-1 ${showSettings ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-100'}`}
          title="Toggle Settings"
        >
          <PanelRight size={20} />
        </button>
      </div>

      <PublishModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onConfirm={handlePublishConfirm} 
      />
    </div>
  );
};