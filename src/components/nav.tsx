import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, Search } from "lucide-react";
import { useCategoriesStore } from "../store/categoriesStore";

interface Category {
  id: number;
  name: string;
  slug: string;
  parent: number;
  link: string;
}
const fetchCategories = async (): Promise<Category[]> => {
  const res = await fetch(
    "http://dn-style.com.ar:8080/wp-json/wp/v2/product_cat"
  );
  if (!res.ok) throw new Error("Error fetching categories");
  return res.json();
};

const Header: React.FC = () => {
  const setCategoriesStore = useCategoriesStore((state) => state.setCategories);
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
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí podrías redirigir a la búsqueda o filtrar productos
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
        <div className="flex flex-row mx-auto justify-between items-center py-4 px-4">
          {/* logo */}
          <a href="/" className="flex items-center">
            <img
              src="http://dn-style.com.ar:8080/wp-content/uploads/2025/08/390a25d5-d704-4638-8371-7745f58f5b28.svg"
              alt="Logo"
              className="h-16 w-auto hidden md:block"
            />
            <img
              src="/wp-content/uploads/2018/01/Haikmaro_logo_moblie.png"
              alt="Logo Mobile"
              className="h-8 w-auto md:hidden"
            />
          </a>

          {/* mobile menu button */}
          <button
            className="md:hidden text-gray-800"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            ☰
          </button>
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
                    className="relative"
                    onMouseEnter={() => handleMouseEnter(cat.slug)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <Link
                      to={`/categoria/${cat.slug}`}
                      className="hover:text-pink-600 cursor-pointer"
                    >
                      {cat.name.toUpperCase()}
                    </Link>

                    {subCats.length > 0 && openDropdown === cat.slug && (
                      <ul className="absolute left-0 top-full mt-1 bg-white shadow-lg z-50 min-w-[200px]">
                        {subCats.map((sub) => (
                          <li key={sub.id}>
                            <Link
                              to={`/categoria/${sub.slug}`}
                              className="block px-4 py-2 hover:bg-gray-100"
                            >
                              {sub.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
              <li>
                <Link to="/contacto/" className="hover:text-pink-600">
                  CONTACTO
                </Link>
              </li>
              <li>
                <Link to="/carro/" className=" text-black hover:text-pink-600">
                  <ShoppingCart size={16} />
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
                  <button type="submit" className="bg-pink-200 px-3 py-1.5  hover:bg-pink-300 transition-colors duration-200 rounded-r-full">
                    <Search size={16} />
                  </button>
                </form>
              </li>
            </ul>
          )}
        </nav>

        {/* mobile nav */}
        {mobileOpen && (
          <div className="md:hidden bg-white border-t shadow-md px-4 py-2">
            <ul className="flex flex-col space-y-2">
              <li>
                <a href="/" className="hover:text-pink-600">
                  INICIO
                </a>
              </li>
              {topCategories.map((cat) => (
                <li key={cat.id}>
                  <a
                    href={`categorias/${cat.link}`}
                    className="hover:text-pink-600"
                  >
                    {cat.name}
                  </a>
                </li>
              ))}
              <li>
                <a href="/contacto/" className="hover:text-pink-600">
                  CONTACTO
                </a>
              </li>
              <li>
                <a href="/carro/" className=" text-black hover:text-pink-600">
                  <ShoppingCart size={16} />
                </a>
              </li>
            </ul>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
