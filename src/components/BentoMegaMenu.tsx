import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Star, Truck, ShieldCheck, Tag, Zap } from "lucide-react";

interface Category {
  id: number;
  name: string;
  slug: string;
  parent: number;
  link: string;
  image?: string;
}

interface Brand {
  name: string;
  image: string;
}

interface BentoMegaMenuProps {
  category: Category;
  subCategories: Category[];
  brands?: Brand[];
  onClose: () => void;
}

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=2670&auto=format&fit=crop";

const BentoMegaMenu: React.FC<BentoMegaMenuProps> = ({
  category,
  subCategories,
  brands = [],
  onClose,
}) => {
  return (
    <>
      <div className="fixed inset-0 top-[160px] bg-black/10 backdrop-blur-[2px] -z-10 transition-opacity" aria-hidden="true" />

      <div className="absolute left-0 w-full flex justify-center z-50 pt-4 px-4">
        <div 
          className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] p-6 w-full max-w-7xl border border-gray-100 animate-in fade-in slide-in-from-top-4 duration-300"
          onMouseLeave={onClose}
        >
          <div className="grid grid-cols-12 grid-rows-2 gap-5 h-[520px]">
            
            {/* BLOQUE 1: Navegación / Subcategorías */}
            <div className="col-span-3 row-span-2 bg-slate-50 rounded-[2rem] p-8 flex flex-col hover:bg-slate-100 transition-colors border border-slate-200/50">
              <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-2 tracking-tight">
                {category.name}
              </h3>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <ul className="space-y-4">
                  {subCategories.length > 0 ? (
                    subCategories.map((sub) => (
                      <li key={sub.id}>
                        <Link
                          to={`/categoria/${sub.slug}`}
                          className="text-slate-600 hover:text-pink-600 hover:translate-x-2 transition-all duration-300 flex items-center gap-2 group text-base font-semibold"
                          onClick={onClose}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-pink-500 transition-colors" />
                          {sub.name}
                        </Link>
                      </li>
                    ))
                  ) : (
                    // Fallback: Quick Links si no hay subcategorías
                    ["Novedades", "Más Vendidos", "Ofertas del Mes", "Colección 2024"].map((item, i) => (
                      <li key={i}>
                        <Link
                          to={`/categoria/${category.slug}`}
                          className="text-slate-500 hover:text-black hover:translate-x-2 transition-all duration-300 flex items-center gap-2 text-base font-medium italic"
                          onClick={onClose}
                        >
                          <Zap size={14} className="text-yellow-500" />
                          {item}
                        </Link>
                      </li>
                    ))
                  )}
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-200">
                <Link 
                  to={`/categoria/${category.slug}`} 
                  className="flex items-center justify-between group/link w-full bg-black text-white p-4 rounded-2xl hover:bg-pink-600 transition-all duration-300"
                  onClick={onClose}
                >
                  <span className="font-bold text-sm uppercase tracking-widest">Ver Todo</span>
                  <ArrowRight size={18} className="group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* BLOQUE 2: Hero Visual (Marketing) */}
            <div className="col-span-6 row-span-2 relative group overflow-hidden rounded-[2rem] shadow-inner">
              <img
                src={category.image || FALLBACK_IMAGE}
                alt={category.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-10">
                <div className="flex items-center gap-2 mb-3">
                   <Star className="text-yellow-400 fill-yellow-400" size={16} />
                   <span className="text-white font-bold tracking-[0.2em] text-xs uppercase">Tendencia Semanal</span>
                </div>
                <h2 className="text-white text-5xl font-black mb-4 leading-none tracking-tighter">
                  Define tu <br /> <span className="text-pink-400">propio estilo</span>
                </h2>
                <p className="text-gray-300 text-lg mb-6 max-w-md leading-relaxed font-medium">
                  Explora nuestra selección curada de {category.name.toLowerCase()} para esta temporada.
                </p>
                <div className="flex gap-4">
                  <button className="bg-white text-black px-8 py-3 rounded-2xl text-sm font-black hover:bg-pink-50 transition-all active:scale-95">
                    DESCUBRIR
                  </button>
                </div>
              </div>
            </div>

            {/* BLOQUE 3: Marcas o Beneficios (Fallback si no hay marcas) */}
            <div className="col-span-3 row-span-1 bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm flex flex-col">
              <h4 className="text-slate-900 font-black mb-5 text-xs uppercase tracking-widest flex items-center gap-2">
                {brands.length > 0 ? "Marcas Oficiales" : "Nuestra Garantía"}
              </h4>
              <div className="grid grid-cols-2 gap-4 flex-1">
                {brands.length > 0 ? (
                  brands.slice(0, 4).map((brand, i) => (
                    <div key={i} className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-50 rounded-2xl hover:bg-pink-50 transition-colors group cursor-pointer border border-transparent hover:border-pink-100">
                      <div className="w-10 h-10 flex items-center justify-center">
                        <img src={brand.image} alt={brand.name} className="max-w-full max-h-full object-contain mix-blend-multiply opacity-70 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase group-hover:text-pink-600 truncate w-full text-center">{brand.name}</span>
                    </div>
                  ))
                ) : (
                  // Fallback: Trust Badges
                  <>
                    <div className="flex flex-col items-center justify-center p-3 bg-blue-50 rounded-2xl border border-blue-100 text-blue-600">
                      <Truck size={24} />
                      <span className="text-[9px] font-black mt-2 uppercase text-center">Envío Gratis</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-3 bg-green-50 rounded-2xl border border-green-100 text-green-600">
                      <ShieldCheck size={24} />
                      <span className="text-[9px] font-black mt-2 uppercase text-center">Seguridad</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-3 bg-purple-50 rounded-2xl border border-purple-100 text-purple-600">
                      <Star size={24} />
                      <span className="text-[9px] font-black mt-2 uppercase text-center">Original</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-3 bg-amber-50 rounded-2xl border border-amber-100 text-amber-600">
                      <Tag size={24} />
                      <span className="text-[9px] font-black mt-2 uppercase text-center">Cuotas</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* BLOQUE 4: Promo Card */}
            <div className="col-span-3 row-span-1 bg-gradient-to-br from-pink-500 to-rose-600 rounded-[2rem] p-8 flex flex-col justify-between relative overflow-hidden group cursor-pointer">
               <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
               <div className="z-10">
                  <div className="bg-white/20 backdrop-blur-md p-2 rounded-xl mb-4 w-max">
                    <Tag className="text-white" size={24} />
                  </div>
                  <h4 className="text-2xl font-black text-white leading-tight mb-2 italic">OFFER <br />ZONE</h4>
                  <p className="text-pink-100 text-sm font-bold opacity-80 uppercase tracking-tighter">Hasta 40% OFF</p>
               </div>
               <div className="z-10 flex items-center gap-2 text-white font-black text-xs group-hover:gap-4 transition-all">
                  IR A OUTLET <ArrowRight size={14} />
               </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default BentoMegaMenu;