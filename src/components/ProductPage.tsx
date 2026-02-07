import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { Product } from "../types";
import { useCartStore } from "../store/cartStore";
import Slider from "react-slick";

const ProductPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";
    fetch(`${apiUrl}/wc/products/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Producto no encontrado");
        return res.json();
      })
      .then((data) => {
        setProduct(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
       <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (error || !product) return (
    <div className="text-center py-20">
      <h2 className="text-2xl font-bold mb-4">Producto no encontrado</h2>
      <button onClick={() => navigate('/')} className="text-blue-600 hover:underline">Volver al inicio</button>
    </div>
  );

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false, 
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Galería de Imágenes */}
        <div className="space-y-4">
          <div className="aspect-[4/3] w-full bg-gray-100 rounded-2xl overflow-hidden flex items-center justify-center border border-gray-200">
            {product.images.length > 0 ? (
               <img 
                 src={product.images[selectedImage]?.src} 
                 alt={product.images[selectedImage]?.alt || product.name}
                 className="w-full h-full object-contain"
               />
            ) : (
                <span className="text-gray-400">Sin imagen</span>
            )}
          </div>
          {/* Miniaturas */}
          <div className="flex gap-4 overflow-x-auto pb-2">
            {product.images.map((img, idx) => (
              <button
                key={img.id}
                onClick={() => setSelectedImage(idx)}
                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${selectedImage === idx ? 'border-blue-600 ring-2 ring-blue-100' : 'border-transparent hover:border-gray-300'}`}
              >
                <img src={img.src} alt={img.alt} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Info del Producto */}
        <div className="flex flex-col">
           <nav className="text-sm text-gray-500 mb-4">
            <span className="cursor-pointer hover:text-blue-600" onClick={() => navigate('/')}>Inicio</span> &gt; <span>{product.categories[0]?.name || 'Producto'}</span>
           </nav>

           <h1 className="text-3xl md:text-4xl font-bold text-gray-900  mb-2">{product.name}</h1>
           
           <div className="flex items-center gap-4 mb-6">
              <span className="text-2xl font-bold text-blue-600">${product.price}</span>
              {product.regular_price && product.regular_price !== product.price && (
                <span className="text-lg text-gray-400 line-through">${product.regular_price}</span>
              )}
              {product.on_sale && (
                 <span className="bg-red-100 text-red-600 px-2 py-1 rounded-md text-sm font-semibold">Oferta</span>
              )}
           </div>

           <div 
             className="prose  text-gray-600  mb-8 max-w-none"
             dangerouslySetInnerHTML={{ __html: product.description }} 
           />

           <div className="mt-auto pt-6 border-t border-gray-100 ">
             <button
                onClick={() => addItem(product)}
                className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg hover:shadow-blue-500/30 flex items-center justify-center gap-2"
             >
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
               </svg>
               Añadir al Carrito
             </button>
             <p className="mt-4 text-sm text-gray-500 flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Envío seguro garantizado
             </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;
