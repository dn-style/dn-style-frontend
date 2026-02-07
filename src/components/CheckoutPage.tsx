import { useState, useEffect } from "react";
import { useCartStore } from "../store/cartStore";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import type { CustomerAddress } from "../types";
import { toast } from "react-toastify";
import { useUserStore } from "../store/userStore";
import { MapPin, User as UserIcon, Gift } from "lucide-react";

interface PaymentGateway {
  id: string;
  title: string;
  description: string;
  settings?: {
    instructions?: { value: string };
    account_details?: { value: any[] };
  };
}

const CheckoutPage = () => {
  const { items, cartTotal, clearCart } = useCartStore();
  const { user } = useUserStore();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'bacs' | 'woo-mercado-pago-basic' | 'card'>('bacs');
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [useSavedAddress, setUseSavedAddress] = useState(false);

  const [isGift, setIsGift] = useState(false);

  // Formulario react-hook-form
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CustomerAddress>();

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";
    fetch(`${apiUrl}/wc/payment-gateways`)
      .then(res => res.json())
      .then(data => {
        setGateways(data);
        if (data.length > 0) setPaymentMethod(data[0].id);
      })
      .catch(console.error);
  }, []);

  // Efecto para detectar si hay dirección guardada y usarla por defecto
  useEffect(() => {
    if (user?.billing?.address_1) {
      setUseSavedAddress(true);
    } else {
      setUseSavedAddress(false);
    }
  }, [user?.id, user?.billing?.address_1]);

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  const handleToggleSavedAddress = (val: boolean) => {
    setUseSavedAddress(val);
    if (!val) {
      setIsGift(true);
      reset({}); // Limpiar formulario para datos nuevos
    } else {
      setIsGift(false);
    }
  };

  const onSubmit = async (formData: CustomerAddress) => {
    setLoading(true);

    // Determinar qué datos usar: los guardados o los del formulario
    let finalBillingData: CustomerAddress;

    if (useSavedAddress && user?.billing?.address_1) {
      finalBillingData = user.billing;
    } else {
      finalBillingData = {
        ...formData,
        country: formData.country || 'AR',
      };
    }

    const orderData = {
      payment_method: paymentMethod,
      payment_method_title: paymentMethod === 'bacs' ? 'Transferencia Bancaria' : 'Mercado Pago',
      set_paid: paymentMethod === 'woo-mercado-pago-basic', 
      billing: finalBillingData,
      shipping: finalBillingData, 
      line_items: items.map(item => ({
        product_id: item.id,
        quantity: item.quantity
      })),
      customer_note: isGift ? `PEDIDO PARA REGALO.` : undefined,
      customer_id: user?.id || 0
    };

    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";
    try {
      const response = await fetch(`${apiUrl}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMessage = result.details?.message || result.error || 'Error al procesar el pedido';
        throw new Error(errorMessage);
      }
      
      if (paymentMethod === 'bacs') {
        toast.success('¡Pedido recibido! Por favor envía tu comprobante.');
      } else {
        toast.success('¡Pago procesado con éxito!');
      }
      
      clearCart();
      navigate('/');
    } catch (error: any) {
      console.error('Error en checkout:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getGatewayInstructions = (id: string) => {
    const gw = gateways.find(g => g.id === id);
    return gw?.description || "";
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-gray-900">
      <h1 className="text-3xl font-bold mb-8 text-center uppercase tracking-tight">Finalizar Compra</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Columna Izquierda: Datos de Envío */}
        <div>
           <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
             <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
               <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-sans">1</span>
               Detalles de Envío
             </h2>

             {/* Opción de usar dirección guardada */}
             <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
               <div className="flex items-center justify-between mb-2">
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-white rounded-full text-blue-600 shadow-sm"><UserIcon size={20} /></div>
                   <div>
                     <p className="font-bold text-sm text-gray-900">
                       {user?.billing?.address_1 ? "Mis Datos Guardados" : "Enviar a mi dirección"}
                     </p>
                     <p className="text-xs text-gray-500">
                       {user?.billing?.address_1 ? "Usar mi perfil para el envío" : "Completa el formulario para tu primer envío"}
                     </p>
                   </div>
                 </div>
                 {user?.billing?.address_1 && (
                   <label className="relative inline-flex items-center cursor-pointer">
                     <input 
                       type="checkbox" 
                       checked={useSavedAddress} 
                       onChange={() => handleToggleSavedAddress(!useSavedAddress)} 
                       className="sr-only peer" 
                     />
                     <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                   </label>
                 )}
               </div>

               {useSavedAddress && user?.billing?.address_1 && (
                 <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600 space-y-1 pl-2 border-l-4 border-blue-500 animate-fadeIn">
                   <p className="font-bold text-gray-900">{user.billing.first_name} {user.billing.last_name}</p>
                   <p>{user.billing.address_1}</p>
                   <p>{user.billing.city}, {user.billing.state} ({user.billing.postcode})</p>
                   <p>{user.billing.email} • {user.billing.phone}</p>
                 </div>
               )}
             </div>
             
             {/* Formulario (visible si NO se usa la dirección guardada o no hay datos) */}
             <div className={`transition-all duration-500 ease-in-out overflow-hidden ${useSavedAddress ? 'max-h-0' : 'max-h-[1000px]'}`}>
               <div className="flex items-center gap-2 mb-6 p-3 bg-blue-50 text-blue-700 rounded-xl border border-blue-100">
                 <Gift size={18} />
                 <p className="text-xs font-bold uppercase tracking-wider">
                   {user?.billing?.address_1 ? "Estás comprando para otra persona (Regalo)" : "Completa los datos para el envío"}
                 </p>
               </div>

               <form id="checkout-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre</label>
                      <input {...register("first_name", { required: !useSavedAddress })} className="w-full rounded-xl border-gray-200 focus:ring-blue-500 focus:border-blue-500 bg-gray-50" placeholder="Juan" />
                      {errors.first_name && <span className="text-red-500 text-[10px] font-bold">REQUERIDO</span>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Apellido</label>
                      <input {...register("last_name", { required: !useSavedAddress })} className="w-full rounded-xl border-gray-200 focus:ring-blue-500 focus:border-blue-500 bg-gray-50" placeholder="Pérez" />
                      {errors.last_name && <span className="text-red-500 text-[10px] font-bold">REQUERIDO</span>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                      <input {...register("email", { required: !useSavedAddress, pattern: /^\S+@\S+$/i })} type="email" className="w-full rounded-xl border-gray-200 focus:ring-blue-500 focus:border-blue-500 bg-gray-50" placeholder="juan@ejemplo.com" />
                      {errors.email && <span className="text-red-500 text-[10px] font-bold">EMAIL INVÁLIDO</span>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Teléfono</label>
                      <input {...register("phone", { required: !useSavedAddress })} type="tel" className="w-full rounded-xl border-gray-200 focus:ring-blue-500 focus:border-blue-500 bg-gray-50" placeholder="11 1234 5678" />
                      {errors.phone && <span className="text-red-500 text-[10px] font-bold">REQUERIDO</span>}
                    </div>
                  </div>
                  
                   <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dirección</label>
                    <input {...register("address_1", { required: !useSavedAddress })} className="w-full rounded-xl border-gray-200 focus:ring-blue-500 focus:border-blue-500 bg-gray-50" placeholder="Calle Falsa 123" />
                     {errors.address_1 && <span className="text-red-500 text-[10px] font-bold">REQUERIDO</span>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ciudad</label>
                      <input {...register("city", { required: !useSavedAddress })} className="w-full rounded-xl border-gray-200 focus:ring-blue-500 focus:border-blue-500 bg-gray-50" />
                       {errors.city && <span className="text-red-500 text-[10px] font-bold">REQUERIDO</span>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Código Postal</label>
                      <input {...register("postcode", { required: !useSavedAddress })} className="w-full rounded-xl border-gray-200 focus:ring-blue-500 focus:border-blue-500 bg-gray-50" />
                       {errors.postcode && <span className="text-red-500 text-[10px] font-bold">REQUERIDO</span>}
                    </div>
                  </div>
               </form>
             </div>
           </div>
        </div>

        {/* Resumen de Pedido y Pago */}
        <div>
           {/* ... Resto del componente igual (Resumen pedido, Métodos de pago, Botón) ... */}
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
                  <button 
                    type="button"
                    onClick={() => setPaymentMethod('bacs')}
                    className={`flex-1 py-3 px-2 rounded-lg border flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'bacs' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <span className="text-sm font-medium">Transferencia</span>
                  </button>
                  
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
                      <p className="text-xs font-medium text-blue-700">
                        * Podrás subir tu comprobante de pago luego desde la sección{" "}
                        <Link to="/account" className="font-bold underline hover:text-blue-900 transition-colors">
                          Mis Pedidos
                        </Link>{" "}
                        en tu perfil.
                      </p>
                    </div>
                  </div>
                )}

                {paymentMethod === 'card' && (
                   <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 animate-fadeIn">
                      <p className="text-sm text-gray-600 mb-2">Serás redirigido a Mercado Pago para completar tu pago de forma segura.</p>
                      <div className="h-12 bg-blue-500 rounded flex items-center justify-center text-white font-bold cursor-pointer">
                         Pagar con Mercado Pago
                      </div>
                   </div>
                )}
              </div>

              {/* Botón de envío que maneja ambos casos (Saved vs Form) */}
              <button 
                onClick={useSavedAddress ? handleSubmit(() => onSubmit({} as CustomerAddress)) : undefined}
                type={useSavedAddress ? 'button' : 'submit'}
                form={useSavedAddress ? undefined : 'checkout-form'}
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