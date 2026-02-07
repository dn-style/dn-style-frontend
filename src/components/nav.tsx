import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, Search, MenuIcon, User } from "lucide-react";
import { useCategoriesStore } from "../store/categoriesStore";
import { useCartStore } from "../store/cartStore";
import BentoMegaMenu from "./BentoMegaMenu";

// const API_URL = import.meta.env.VITE_API_URL;

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

const BRANDS: Record<string, Brand[]> = {
  perfumes: [
    {
      name: "Carolina Herrera",
      image:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ48yDcHtJx2ZVFfyqGuRrTFWwts89-WSWucw&s",
    },
    {
      name: "Bvlgari",
      image:
        "https://i.pinimg.com/736x/d5/61/cd/d561cd448f7c7880ae6943b798cce1ca.jpg",
    },
    {
      name: "Bvlgari",
      image:
        "https://i.pinimg.com/736x/d5/61/cd/d561cd448f7c7880ae6943b798cce1ca.jpg",
    },
    {
      name: "Bvlgari",
      image:
        "https://i.pinimg.com/736x/d5/61/cd/d561cd448f7c7880ae6943b798cce1ca.jpg",
    },
    {
      name: "Bvlgari",
      image:
        "https://i.pinimg.com/736x/d5/61/cd/d561cd448f7c7880ae6943b798cce1ca.jpg",
    },
    {
      name: "Bvlgari",
      image:
        "https://i.pinimg.com/736x/d5/61/cd/d561cd448f7c7880ae6943b798cce1ca.jpg",
    },
    {
      name: "Bvlgari",
      image:
        "https://i.pinimg.com/736x/d5/61/cd/d561cd448f7c7880ae6943b798cce1ca.jpg",
    },
  ],
  electronica: [
    { name: "Samsung", image: "https://images.unsplash.com/photo-1610945661096-5124a83d477a?w=150&h=150&fit=crop" },
    { name: "Sony", image: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=150&h=150&fit=crop" },
  ],
  iphone: [
    { name: "Apple", image: "https://images.unsplash.com/photo-1616348436168-de43ad0db179?w=150&h=150&fit=crop" },
    { name: "Beats", image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=150&h=150&fit=crop" },
  ],
};
  const fetchCategories = async (): Promise<Category[]> => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";
    const res = await fetch(`${apiUrl}/wc/categories`);
    if (!res.ok) throw new Error("Error fetching categories");

  return res.json();
};

const Header: React.FC = () => {
  const setCategoriesStore = useCategoriesStore((state) => state.setCategories);
  const itemsCount = useCartStore((state) => state.itemsCount());
  
  const { data, isLoading, error } = useQuery<Category[], Error>({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
  });

  React.useEffect(() => {
    if (data) setCategoriesStore(data);
  }, [data, setCategoriesStore]);

  const categories = (data ?? []) as Category[];
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeTimeout = useRef<NodeJS.Timeout | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const topCategories = categories.filter((cat) => cat.parent === 0);
  const getSubCategories = (parentId: number) =>
    categories.filter((cat) => cat.parent === parentId);

  const handleMouseEnter = (slug: string) => {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    setOpenDropdown(slug);
  };

  const handleMouseLeave = () => {
    closeTimeout.current = setTimeout(() => setOpenDropdown(null), 300);
  };
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Buscando:", searchTerm);
  };

  return (
    <header className="shadow-md w-full relative z-50 mb-10">
      {/* top bar */}
      {/* <div className="bg-[#cc9966] text-white text-sm w-full"> */}
      <div className="bg-black text-white text-sm w-full">
        <div className="mx-auto flex justify-between  items-center py-2 px-4">
          <span>Fabricado en Buenos Aires, Argentina 🇦🇷</span>
          <span>Envíos a todo el país</span>
        </div>
      </div>

      {/* main nav */}
      <div className="flex flex-col max-w-5xl mx-auto relative z-50">
        <div className="flex flex-row md:mx-auto justify-between place-items-end py-4 px-4">
          {/* logo */}
          <div>
            <a href="/" className="flex items-center">
              <img
                src={`${apiUrl}/wp-content/uploads/2025/08/390a25d5-d704-4638-8371-7745f58f5b28.svg`}
                alt="Logo"
                className="h-16 w-auto hidden md:block"
              />
              <img
                src={`${apiUrl}/wp-content/uploads/2025/08/390a25d5-d704-4638-8371-7745f58f5b28.svg`}
                alt="Logo Mobile"
                className="h-16 w-auto md:hidden"
              />
            </a>
          </div>
          <div>
            {/* mobile menu button */}
            <button
              className="md:hidden text-gray-800"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <MenuIcon size={36}></MenuIcon>
            </button>
          </div>
        </div>
      </div>
      <div>
        <hr className="border-gray-200" />
        {/* desktop nav */}
        <nav className="hidden md:block">
          {isLoading ? (
            <p>Cargando...</p>
          ) : error ? (
            <p className="text-red-500">Error al cargar categorías</p>
          ) : (
            <ul className="flex justify-center items-center space-x-10 text-gray-800 font-light text-sm relative py-2">
              <li>
                <Link to="/" className="hover:text-pink-600">
                  INICIO
                </Link>
              </li>

              {topCategories.map((cat) => {
                const subCats = getSubCategories(cat.id);

                return (
                  <li
                    key={cat.id}
                    className=""
                    onMouseEnter={() => handleMouseEnter(cat.slug)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <Link
                      to={`/categoria/${cat.slug}`}
                      className="hover:text-pink-600 cursor-pointer"
                    >
                      {cat.name.toUpperCase()}
                    </Link>

                    {/* Nuevo Componente Bento MegaMenu - Ahora siempre se muestra al hacer hover */}
                    {openDropdown === cat.slug && (
                      <BentoMegaMenu
                        category={cat}
                        subCategories={subCats}
                        brands={BRANDS[cat.slug] || []}
                        onClose={() => setOpenDropdown(null)}
                      />
                    )}
                  </li>
                );
              })}

              <li>
                <Link to="/about" className="hover:text-pink-600">
                  NOSOTROS
                </Link>
              </li>
              <li>
                <Link to="/account" className="hover:text-pink-600" aria-label="Mi Cuenta">
                   <User size={20} />
                </Link>
              </li>
              <li>
                <Link to="/cart" className="text-black hover:text-pink-600 relative">
                  <ShoppingCart size={20} />
                  {itemsCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {itemsCount}
                    </span>
                  )}
                </Link>
              </li>
              <li>
                <form
                  onSubmit={handleSearch}
                  className="hidden md:flex items-center overflow-hidden ml-4 bg-pink-50"
                >
                  <input
                    type="text"
                    placeholder="Buscar productos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="hidden md:flex items-center border-0 h-7 overflow-hidden ml-4 bg-pink-50"
                  />
                  <button
                    type="submit"
                    className="bg-pink-200 px-3 py-1.5  hover:bg-pink-300 transition-colors duration-200 rounded-r-full"
                  >
                    <Search size={16} />
                  </button>
                </form>
              </li>
            </ul>
          )}
        </nav>

        {/* mobile nav */}
        {mobileOpen && (
          <div className="md:hidden bg-white border-t shadow-xl px-6 py-8 animate-fadeIn">
            <ul className="flex flex-col space-y-6">
              <li>
                <Link 
                  to="/" 
                  className="text-lg font-black uppercase tracking-widest text-gray-900"
                  onClick={() => setMobileOpen(false)}
                >
                  Inicio
                </Link>
              </li>
              {topCategories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    to={`/categoria/${cat.slug}`}
                    className="text-lg font-bold uppercase tracking-widest text-gray-600 hover:text-blue-600"
                    onClick={() => setMobileOpen(false)}
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
              <li className="pt-4 border-t border-gray-100">
                <Link to="/about" className="text-sm font-bold uppercase tracking-widest text-gray-400" onClick={() => setMobileOpen(false)}>Nosotros</Link>
              </li>
              <li>
                <Link to="/support" className="text-sm font-bold uppercase tracking-widest text-gray-400" onClick={() => setMobileOpen(false)}>Asistencia</Link>
              </li>
              <li className="pt-4 flex gap-6">
                <Link to="/account" onClick={() => setMobileOpen(false)} className="text-gray-900"><User size={24} /></Link>
                <Link to="/cart" onClick={() => setMobileOpen(false)} className="text-gray-900 relative">
                  <ShoppingCart size={24} />
                  {itemsCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                      {itemsCount}
                    </span>
                  )}
                </Link>
              </li>
            </ul>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
