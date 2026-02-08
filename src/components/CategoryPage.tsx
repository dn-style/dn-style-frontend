import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import InfiniteScroll from "react-infinite-scroll-component";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useCategoriesStore } from "../store/categoriesStore";
import SEO from "./SEO";

export interface Product {
  id: number;
  name: string;
  images: { src: string }[];
  price?: string | number;
  short_description?: string;
  attributes?: { id: number; name: string; slug: string; options: string[] }[];
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  parent?: number;
}

export interface Attribute {
  id: number;
  name: string;
  slug: string;
  options: string[];
}

const PAGE_SIZE = 12;

const CategoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const { categories } = useCategoriesStore();

  const currentCategory = slug ? categories.find((c) => c.slug === slug) : undefined;
  const mainCategoryId = currentCategory?.parent || currentCategory?.id;
  const mainCategory = categories.find((c) => c.id === mainCategoryId);
  const subCategories = categories.filter((c) => c.parent === mainCategoryId);

  const [selectedSubCat, setSelectedSubCat] = useState<number | null>(
    currentCategory?.parent ? currentCategory.id : null
  );

  const [totalProducts, setTotalProducts] = useState<number | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";

  // --- FETCH DE PRODUCTOS CON CACHÉ (React Query) ---
  const fetchProducts = async ({ pageParam = 1 }) => {
    const categoryParam = selectedSubCat || mainCategoryId;
    if (!categoryParam) return { products: [], nextPage: null };

    const params: Record<string, string> = {
      per_page: PAGE_SIZE.toString(),
      page: pageParam.toString(),
      category: categoryParam.toString(),
      attributes: JSON.stringify(selectedAttributes),
    };

    const url = `${apiUrl}/wc/products?${new URLSearchParams(params)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Error cargando productos");
    
    // Leemos el total de las cabeceras
    const total = res.headers.get('X-WP-Total');
    if (total) setTotalProducts(parseInt(total));

    const data = await res.json();

    return {
      products: data as Product[],
      nextPage: data.length === PAGE_SIZE ? pageParam + 1 : null,
    };
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ["products", selectedSubCat || mainCategoryId, selectedAttributes],
    queryFn: fetchProducts,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 1000 * 60 * 5, 
  });

  const allProducts = data?.pages.flatMap((page) => page.products) || [];

  // Resetear el conteo cuando cambian los filtros principales para evitar mostrar el valor anterior
  useEffect(() => {
    setTotalProducts(null);
  }, [selectedSubCat, mainCategoryId, selectedAttributes]);

  // Fetch de atributos (podemos dejarlo local ya que es ligero)
  useEffect(() => {
    if (!mainCategoryId) return;
    const fetchAttributesForCategory = async (categoryId: number) => {
      const res = await fetch(`${apiUrl}/wc/products?category=${categoryId}&per_page=50`);
      if (!res.ok) return [];
      const products: Product[] = await res.json();
      const attrsMap: Record<string, { name: string; options: Set<string> }> = {};

      products.forEach((p) => {
        p.attributes?.forEach((attr) => {
          if (!attrsMap[attr.slug]) attrsMap[attr.slug] = { name: attr.name, options: new Set() };
          (attr.options || []).forEach((o) => attrsMap[attr.slug].options.add(o));
        });
      });

      return Object.entries(attrsMap).map(([slug, { name, options }]) => ({
        id: 0, slug, name, options: Array.from(options),
      }));
    };

    fetchAttributesForCategory(selectedSubCat || mainCategoryId).then(setAttributes);
  }, [mainCategoryId, selectedSubCat, apiUrl]);

  const toggleAttribute = (attrSlug: string, option: string) => {
    setSelectedAttributes((prev) => {
      const current = prev[attrSlug];
      if (current === option) {
        const copy = { ...prev };
        delete copy[attrSlug];
        return copy;
      }
      return { ...prev, [attrSlug]: option };
    });
  };

  const selectCategory = (cat: Category | null) => {
    if (!cat) {
      setSelectedSubCat(null);
      navigate(`/categoria/${mainCategory?.slug}`);
    } else {
      setSelectedSubCat(cat.id);
      navigate(`/categoria/${cat.slug}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 text-gray-900">
      <SEO 
        title={currentCategory?.name}
        description={`Explora nuestra colección de ${currentCategory?.name}. Los mejores productos con envío a todo el país.`}
      />
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar */}
        <aside className={`
          fixed top-0 left-0 h-full w-72 bg-white z-40 p-6 overflow-y-auto shadow-2xl transition-transform duration-300 md:shadow-none
          ${showSidebar ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0 md:w-1/4
        `}>
          <div className="mb-8">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Categorías</h3>
            <div className="flex flex-col gap-2">
              <button onClick={() => selectCategory(null)} className={`text-left px-4 py-2 rounded-xl text-sm font-bold transition-all ${selectedSubCat === null ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "bg-gray-50 text-gray-600 hover:bg-gray-100"}`}>
                Todo en {mainCategory?.name}
              </button>
              {subCategories.map((sub) => (
                <button key={sub.id} onClick={() => selectCategory(sub)} className={`text-left px-4 py-2 rounded-xl text-sm font-bold transition-all ${selectedSubCat === sub.id ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "bg-gray-50 text-gray-600 hover:bg-gray-100"}`}>
                  {sub.name}
                </button>
              ))}
            </div>
          </div>

          {attributes.map((attr) => (
            <div key={attr.slug} className="mb-8 border-t border-gray-100 pt-6">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">{attr.name}</h3>
              <div className="flex flex-wrap gap-2">
                {attr.options.map((option) => (
                  <button key={option} onClick={() => toggleAttribute(attr.slug, option)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${selectedAttributes[attr.slug] === option ? "border-blue-600 bg-blue-50 text-blue-600" : "border-gray-100 text-gray-500 hover:border-gray-200"}`}>
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </aside>

        {/* Product Grid */}
        <main className="flex-1">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tight">{currentCategory?.name}</h1>
              {totalProducts !== null && (
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                  {totalProducts} {totalProducts === 1 ? 'producto encontrado' : 'productos encontrados'}
                </p>
              )}
            </div>
            <button onClick={() => setShowSidebar(!showSidebar)} className="md:hidden bg-gray-900 text-white px-6 py-2 rounded-full font-bold text-xs uppercase tracking-widest w-fit">Filtros</button>
          </div>

          {isLoading && allProducts.length === 0 ? (
            <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>
          ) : (
            <InfiniteScroll
              dataLength={allProducts.length}
              next={fetchNextPage}
              hasMore={!!hasNextPage}
              loader={<div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>}
              endMessage={<p className="text-center py-10 text-xs font-bold text-gray-300 uppercase tracking-widest">Has llegado al final</p>}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {allProducts.map((product) => (
                  <Link to={`/producto/${product.id}`} key={product.id} className="group">
                    <div className="bg-white border border-gray-100 rounded-[2rem] p-4 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                      <div className="relative aspect-[4/5] bg-gray-50 rounded-3xl overflow-hidden mb-4 flex items-center justify-center p-6">
                        <img src={product.images?.[0]?.src || "/placeholder.png"} alt={product.name} className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110" />
                        {product.price && (
                          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-sm font-black text-blue-600">${product.price}</div>
                        )}
                      </div>
                      <h2 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors truncate">{product.name}</h2>
                      <div className="text-xs text-gray-400 font-medium line-clamp-2" dangerouslySetInnerHTML={{ __html: product.short_description || "" }}></div>
                    </div>
                  </Link>
                ))}
              </div>
            </InfiniteScroll>
          )}
        </main>
      </div>
      
      {/* Overlay para móvil */}
      {showSidebar && <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setShowSidebar(false)}></div>}
    </div>
  );
};

export default CategoryPage;