import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { Product } from "../types";
import { useCartStore } from "../store/cartStore";
import { toast } from "react-toastify";
import { Star, StarHalf } from "lucide-react";
import type { Review } from "../types";

const StarRating = ({ rating }: { rating: number }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center text-yellow-400">
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} size={16} fill="currentColor" stroke="none" />
      ))}
      {hasHalfStar && <StarHalf size={16} fill="currentColor" stroke="none" />}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} size={16} className="text-gray-200" fill="currentColor" stroke="none" />
      ))}
    </div>
  );
};

interface Variation {
  id: number;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  stock_status: 'instock' | 'outofstock' | 'onbackorder';
  purchasable: boolean;
  attributes: { id: number; name: string; option: string }[];
  image?: { src: string };
}

const ProductPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [currentVariation, setCurrentVariation] = useState<Variation | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  
  const addItem = useCartStore((state) => state.addItem);
  const [zoomStyle, setZoomStyle] = useState({ display: 'none', backgroundPosition: '0% 0%', backgroundImage: '' });
  const imgContainerRef = useRef<HTMLDivElement>(null);

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    
    // Fetch producto, variaciones y reseñas en paralelo
    Promise.all([
      fetch(`${apiUrl}/wc/products/${id}`).then(res => res.json()),
      fetch(`${apiUrl}/wc/products/${id}/variations`).then(res => res.json()),
      fetch(`${apiUrl}/wc/products/${id}/reviews`).then(res => res.json())
    ]).then(([productData, vars, reviewsData]) => {
      setProduct(productData);
      setVariations(vars);
      setReviews(reviewsData);
      setLoading(false);
    }).catch(() => {
      setError(true);
      setLoading(false);
    });
  }, [id, apiUrl]);

  // Efecto para determinar la variación actual
  useEffect(() => {
    if (!product || product.type !== 'variable' || variations.length === 0) return;

    const match = variations.find(v => {
      return v.attributes.every(attr => {
        return selectedAttributes[attr.name] === attr.option;
      });
    });

    setCurrentVariation(match || null);

    if (match && match.image?.src) {
       const imgIndex = product.images.findIndex(img => img.src === match.image?.src);
       if (imgIndex !== -1) setSelectedImage(imgIndex);
    }

  }, [selectedAttributes, variations, product]);

  const handleAttributeSelect = (name: string, option: string) => {
    setSelectedAttributes(prev => ({ ...prev, [name]: option }));
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imgContainerRef.current) return;
    const { left, top, width, height } = imgContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    
    const currentImgSrc = product?.images[selectedImage]?.src;
    setZoomStyle({
      display: 'block',
      backgroundPosition: `${x}% ${y}%`,
      backgroundImage: `url(${currentImgSrc})`
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle(prev => ({ ...prev, display: 'none' }));
  };

  const handleAddToCart = () => {
    if (!product) return;

    if (product.type === 'variable') {
      if (!currentVariation) {
        toast.error("Por favor selecciona todas las opciones.");
        return;
      }
      
      if (currentVariation.stock_status === 'outofstock') {
        toast.error("Lo sentimos, esta combinación no tiene stock disponible.");
        return;
      }

      addItem({
        ...product,
        id: currentVariation.id,
        name: `${product.name} - ${Object.values(selectedAttributes).join(', ')}`,
        price: currentVariation.price,
        images: currentVariation.image ? [currentVariation.image] : product.images 
      }, 1, selectedAttributes);
    } else {
      if (product.stock_status === 'outofstock') {
        toast.error("Producto sin stock.");
        return;
      }
      addItem(product);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-white">
       <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (error || !product) return (
    <div className="text-center py-20 min-h-screen flex flex-col items-center justify-center">
      <h2 className="text-2xl font-bold mb-4 text-gray-900">Producto no disponible</h2>
      <button onClick={() => navigate('/')} className="text-blue-600 hover:underline font-bold uppercase text-xs tracking-widest">Volver al inicio</button>
    </div>
  );

  const displayPrice = currentVariation ? currentVariation.price : product.price;
  const displayRegularPrice = currentVariation ? currentVariation.regular_price : product.regular_price;
  const isOnSale = currentVariation ? currentVariation.on_sale : product.on_sale;
  
  // Determinamos si hay stock de la selección actual
  const isOutOfStock = product.type === 'variable' 
    ? (currentVariation && currentVariation.stock_status === 'outofstock')
    : product.stock_status === 'outofstock';

  return (
    <div className="bg-white min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          
          {/* GALERÍA */}
          <div className="space-y-6">
            <div 
              className="relative w-full aspect-square bg-gray-50 rounded-3xl overflow-hidden cursor-crosshair border border-gray-100 group"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              ref={imgContainerRef}
            >
              {product.images.length > 0 ? (
                 <img 
                   src={product.images[selectedImage]?.src} 
                   alt={product.name}
                   className="w-full h-full object-contain p-8 transition-transform duration-500 group-hover:scale-105"
                 />
              ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 font-bold uppercase tracking-widest">Sin imagen</div>
              )}
              <div 
                className="absolute inset-0 z-20 pointer-events-none bg-no-repeat"
                style={{
                  ...zoomStyle,
                  backgroundSize: '200%',
                  backgroundColor: 'white'
                }}
              />
            </div>

            {product.images.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {product.images.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(idx)}
                    className={`flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden border-2 transition-all p-2 bg-gray-50 ${selectedImage === idx ? 'border-blue-600 ring-2 ring-blue-100' : 'border-transparent hover:border-gray-200'}`}
                  >
                    <img src={img.src} alt={img.alt} className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* DETALLES */}
          <div className="flex flex-col pt-4">
             <nav className="text-[10px] font-bold text-gray-400 mb-6 uppercase tracking-widest flex items-center gap-2">
              <span className="cursor-pointer hover:text-blue-600 transition-colors" onClick={() => navigate('/')}>Inicio</span> 
              <span>/</span> 
              <span className="text-gray-900">{product.categories[0]?.name || 'Producto'}</span>
             </nav>

             <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 leading-tight tracking-tight">{product.name}</h1>
             
             {/* Resumen de Valoración */}
             <div className="flex items-center gap-3 mb-6">
                <StarRating rating={parseFloat(product.average_rating)} />
                <span className="text-sm font-bold text-gray-400">({product.rating_count} reseñas)</span>
             </div>
             
             <div className="flex flex-col mb-8">
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-black text-blue-600 tracking-tight">${displayPrice}</span>
                  {displayRegularPrice && displayRegularPrice !== displayPrice && (
                    <span className="text-xl text-gray-400 line-through font-bold">${displayRegularPrice}</span>
                  )}
                  {isOnSale && (
                    <span className="bg-red-50 text-red-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-100">Oferta</span>
                  )}
                </div>
                
                {/* Indicador de Stock */}
                {currentVariation || product.type !== 'variable' ? (
                  <div className={`mt-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest ${isOutOfStock ? 'text-red-500' : 'text-green-600'}`}>
                    <div className={`w-2 h-2 rounded-full ${isOutOfStock ? 'bg-red-500' : 'bg-green-600'}`}></div>
                    {isOutOfStock ? 'Agotado Temporalmente' : 'En Stock - Listo para enviar'}
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-gray-400 font-medium italic">Selecciona opciones para ver disponibilidad</div>
                )}
             </div>

             {/* VARIACIONES */}
             {product.type === 'variable' && product.attributes.map(attr => (
               <div key={attr.id} className="mb-6">
                 <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-3">{attr.name}: <span className="text-blue-600">{selectedAttributes[attr.name]}</span></h3>
                 <div className="flex flex-wrap gap-2">
                   {attr.options.map(option => (
                     <button
                       key={option}
                       onClick={() => handleAttributeSelect(attr.name, option)}
                       className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                         selectedAttributes[attr.name] === option 
                           ? 'border-blue-600 bg-blue-50 text-blue-700' 
                           : 'border-gray-200 text-gray-600 hover:border-gray-300'
                       }`}
                     >
                       {option}
                     </button>
                   ))}
                 </div>
               </div>
             ))}

             {/* Descripción Corta */}
             <div 
               className="text-gray-600 text-lg leading-relaxed mb-8 font-light"
               dangerouslySetInnerHTML={{ __html: product.short_description }} 
             />

             <div className="flex flex-col sm:flex-row gap-4 mb-12">
               <button
                  onClick={handleAddToCart}
                  disabled={(product.type === 'variable' && !currentVariation) || isOutOfStock}
                  className={`flex-1 font-bold py-5 px-8 rounded-2xl transition-all shadow-xl uppercase text-xs tracking-widest flex items-center justify-center gap-3 active:scale-95 ${
                    ((product.type === 'variable' && !currentVariation) || isOutOfStock)
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' 
                      : 'bg-gray-900 hover:bg-blue-600 text-white hover:shadow-blue-500/30'
                  }`}
               >
                 {product.type === 'variable' && !currentVariation 
                    ? 'Selecciona opciones' 
                    : isOutOfStock ? 'Agotado' : 'Añadir al Carrito'}
               </button>
             </div>

             <div className="mt-auto border-t border-gray-100 pt-8">
                <div className="flex items-center gap-6 text-xs font-bold text-gray-500 uppercase tracking-widest">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    Pago Seguro
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                    Cuotas sin Interés
                  </div>
                </div>
             </div>
          </div>
        </div>

        {/* DESCRIPCIÓN LARGA */}
        {product.description && (
          <div className="mt-24 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-8 pb-4 border-b border-gray-100 uppercase tracking-tight">Descripción Detallada</h3>
            <div 
              className="prose prose-lg prose-blue max-w-none text-gray-600 prose-headings:font-bold prose-img:rounded-3xl prose-img:shadow-lg"
              dangerouslySetInnerHTML={{ __html: product.description }} 
            />
          </div>
        )}

        {/* RESEÑAS */}
        <div className="mt-24 max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 pb-4 border-b border-gray-100 uppercase tracking-tight flex items-center gap-4">
            Reseñas del Producto
            <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs font-black">{reviews.length}</span>
          </h3>
          
          {reviews.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
              <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">Aún no hay reseñas para este producto</p>
            </div>
          ) : (
            <div className="space-y-10">
              {reviews.map((rev) => (
                <div key={rev.id} className="flex gap-6">
                  <div className="flex-shrink-0">
                    <img 
                      src={rev.reviewer_avatar_urls['96']} 
                      alt={rev.reviewer} 
                      className="w-14 h-14 rounded-2xl bg-gray-100 border border-gray-100" 
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap justify-between items-center mb-2">
                      <h4 className="font-bold text-gray-900">{rev.reviewer}</h4>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {new Date(rev.date_created).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="mb-3">
                      <StarRating rating={rev.rating} />
                    </div>
                    <div 
                      className="text-gray-600 leading-relaxed text-sm italic"
                      dangerouslySetInnerHTML={{ __html: rev.review }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductPage;
