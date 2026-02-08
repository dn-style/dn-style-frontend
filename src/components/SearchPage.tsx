import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, Package, ArrowRight } from "lucide-react";
import type { Product } from "../types";

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const apiUrl = import.meta.env.VITE_API_URL || "";

  useEffect(() => {
    if (!query) return;
    
    setLoading(true);
    fetch(`${apiUrl}/wc/products?search=${encodeURIComponent(query)}&per_page=100`)
      .then(async res => {
        const totalHeader = res.headers.get("X-WP-Total");
        if (totalHeader) setTotal(parseInt(totalHeader));
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) setProducts(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [query, apiUrl]);

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8 text-gray-900">
      <div className="max-w-7xl mx-auto">
        
        {/* Header de Búsqueda */}
        <div className="mb-12 border-b border-gray-100 pb-12">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">Resultados de búsqueda</p>
          <div className="flex items-center gap-4">
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight italic">
              "{query}"
            </h1>
            {!loading && (
              <span className="bg-gray-100 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-500 mt-2">
                {total} encontrados
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-24">
            <Search size={64} className="mx-auto text-gray-100 mb-6" />
            <h2 className="text-2xl font-bold mb-4">No encontramos lo que buscas</h2>
            <p className="text-gray-500 mb-8">Intenta con otros términos o explora nuestras categorías.</p>
            <Link to="/" className="inline-flex items-center gap-2 bg-black text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">
              Volver al Inicio <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <Link to={`/producto/${product.id}`} key={product.id} className="group">
                <div className="flex flex-col h-full bg-white border border-gray-100 rounded-[2.5rem] p-6 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                  <div className="aspect-[4/5] bg-gray-50 rounded-3xl overflow-hidden mb-6 flex items-center justify-center p-8 relative">
                    <img 
                      src={product.images?.[0]?.src || "/placeholder.png"} 
                      alt={product.name} 
                      className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110" 
                    />
                    {product.on_sale && (
                      <span className="absolute top-4 left-4 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">Sale</span>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-black text-lg text-gray-900 leading-tight mb-2 uppercase tracking-tighter group-hover:text-blue-600 transition-colors line-clamp-2">
                        {product.name}
                      </h3>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4" dangerouslySetInnerHTML={{ __html: product.short_description || "" }} />
                    </div>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-2xl font-black tracking-tighter">${product.price}</span>
                      <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                        <ArrowRight size={18} />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
