import React from "react";
import { Link } from "react-router-dom";
import { CheckCircle, Package, User, ShoppingBag, Home, ArrowRight } from "lucide-react";

const ThankYouPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-20 px-4">
      <div className="max-w-4xl mx-auto text-center">
        
        {/* Encabezado */}
        <div className="mb-12 animate-in fade-in zoom-in duration-700">
          <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-green-100">
            <CheckCircle size={48} />
          </div>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-slate-900 mb-4">
            ¡Gracias por tu compra!
          </h1>
          <p className="text-lg text-gray-500 font-medium">
            Hemos recibido tu pedido correctamente. Te enviamos un email con los detalles.
          </p>
        </div>

        {/* Bento Grid de Opciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Tarjeta: Mis Pedidos */}
          <Link 
            to="/account" 
            className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col justify-between group hover:shadow-xl transition-all hover:-translate-y-1"
          >
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
              <Package size={24} />
            </div>
            <div className="text-left">
              <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 mb-2">Mis Pedidos</h3>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                Seguimiento en tiempo real <ArrowRight size={14} />
              </p>
            </div>
          </Link>

          {/* Tarjeta: Seguir Comprando */}
          <Link 
            to="/" 
            className="bg-black p-8 rounded-[2.5rem] shadow-2xl flex flex-col justify-between group hover:scale-[1.02] transition-all md:col-span-1 lg:col-span-1"
          >
            <div className="w-12 h-12 bg-white/10 text-white rounded-2xl flex items-center justify-center mb-6">
              <ShoppingBag size={24} />
            </div>
            <div className="text-left text-white">
              <h3 className="text-xl font-black uppercase tracking-tight mb-2">Más Productos</h3>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
                Explora nuevas tendencias <ArrowRight size={14} />
              </p>
            </div>
          </Link>

          {/* Tarjeta: Soporte/Ayuda */}
          <Link 
            to="/support" 
            className="bg-blue-600 p-8 rounded-[2.5rem] shadow-lg flex flex-col justify-between group hover:shadow-blue-200 transition-all md:col-span-2 lg:col-span-1"
          >
            <div className="w-12 h-12 bg-white/20 text-white rounded-2xl flex items-center justify-center mb-6">
              <Home size={24} />
            </div>
            <div className="text-left text-white">
              <h3 className="text-xl font-black uppercase tracking-tight mb-2">Asistencia</h3>
              <p className="text-xs text-blue-100 font-bold uppercase tracking-widest flex items-center gap-2">
                ¿Tienes alguna duda? <ArrowRight size={14} />
              </p>
            </div>
          </Link>

        </div>

        {/* Botón secundario */}
        <div className="mt-12">
          <Link to="/" className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-black transition-colors">
            Volver a la Página Principal
          </Link>
        </div>

      </div>
    </div>
  );
};

export default ThankYouPage;
