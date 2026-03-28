import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SEO from "./SEO";
import { ShoppingCart, Gift, ShieldCheck, ArrowRight } from "lucide-react";
import { PriceDisplay } from "../utils/priceUtils";

const PromoLandingPage: React.FC = () => {
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL || "";
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // ID del producto Airpods Pro 2 (Hardcoded para esta landing especfica)
  const AIRPODS_ID = "493"; 

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`${apiUrl}/wc/products/${AIRPODS_ID}`);
        const data = await res.json();
        if (data && data.id) {
          setProduct(data);
        }
      } catch (error) {
        console.error("Error fetching promo product:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [apiUrl, AIRPODS_ID]);

  const handleAddToCart = () => {
    navigate(`/producto/${AIRPODS_ID}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen overflow-x-hidden">
      <SEO 
        title="Promo AirPods Pro 2 + Sorteo iPhone 15"
        description="Compra tus AirPods Pro 2 y participa automticamente por un iPhone 15 sellado. Solo en DN shop!"
      />

      {/* Hero Section Landing */}
      <section className="relative w-full h-[70vh] md:h-[80vh] bg-black flex items-center overflow-hidden">
        <div className="absolute inset-0 opacity-60">
          <img 
            src={`${apiUrl}/wp-content/uploads/2026/03/3_50.png`} 
            alt="Promo AirPods" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 w-full">
          <div className="max-w-2xl">
            <span className="inline-block bg-red-600 text-white text-[10px] md:text-xs font-black uppercase tracking-[0.3em] px-4 py-2 rounded-full mb-6 animate-pulse">
              Evento Exclusivo DN shop
            </span>
            <h1 className="text-4xl md:text-7xl font-black text-white leading-none mb-6 uppercase tracking-tighter">
              Tus AirPods <br /> 
              <span className="text-gray-400">te traen un</span> <br />
              iPhone 15
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-10 font-medium max-w-lg">
              </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={handleAddToCart}
                className="bg-white text-black px-10 py-5 rounded-full font-black uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center justify-center gap-3 shadow-2xl"
              >
                Quiero participar <ArrowRight size={20} />
              </button>
              <Link 
                to="/cart"
                className="bg-transparent border-2 border-white/30 text-white px-10 py-5 rounded-full font-black uppercase tracking-widest hover:bg-white/10 transition-all text-center"
              >
                Ver mi carrito
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Rules Section */}
      <section className="py-20 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-center">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 border border-gray-100">
                <Gift className="text-red-600" size={32} />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tighter mb-4">Sorteo Transparente</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                El sorteo se realizar en vivo a travs de nuestro Instagram oficial en vivo y en nuestras oficinas cuando se agoten las 1000 unidades de la promocin.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 border border-gray-100">
                <ShieldCheck className="text-blue-600" size={32} />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tighter mb-4">Garanta Oficial</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Todos nuestros productos son 100% originales con garanta oficial Apple y soporte tcnico local en Brandsen.
              </p>
            </div>
            {/* <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 border border-gray-100">
                <Truck className="text-green-600" size={32} />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tighter mb-4">Envío Inmediato</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Despachamos tus AirPods en menos de 24hs hábiles. Envío gratis a todo el país para esta promoción.
              </p> 
            </div> */}
          </div>
        </div>
      </section>

      {/* Product Detail CTA */}
      <section className="py-24 max-w-5xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1 order-2 md:order-1">
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-6 leading-tight">
              Los mejores auriculares del mundo.
            </h2>
            <div className="space-y-6 mb-10">
              <p className="text-gray-600">
                Cancelacin activa de ruido el doble de potente. Audio espacial personalizado para una experiencia inmersiva. Y ahora, con estuche de carga USB-C.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-sm font-bold uppercase tracking-wide">
                  <div className="w-1.5 h-1.5 bg-black rounded-full"></div> Cancelacin de ruido pro
                </li>
                <li className="flex items-center gap-3 text-sm font-bold uppercase tracking-wide">
                  <div className="w-1.5 h-1.5 bg-black rounded-full"></div> Hasta 30 horas de batera
                </li>
                <li className="flex items-center gap-3 text-sm font-bold uppercase tracking-wide">
                  <div className="w-1.5 h-1.5 bg-black rounded-full"></div> Resistentes al agua y sudor
                </li>
                <li className="flex items-center gap-3 text-sm font-bold uppercase tracking-wide">
                  <div className="w-1.5 h-1.5 bg-black rounded-full"></div> Versin alternativa calidad premium
                </li>
              </ul>
            </div>
            <div className="bg-black p-8 rounded-[40px] text-white flex justify-between items-center shadow-2xl transform hover:scale-[1.02] transition-transform cursor-pointer" onClick={handleAddToCart}>
               <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 block mb-1">Precio Promocional</span>
                  {product ? (
                    <PriceDisplay 
                      price={product.price} 
                      categories={product.categories} 
                      usdClassName="text-3xl font-black text-white"
                      arsClassName="text-xs font-bold text-gray-400 mt-1"
                    />
                  ) : (
                    <span className="text-3xl font-black">$30.000</span>
                  )}
               </div>
               <button className="bg-white text-black w-14 h-14 rounded-full flex items-center justify-center">
                  <ShoppingCart size={24} />
               </button>
            </div>
          </div>
          <div className="flex-1 order-1 md:order-2 relative">
             <div className="absolute -inset-4 bg-gray-100 rounded-full blur-3xl opacity-50"></div>
             <img 
               src={product?.images?.[0]?.src || `${apiUrl}/wp-content/uploads/2026/03/3_50.png`} 
               alt="AirPods Pro 2" 
               className="relative z-10 w-full h-auto drop-shadow-2xl"
             />
          </div>
        </div>
      </section>

      {/* FAQ Mini */}
      <section className="py-20 bg-black text-white">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-black uppercase tracking-tighter mb-12">Preguntas Frecuentes</h2>
          <div className="space-y-8 text-left">
            <div className="border-b border-white/10 pb-6">
              <h4 className="font-bold mb-2 uppercase tracking-wide">Cmo participo?</h4>
              <p className="text-gray-400 text-sm">Al comprar tus AirPods, el sistema genera un número de orden. Ese número es tu cupón para el sorteo del iPhone 15.</p>
            </div>
            <div className="border-b border-white/10 pb-6">
              <h4 className="font-bold mb-2 uppercase tracking-wide">Cundo es el sorteo?</h4>
              <p className="text-gray-400 text-sm">El sorteo se realiza ante escribano pblico cuando se completa el cupo de 100 ventas de la promocin.</p>
            </div>
            <div className="pb-6">
              <h4 className="font-bold mb-2 uppercase tracking-wide">El iPhone 15 es nuevo?</h4>
              <p className="text-gray-400 text-sm">S, entregamos un iPhone 15 de 128GB nuevo, en caja sellada con garanta Apple de 1 ao.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PromoLandingPage;