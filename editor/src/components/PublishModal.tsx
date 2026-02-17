import { useState } from 'react';
import { X, ExternalLink, Globe, Layout, CheckCircle2, Copy } from 'lucide-react';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string) => Promise<{ success: boolean; url?: string; message?: string }>;
}

export const PublishModal = ({ isOpen, onClose, onConfirm }: PublishModalProps) => {
  const [pageName, setPageName] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePublish = async () => {
    if (!pageName.trim()) {
        setError('Por favor, ingresa un nombre para la página');
        return;
    }
    setError(null);
    setIsPublishing(true);
    try {
      const result = await onConfirm(pageName);
      if (result.success && result.url) {
        setPublishedUrl(result.url);
      } else {
        setError(result.message || 'Error al publicar');
      }
    } catch (err) {
      setError('Error de red al intentar publicar');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
              <Globe size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">Publicar Página</h2>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Astro Engine</p>
            </div>
          </div>
          {!isPublishing && (
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-100 rounded-lg">
              <X size={20} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-8">
          {!publishedUrl ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nombre de la página (Slug)</label>
                <div className="relative group">
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                      <Layout size={18} />
                   </div>
                   <input
                    type="text"
                    placeholder="ej: mi-nueva-landing"
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium text-slate-700 placeholder:text-slate-400"
                    value={pageName}
                    onChange={(e) => setPageName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                    disabled={isPublishing}
                    onKeyDown={(e) => e.key === 'Enter' && handlePublish()}
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-medium italic">Se generará como: {pageName || 'nombre'}.astro</p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-500 text-xs font-bold rounded-xl animate-in shake duration-300">
                  {error}
                </div>
              )}

              <button
                onClick={handlePublish}
                disabled={isPublishing || !pageName.trim()}
                className="w-full py-4 bg-slate-900 hover:bg-blue-600 text-white rounded-xl font-black uppercase text-xs tracking-[0.2em] shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3 group"
              >
                {isPublishing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Publicando...</span>
                  </>
                ) : (
                  <>
                    <span>Confirmar Publicación</span>
                    <Globe size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="text-center space-y-6 animate-in slide-in-from-bottom-4 duration-300">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center shadow-inner animate-in zoom-in-75 duration-500 delay-150">
                   <CheckCircle2 size={40} />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">¡Publicada!</h3>
                <p className="text-sm text-slate-500 font-medium">Tu diseño ha sido traspolado a Astro y ya está disponible.</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                 <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">URL de acceso</span>
                    <button 
                        onClick={() => {
                            navigator.clipboard.writeText(publishedUrl);
                            // Simple toast or feedback here if needed
                        }}
                        className="text-blue-500 hover:text-blue-700 transition-colors p-1"
                    >
                        <Copy size={16} />
                    </button>
                 </div>
                 <code className="block text-xs font-mono text-blue-600 break-all bg-white p-3 rounded-lg border border-blue-50 shadow-sm">{publishedUrl}</code>
              </div>

              <div className="flex gap-3">
                <button
                    onClick={onClose}
                    className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all"
                >
                    Cerrar
                </button>
                <a
                  href={publishedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-[2] py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase text-[10px] tracking-widest transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
                >
                  <ExternalLink size={16} />
                  Ver Página
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
