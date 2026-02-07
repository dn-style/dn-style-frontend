import React, { useState } from "react";

const TrackingPage = () => {
  const [orderId, setOrderId] = useState("");

  return (
    <div className="bg-white min-h-screen py-16 px-4">
      <div className="max-w-xl mx-auto text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Seguimiento de Pedido</h1>
        <p className="text-gray-500 mb-8">Ingresa el número de tu orden para conocer su estado actual.</p>
        
        <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 shadow-sm">
          <input 
            type="text" 
            placeholder="Ej: #12345" 
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            className="w-full mb-4 px-4 py-3 rounded-xl border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-md">
            Buscar Pedido
          </button>
        </div>
        
        <div className="mt-8 text-sm text-gray-400">
          ¿No encuentras tu número de orden? Revisa el correo electrónico de confirmación de tu compra.
        </div>
      </div>
    </div>
  );
};

export default TrackingPage;
