import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, Search, User, Menu, X, ChevronDown } from "lucide-react";
import { useCategoriesStore } from "../store/categoriesStore";
import { useCartStore } from "../store/cartStore";

interface Category {
  id: number;
  name: string;
  slug: string;
  parent: number;
  image?: string;
}

const Header: React.FC = () => {
  const navigate = useNavigate();
  const setCategoriesStore = useCategoriesStore((state) => state.setCategories);
  const itemsCount = useCartStore((state) => state.itemsCount());
  const [searchTerm, setSearchTerm] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);

  const apiUrl = import.meta.env.VITE_API_URL || "";

  const fetchCategories = async (): Promise<Category[]> => {
    const res = await fetch(`${apiUrl}/wc/categories`);
    if (!res.ok) throw new Error("Error fetching categories");
    return res.json();
  };

  const { data } = useQuery<Category[], Error>({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 1000 * 60 * 5, // 5 minutos de stale time
  });

  React.useEffect(() => {
    if (data) setCategoriesStore(data);
  }, [data, setCategoriesStore]);

  const categories = data ?? [];
  const topCategories = categories.filter(c => c.parent === 0);
  const getSubcategories = (parentId: number) => categories.filter(c => c.parent === parentId);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm("");
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <header className="w-full sticky top-0 z-[100] bg-white shadow-sm">
      {/* 1. Barra de Anuncio Superior */}
      {/* <div className="bg-black text-white text-[10px] md:text-[11px] font-bold uppercase tracking-[0.25em] py-2 text-center">
        <span>✈️ Envíos Gratis en compras superiores a $100.000 — De Brandsen a todo el país</span>
      </div> */}

      {/* 2. Main Header (Logo, Search, Icons) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 md:h-24 gap-8">
          
          {/* Logo (Izquierda) */}
          <div className="flex-shrink-0">
            <Link to="/" className="block">
              <img
                src={`${apiUrl}/wp-content/uploads/2026/03/logodnstyle.png`}
                alt="DN shop"
                className="h-10 md:h-14 w-auto transform transition-transform hover:scale-105"
              />
            </Link>
          </div>

          {/* Buscador Central (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-xl mx-auto">
            <form onSubmit={handleSearch} className="relative w-full group">
              <input
                type="text"
                placeholder="¿Qué estás buscando hoy?"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-50 border-0 rounded-2xl px-12 py-3.5 text-xs font-medium focus:ring-2 focus:ring-black/10 transition-all outline-none placeholder:text-gray-400"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" size={18} />
              <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 bg-black text-white text-[10px] font-black uppercase tracking-tighter px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors">
                Buscar
              </button>
            </form>
          </div>

          {/* Iconos de Usuario y Carrito (Derecha) */}
          <div className="flex items-center gap-2 md:gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
              className="md:hidden p-2.5 text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            
            <Link to="/account" className="p-2.5 text-gray-900 hover:bg-gray-100 rounded-xl transition-all hidden sm:flex items-center gap-2 group">
              <User size={22} className="group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest hidden lg:block">Mi Cuenta</span>
            </Link>

            <Link to="/cart" className="relative p-2.5 bg-black text-white rounded-xl hover:scale-105 transition-all shadow-md active:scale-95 flex items-center gap-2">
              <ShoppingCart size={22} />
              {itemsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-in zoom-in duration-300">
                  {itemsCount}
                </span>
              )}
              <span className="text-[10px] font-black uppercase tracking-widest hidden lg:block">Carrito</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 3. BARRA CENTRAL DE CATEGORÍAS (Desktop) */}
      <nav className="hidden md:block border-t border-gray-50">
        <div className="max-w-7xl mx-auto">
          <ul className="flex justify-center items-center gap-2 lg:gap-4 h-14">
            <li>
              <Link to="/" className="px-5 h-14 flex items-center text-[11px] font-black uppercase tracking-[0.15em] text-gray-900 hover:text-blue-600 transition-colors border-b-2 border-transparent hover:border-blue-600">
                Inicio
              </Link>
            </li>
            
            {topCategories.map((cat) => {
              const subs = getSubcategories(cat.id);
              const hasSubs = subs.length > 0;

              return (
                <li 
                  key={cat.id} 
                  className="relative group"
                  onMouseEnter={() => setActiveDropdown(cat.id)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <Link 
                    to={`/categoria/${cat.slug}`} 
                    className="px-5 h-14 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.15em] text-gray-900 hover:text-blue-600 transition-colors border-b-2 border-transparent group-hover:border-blue-600"
                  >
                    {cat.name}
                    {hasSubs && <ChevronDown size={14} className="group-hover:rotate-180 transition-transform" />}
                  </Link>

                  {/* Dropdown Menu */}
                  {hasSubs && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-64 bg-white shadow-2xl rounded-2xl border border-gray-100 py-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 translate-y-2 group-hover:translate-y-0 z-[100]">
                      <div className="grid grid-cols-1 divide-y divide-gray-50">
                        {subs.map(sub => (
                          <Link 
                            key={sub.id} 
                            to={`/categoria/${sub.slug}`}
                            className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500 hover:text-black hover:bg-gray-50 transition-colors"
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[112px] bg-white z-[110] animate-in slide-in-from-top duration-300 overflow-y-auto pb-20">
          <div className="p-6">
            <form onSubmit={handleSearch} className="relative w-full mb-8">
              <input
                type="text"
                placeholder="BUSCAR PRODUCTOS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-xs font-bold uppercase tracking-widest focus:ring-2 focus:ring-black/5 transition-all outline-none"
              />
              <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            </form>

            <div className="grid grid-cols-1 gap-1">
              <Link 
                to="/" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-4 py-5 font-black text-xl uppercase tracking-tighter border-b border-gray-50 flex justify-between items-center group"
              >
                Inicio <X size={16} className="text-gray-100 group-hover:text-black" />
              </Link>
              
              {topCategories.map((cat) => (
                <div key={cat.id} className="border-b border-gray-50">
                   <Link 
                    to={`/categoria/${cat.slug}`} 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-4 py-5 font-black text-xl uppercase tracking-tighter flex justify-between items-center"
                  >
                    {cat.name}
                  </Link>
                  {/* Simplificado para móvil: solo categorías principales */}
                </div>
              ))}

              <Link 
                to="/account" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="mt-8 mx-4 p-5 bg-black text-white rounded-3xl font-black uppercase tracking-widest text-center flex items-center justify-center gap-3"
              >
                <User size={20} /> Mi Cuenta
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;