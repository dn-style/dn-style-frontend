import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import type { Product, Review } from "../types";
import { useCartStore } from "../store/cartStore";
import { toast } from "react-toastify";
import { Star, StarHalf } from "lucide-react";
import SEO from "./SEO";

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

const StarRating = ({ rating }: { rating: number }) => {
  // Asegurar que rating sea un número válido entre 0 y 5
  const safeRating = isNaN(rating) ? 0 : Math.min(5, Math.max(0, rating));
  const fullStars = Math.floor(safeRating);
  const hasHalfStar = safeRating % 1 >= 0.5;
  const emptyStars = Math.max(0, 5 - fullStars - (hasHalfStar ? 1 : 0));

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

  const apiUrl = import.meta.env.VITE_API_URL || "";

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    console.log(`[ProductPage] 🛠️ Cargando producto ${id}...`);
    
    // Cargamos el producto individualmente primero para garantizar que se vea algo cuanto antes
    fetch(`${apiUrl}/wc/products/${id}`)
      .then(res => res.ok ? res.json() : Promise.reject("Error en API"))
      .then(data => {
        if (!data || data.error || !data.id) throw new Error("Producto inválido");
        setProduct(data);
        setError(false);
        
        // Una vez tenemos el producto, cargamos lo demás en segundo plano sin bloquear si fallan
        fetch(`${apiUrl}/wc/products/${id}/variations`).then(r => r.json()).then(v => setVariations(Array.isArray(v) ? v : [])).catch(() => {});
        fetch(`${apiUrl}/wc/products/${id}/reviews`).then(r => r.json()).then(r => setReviews(Array.isArray(r) ? r : [])).catch(() => {});
        
        setLoading(false);
      })
      .catch(err => {
        console.error("[ProductPage] ❌ Fallo crítico:", err);
        setError(true);
        setLoading(false);
      });
  }, [id, apiUrl]);

  useEffect(() => {
    if (!product || product.type !== 'variable' || variations.length === 0) return;
    
    const match = variations.find(v => {
      return v.attributes.every(vAttr => {
        // Buscamos en el estado del usuario una llave que coincida (ignorando mayúsculas)
        const userSelectedOption = Object.entries(selectedAttributes).find(
          ([name]) => name.toLowerCase() === vAttr.name.toLowerCase()
        )?.[1];
        return userSelectedOption === vAttr.option;
      });
    });

    setCurrentVariation(match || null);
    
    if (match && match.image?.src) {
       console.log("[ProductPage] 📸 Cambio de imagen detectado por variación:", match.image.src);
       const imgIndex = product.images.findIndex(img => img.src === match.image?.src);
       if (imgIndex !== -1) {
         setSelectedImage(imgIndex);
       } else {
         // Si la imagen de la variación no está en la galería principal, la forzamos temporalmente
         // aunque lo ideal es que esté en la galería.
         setZoomStyle(prev => ({ ...prev, backgroundImage: `url(${match.image?.src})` }));
       }
    }
  }, [selectedAttributes, variations, product]);

  const handleAttributeSelect = (name: string, option: string) => {
    setSelectedAttributes(prev => ({ ...prev, [name]: option }));
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imgContainerRef.current || !product?.images[selectedImage]) return;
    const { left, top, width, height } = imgContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      display: 'block',
      backgroundPosition: `${x}% ${y}%`,
      backgroundImage: `url(${product.images[selectedImage].src})`
    });
  };

  const handleMouseLeave = () => setZoomStyle(prev => ({ ...prev, display: 'none' }));

  const handleAddToCart = () => {
    if (!product) return;
    if (product.type === 'variable') {
      if (!currentVariation) return toast.error("Selecciona opciones");
      if (currentVariation.stock_status === 'outofstock') return toast.error("Sin stock");
      addItem({
        ...product,
        id: currentVariation.id,
        name: `${product.name} - ${Object.values(selectedAttributes).join(', ')}`,
        price: currentVariation.price,
        images: currentVariation.image ? [currentVariation.image] : product.images 
      }, 1, selectedAttributes);
    } else {
      if (product.stock_status === 'outofstock') return toast.error("Sin stock");
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
      <p className="text-gray-500 mb-8">No pudimos encontrar la información del producto solicitado.</p>
      <button onClick={() => navigate('/')} className="px-8 py-3 bg-gray-900 text-white font-bold rounded-xl uppercase text-xs tracking-widest hover:bg-blue-600 transition-colors">Volver al inicio</button>
    </div>
  );

  const displayPrice = currentVariation ? currentVariation.price : product.price;
  const displayRegularPrice = currentVariation ? currentVariation.regular_price : product.regular_price;
  const isOnSale = currentVariation ? currentVariation.on_sale : product.on_sale;
  const isOutOfStock = product.type === 'variable' 
    ? (currentVariation && currentVariation.stock_status === 'outofstock')
    : product.stock_status === 'outofstock';

  console.log("[ProductPage] ✨ Renderizando producto:", product.name);

  return (
    <div className="bg-white min-h-screen pb-20">
      <SEO 
        title={product.name}
        description={(product.short_description || "").replace(/<[^>]*>?/gm, '').substring(0, 160)}
        ogType="product"
        ogImage={product.images?.[0]?.src}
      />
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
              {product.images?.length > 0 ? (
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
                style={{ ...zoomStyle, backgroundSize: '200%', backgroundColor: 'white' }}
              />
            </div>

            {product.images?.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {product.images.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden border-2 transition-all p-2 bg-gray-50 ${selectedImage === idx ? 'border-blue-600 ring-2 ring-blue-100' : 'border-transparent hover:border-gray-200'}`}
                  >
                    <img src={img.src} alt={img.alt || product.name} className="w-full h-full object-contain" />
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
              <span className="text-gray-900">{product.categories?.[0]?.name || 'Producto'}</span>
             </nav>

             <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 leading-tight tracking-tight">{product.name}</h1>
             
             <div className="flex items-center gap-3 mb-6">
                <StarRating rating={parseFloat(product.average_rating || "0")} />
                <span className="text-sm font-bold text-gray-400">({reviews.length} reseñas)</span>
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
             {product.type === 'variable' && product.attributes?.map(attr => (
               <div key={attr.id || attr.name} className="mb-6">
                 <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-3">{attr.name}: <span className="text-blue-600">{selectedAttributes[attr.name]}</span></h3>
                 <div className="flex flex-wrap gap-2">
                   {attr.options?.map(option => (
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

             <div className="text-gray-600 text-lg leading-relaxed mb-8 font-light" dangerouslySetInnerHTML={{ __html: product.short_description || '' }} />

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
          </div>
        </div>

        {product.description && (
          <div className="mt-24 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-8 pb-4 border-b border-gray-100 uppercase tracking-tight">Descripción Detallada</h3>
            <div className="prose prose-lg prose-blue max-w-none text-gray-600" dangerouslySetInnerHTML={{ __html: product.description }} />
          </div>
        )}

        {/* RESEÑAS */}
        <div className="mt-24 max-w-7xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 pb-4 border-b border-gray-100 uppercase tracking-tight flex items-center gap-4">
            Reseñas del Producto
            <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs font-black">{reviews.length}</span>
          </h3>
          
          {reviews.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
              <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">Aún no hay reseñas</p>
            </div>
          ) : (
            <div className="px-4">
              <Slider dots infinite={false} speed={500} slidesToShow={Math.min(reviews.length, 3)} slidesToScroll={1}>
                {reviews.map((rev) => (
                  <div key={rev.id} className="px-2 pb-8">
                    <div className="bg-gray-50 rounded-[2rem] p-8 border border-gray-100 h-full min-h-[250px] flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-4 mb-6">
                          <img src={rev.reviewer_avatar_urls?.['96'] || ''} alt={rev.reviewer} className="w-12 h-12 rounded-full border-2 border-white shadow-sm" />
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm uppercase tracking-tight">{rev.reviewer}</h4>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{new Date(rev.date_created).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="mb-4"><StarRating rating={rev.rating} /></div>
                        <div className="text-gray-600 text-sm font-medium italic line-clamp-4" dangerouslySetInnerHTML={{ __html: rev.review }} />
                      </div>
                    </div>
                  </div>
                ))}
              </Slider>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductPage;