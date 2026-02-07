import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, Search, Menu, User } from "lucide-react";
import { useCategoriesStore } from "../store/categoriesStore";
import { useCartStore } from "../store/cartStore";
import BentoMegaMenu from "./BentoMegaMenu";

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";

  const fetchCategories = async (): Promise<Category[]> => {
    const res = await fetch(`${apiUrl}/wc/categories`);
    if (!res.ok) throw new Error("Error fetching categories");
    return res.json();
  };

  const { data } = useQuery<Category[], Error>({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 1000 * 60 * 60,
  });

  React.useEffect(() => {
    if (data) setCategoriesStore(data);
  }, [data, setCategoriesStore]);

  const categories = data ?? [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm("");
    }
  };

  return (
    <>
      <BentoMegaMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        categories={categories} 
      />

      <header className="w-full relative z-40 bg-white border-b border-gray-100">
        {/* Top Bar */}
        <div className="bg-black text-white text-[9px] font-black uppercase tracking-[0.2em] py-2.5 px-6">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <span>Fabricado en Buenos Aires 🇦🇷</span>
            <span className="hidden md:block">Envíos a todo el país</span>
          </div>
        </div>

        {/* Main Nav */}
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center gap-4">
            
            {/* Left: Menu Button & Logo */}
            <div className="flex items-center gap-6">
              <button 
                onClick={() => setIsMenuOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors group"
                aria-label="Abrir menú"
              >
                <Menu size={24} className="text-gray-900 group-hover:scale-110 transition-transform" />
              </button>
              
              <Link to="/" className="flex-shrink-0">
                <img
                  src={`${apiUrl}/wp-content/uploads/2025/08/390a25d5-d704-4638-8371-7745f58f5b28.svg`}
                  alt="DN Style"
                  className="h-10 md:h-12 w-auto"
                />
              </Link>
            </div>

            {/* Center: Search (Hidden on small mobile) */}
            <div className="hidden md:flex flex-1 max-w-lg mx-auto">
              <form onSubmit={handleSearch} className="relative w-full group">
                <input
                  type="text"
                  placeholder="BUSCAR PRODUCTOS..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-full px-6 py-3 text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-black/5 transition-all outline-none"
                />
                <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors">
                  <Search size={18} strokeWidth={3} />
                </button>
              </form>
            </div>

            {/* Right: Icons */}
            <div className="flex items-center gap-4 md:gap-6 text-gray-900">
              <button onClick={() => setIsMenuOpen(true)} className="md:hidden">
                <Search size={24} />
              </button>
              <Link to="/account" className="hover:scale-110 transition-transform" aria-label="Cuenta"><User size={24} /></Link>
              <Link to="/cart" className="relative hover:scale-110 transition-transform" aria-label="Carrito">
                <ShoppingCart size={24} />
                {itemsCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-black text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                    {itemsCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;