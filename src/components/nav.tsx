import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, Search, MenuIcon, User } from "lucide-react";
import { useCategoriesStore } from "../store/categoriesStore";
import { useCartStore } from "../store/cartStore";
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
    { name: "Samsung", image: "https://via.placeholder.com/150" },
    { name: "Sony", image: "https://via.placeholder.com/150" },
  ],
  iphone: [
    { name: "Apple", image: "https://via.placeholder.com/150" },
    { name: "Beats", image: "https://via.placeholder.com/150" },
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
        <div className="flex flex-row md:mx-auto justify-between place-items-end py-4 px-4">
          {/* logo */}
          <div>
            <a href="/" className="flex items-center">
              <img
                src="/wp-content/uploads/2025/08/390a25d5-d704-4638-8371-7745f58f5b28.svg"
                alt="Logo"
                className="h-16 w-auto hidden md:block"
              />
              <img
                src="/wp-content/uploads/2025/08/390a25d5-d704-4638-8371-7745f58f5b28.svg"
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

                    {subCats.length > 0 && openDropdown === cat.slug && (
                      <>
                        {/* BACKDROP */}
                        <div
                          className="fixed inset-0 bg-gray-800/50"
                          onClick={() => setOpenDropdown(null)} // cerrar al hacer click afuera
                        ></div>

                        {/* MEGA MENÚ */}
                        {/* MEGA MENÚ */}
                        <div className="absolute left-0 right-0 mt-5 bg-transparent z-50">
                          <div className="max-w-10/12 mx-auto grid grid-cols-8 gap-2">
                            {/* COLUMNA DESTACADOS */}
                            <div className="col-span-2 bg-black text-white rounded-2xl shadow-sm shadow-gray-400 flex flex-col p-4">
                              <h3 className="text-left text-sm font-bold mb-2">
                                Destacados
                              </h3>
                              <ul className="text-md font-extralight space-y-3">
                                <li>test</li>
                                <li>test</li>
                                <li>test</li>
                                <li>test</li>
                                <li>test</li>
                              </ul>
                            </div>

                            {/* SECCIÓN PRINCIPAL: subcategorías */}
                            <div className="col-span-4 bg-white rounded-2xl shadow-sm shadow-gray-400 p-6">
                              <div className="grid grid-cols-4 gap-4 h-60">
                                {subCats.map((sub) => (
                                  <div
                                    key={sub.id}
                                    className="p-2 rounded-md bg-white"
                                  >
                                    <Link
                                      to={`/categoria/${sub.slug}`}
                                      className="block text-gray-700 transition font-medium hover:text-pink-600"
                                    >
                                      <div className="flex justify-center mt-2">
                                        {/* imagen si querés */}
                                      </div>
                                      <h3 className="text-center text-sm mt-2">
                                        {sub.name}
                                      </h3>
                                    </Link>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* SECCIÓN LATERAL */}
                            <div className="col-span-2 rounded-2xl shadow-sm shadow-gray-400 flex items-center justify-center relative">
                              <div
                                className="text-center text-gray-600 w-full h-full rounded-2xl"
                                style={{
                                  backgroundImage: `url(https://juleriaque.vtexassets.com/unsafe/320x0/center/middle/https%3A%2F%2Fjuleriaque.vtexassets.com/assets%2Fvtex.file-manager-graphql%2Fimages%2F7bf082ec-8df4-4d82-968e-2c54ba0015f3___ade26d23b93570dce56c18683706fe9b.jpg)`,
                                  backgroundSize: "cover",
                                  backgroundPosition: "center",
                                  backgroundRepeat: "no-repeat",
                                }}
                              ></div>
                            </div>

                            {/* SECCIÓN LATERAL */}
                            <div className="col-span-2 rounded-2xl shadow-sm shadow-gray-400 flex items-center justify-center relative z-50">
                              <div
                                className="text-center text-gray-600 w-full h-full rounded-2xl "
                                style={{
                                  backgroundImage: `url(https://juleriaque.vtexassets.com/unsafe/320x0/center/middle/https%3A%2F%2Fjuleriaque.vtexassets.com%2Fassets%2Fvtex.file-manager-graphql%2Fimages%2F7bf082ec-8df4-4d82-968e-2c54ba0015f3___ade26d23b93570dce56c18683706fe9b.jpg)`,
                                  backgroundSize: "cover",
                                  backgroundPosition: "center",
                                  backgroundRepeat: "no-repeat",
                                }}
                              ></div>
                            </div>
                          </div>

                          {/* SECCIÓN EXTRA (ejemplo: marcas) */}
                          <div className="max-w-10/12 bg-white rounded-2xl p-4 shadow-sm shadow-gray-400 m-auto grid grid-cols-8 gap-2 relative z-50">
                            <div className="flex items-center">
                              <h3 className="text-4xl font-sans font-extrabold">
                                Marcas
                              </h3>
                            </div>
                            {BRANDS[cat.slug]?.map((brand, idx) => (
                              <div
                                key={idx}
                                className="flex flex-col items-center"
                              >
                                <img
                                  src={brand.image}
                                  alt={brand.name}
                                  className="h-full w-full rounded-md object-cover"
                                />
                                <span className="text-xs mt-1">
                                  {brand.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
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
