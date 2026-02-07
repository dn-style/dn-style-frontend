import React from "react";
import { Link } from "react-router-dom";
import { X, ArrowRight } from "lucide-react";

interface Category {
  id: number;
  name: string;
  slug: string;
  parent: number;
  image?: string;
}

interface BentoMegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
}

const BentoMegaMenu: React.FC<BentoMegaMenuProps> = ({ isOpen, onClose, categories }) => {
  if (!isOpen) return null;

  const topCategories = categories.filter((cat) => cat.parent === 0);
  const getSubCategories = (parentId: number) => categories.filter((cat) => cat.parent === parentId);

  return (
    <div className="fixed inset-0 z-[100] bg-white animate-in slide-in-from-left duration-300 flex flex-col">
      {/* Header del Menú */}
      <div className="flex justify-between items-center p-6 border-b border-gray-100">
        <span className="text-sm font-black uppercase tracking-[0.2em]">Menú Principal</span>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <X size={24} />
        </button>
      </div>

      {/* Contenido Bento */}
      <div className="flex-1 overflow-y-auto p-6 md:p-12 bg-gray-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Tarjeta de Inicio (Destacada) */}
            <Link 
              to="/" 
              onClick={onClose}
              className="bg-black text-white p-8 rounded-[2rem] flex flex-col justify-between group hover:scale-[1.02] transition-transform duration-300 md:col-span-2 lg:col-span-1 min-h-[200px]"
            >
              <div className="flex justify-between items-start">
                <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-md">Colección 2026</span>
                <ArrowRight className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div>
                <h3 className="text-3xl font-black uppercase tracking-tighter mb-2">Inicio</h3>
                <p className="text-sm text-gray-400 font-medium">Explora las últimas novedades.</p>
              </div>
            </Link>

            {/* Categorías Dinámicas */}
            {topCategories.map((cat) => {
              const subCats = getSubCategories(cat.id);
              // Asignar colores o estilos aleatorios para variedad visual
              const bgClass = subCats.length > 0 ? "bg-white" : "bg-blue-600 text-white";
              const textClass = subCats.length > 0 ? "text-gray-900" : "text-white";

              return (
                <div key={cat.id} className={`${bgClass} p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group min-h-[240px]`}>
                  <div>
                    <Link to={`/categoria/${cat.slug}`} onClick={onClose} className="flex justify-between items-center mb-6">
                      <h3 className={`text-2xl font-black uppercase tracking-tighter ${textClass} group-hover:underline`}>{cat.name}</h3>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform group-hover:-rotate-45 ${subCats.length > 0 ? 'bg-gray-100' : 'bg-white/20'}`}>
                        <ArrowRight size={16} className={textClass} />
                      </div>
                    </Link>
                    
                    {subCats.length > 0 && (
                      <ul className="space-y-3">
                        {subCats.slice(0, 5).map(sub => (
                          <li key={sub.id}>
                            <Link 
                              to={`/categoria/${sub.slug}`} 
                              onClick={onClose}
                              className="text-sm font-bold text-gray-500 hover:text-black flex items-center gap-2 transition-colors"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover:bg-blue-500 transition-colors"></span>
                              {sub.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  
                  {/* Imagen decorativa si existe (placeholder por ahora) */}
                  {cat.image && (
                     <img src={cat.image} alt="" className="w-24 h-24 object-contain self-end opacity-20 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                  )}
                </div>
              );
            })}

            {/* Tarjeta de Soporte */}
            <div className="bg-gray-200 p-8 rounded-[2rem] flex flex-col justify-center items-center text-center gap-4 hover:bg-gray-300 transition-colors">
               <h3 className="text-xl font-black uppercase tracking-tight text-gray-900">¿Necesitas Ayuda?</h3>
               <Link to="/support" onClick={onClose} className="bg-white px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest shadow-lg hover:shadow-xl transition-all">
                 Centro de Soporte
               </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default BentoMegaMenu;
