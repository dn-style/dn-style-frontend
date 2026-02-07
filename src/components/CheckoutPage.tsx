import { useState, useEffect } from "react";
import { useCartStore } from "../store/cartStore";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import type { CustomerAddress } from "../types";
import { toast } from "react-toastify";

interface PaymentGateway {
  id: string;
  title: string;
  description: string;
  settings?: {
    instructions?: { value: string };
    account_details?: { value: any[] }; // BACS details usually come here but might be complex structure
  };
}

const CheckoutPage = () => {
  const { items, cartTotal, clearCart } = useCartStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'bacs' | 'woo-mercado-pago-basic' | 'card'>('bacs');
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const { register, handleSubmit, formState: { errors } } = useForm<CustomerAddress>();
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";
    fetch(`${apiUrl}/wc/payment-gateways`)
      .then(res => res.json())
      .then(data => {
        setGateways(data);
        // Auto-select first available or fallback to bacs
        if (data.length > 0) setPaymentMethod(data[0].id);
      })
      .catch(console.error);
  }, []);

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  const onSubmit = async (data: CustomerAddress) => {
    setLoading(true);

    const orderData = {
      payment_method: paymentMethod,
      set_paid: paymentMethod === 'card' || paymentMethod === 'woo-mercado-pago-basic', // Simplificación
      customer: data,
      items: items.map(item => ({
        product_id: item.id,
        quantity: item.quantity
      })),
      // Añadimos una nota con el archivo adjunto simulado
      note: file ? `Comprobante adjunto: ${file.name}` : undefined
    };

    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";
    try {
      const response = await fetch(`${apiUrl}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        throw new Error('Error al procesar el pedido');
      }

      const result = await response.json();
      
      if (paymentMethod === 'bacs') {
        toast.success('¡Pedido recibido! Por favor envía tu comprobante.');
      } else {
        toast.success('¡Pago procesado con éxito!');
      }
      
      clearCart();
      navigate('/');
    } catch (error) {
      console.error(error);
      toast.error('Hubo un problema al procesar tu pedido. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const getGatewayInstructions = (id: string) => {
    const gw = gateways.find(g => g.id === id);
    // Limpiamos etiquetas HTML básicas para mostrar texto plano si es necesario, o usamos dangerouslySetInnerHTML
    return gw?.description || "";
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Finalizar Compra</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Formulario de Facturación */}
        <div>
           <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
             <h2 className="text-xl font-bold mb-6 text-gray-900 flex items-center gap-2">
               <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
               Detalles de Facturación
             </h2>
             
             <form id="checkout-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                    <input {...register("first_name", { required: true })} className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500 bg-gray-50" placeholder="Juan" />
                    {errors.first_name && <span className="text-red-500 text-xs">Requerido</span>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                    <input {...register("last_name", { required: true })} className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500 bg-gray-50" placeholder="Pérez" />
                    {errors.last_name && <span className="text-red-500 text-xs">Requerido</span>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input {...register("email", { required: true, pattern: /^\S+@\S+$/i })} type="email" className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500 bg-gray-50" placeholder="juan@ejemplo.com" />
                   {errors.email && <span className="text-red-500 text-xs">Email inválido</span>}
                </div>
                
                 <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                  <input {...register("address_1", { required: true })} className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500 bg-gray-50" placeholder="Calle Falsa 123" />
                   {errors.address_1 && <span className="text-red-500 text-xs">Requerido</span>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                    <input {...register("city", { required: true })} className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500 bg-gray-50" />
                     {errors.city && <span className="text-red-500 text-xs">Requerido</span>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Código Postal</label>
                    <input {...register("postcode", { required: true })} className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500 bg-gray-50" />
                     {errors.postcode && <span className="text-red-500 text-xs">Requerido</span>}
                  </div>
                </div>
             </form>
           </div>
        </div>

        {/* Resumen de Pedido y Pago */}
        <div>
           <div className="bg-gray-50 p-8 rounded-2xl border border-gray-200 sticky top-24">
              <h2 className="text-xl font-bold mb-6 text-gray-900">Tu Pedido</h2>
              <ul className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {items.map(item => (
                  <li key={item.cartId} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded overflow-hidden">
                        <img src={item.images[0]?.src} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <span className="font-medium text-gray-900 block">{item.name}</span>
                        <span className="text-gray-500">x{item.quantity}</span>
                      </div>
                    </div>
                    <span className="font-medium">${(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              
              <div className="border-t border-gray-200 pt-4 mb-8">
                <div className="flex justify-between font-bold text-lg text-gray-900">
                  <span>Total</span>
                  <span className="text-blue-600">${cartTotal().toFixed(2)}</span>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-bold mb-3 text-gray-900">Método de Pago</h3>
                <div className="flex gap-3 mb-4 flex-wrap">
                  {/* Siempre mostramos BACS y añadimos MP si está detectado o como opción hardcodeada para demo */}
                  <button 
                    type="button"
                    onClick={() => setPaymentMethod('bacs')}
                    className={`flex-1 py-3 px-2 rounded-lg border flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'bacs' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <span className="text-sm font-medium">Transferencia</span>
                  </button>
                  
                  {/* Opción de Tarjeta (simulada o MP) */}
                  <button 
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`flex-1 py-3 px-2 rounded-lg border flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'card' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <span className="text-sm font-medium">Tarjeta / MP</span>
                  </button>
                </div>

                {paymentMethod === 'bacs' && (
                  <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg text-sm text-blue-800 animate-fadeIn">
                    <p className="font-bold mb-2">Instrucciones:</p>
                    <div className="opacity-90 mb-4 whitespace-pre-wrap">
                      {getGatewayInstructions('bacs') || "Realiza tu transferencia a la cuenta:\nBanco: Santander\nCBU: 000000321321321\nAlias: DN.STYLE.STORE"}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-blue-200">
                      <label className="block font-bold mb-2">Adjuntar Comprobante</label>
                      <input 
                        type="file" 
                        accept="image/*,.pdf"
                        onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                        className="block w-full text-sm text-blue-900 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
                      />
                      {file && <p className="mt-2 text-xs text-green-600 font-bold">✓ Archivo seleccionado: {file.name}</p>}
                    </div>
                  </div>
                )}

                {paymentMethod === 'card' && (
                   <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 animate-fadeIn">
                      <p className="text-sm text-gray-600 mb-2">Serás redirigido a Mercado Pago para completar tu pago de forma segura.</p>
                      {/* Aquí iría la integración real de MP Bricks */}
                      <div className="h-12 bg-blue-500 rounded flex items-center justify-center text-white font-bold cursor-pointer">
                         Pagar con Mercado Pago
                      </div>
                   </div>
                )}
              </div>

              <button 
                type="submit" 
                form="checkout-form"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Confirmar Pedido'}
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;