import { useState, useEffect } from "react";
import { useCartStore } from "../store/cartStore";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import type { CustomerAddress } from "../types";
import { toast } from "react-toastify";
import { useUserStore } from "../store/userStore";
import { useConfigStore } from "../store/configStore";
import { isIphoneCategory } from "../utils/priceUtils";
import { User as UserIcon } from "lucide-react";
import { trackBeginCheckout } from "../utils/analytics";

const CheckoutPage = () => {
  const { items, cartTotal, clearCart, coupon } = useCartStore();
  const { user, updateUser } = useUserStore();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('bacs');
  const [gateways, setGateways] = useState<any[]>([]);
  const [shippingMethods, setShippingMethods] = useState<any[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<string>("");
  const [useSavedAddress, setUseSavedAddress] = useState(false);

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || "";
    fetch(`${apiUrl}/wc/payment_gateways`)
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) setGateways(d.filter(g => g.enabled));
      });
    fetch(`${apiUrl}/wc/shipping_methods`)
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) {
          setShippingMethods(d);
          if (d.length > 0) setSelectedShipping(d[0].id);
        }
      });
  }, []);

  // Formulario react-hook-form
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CustomerAddress>();

  // Efecto para detectar si hay dirección guardada y usarla por defecto
  useEffect(() => {
    if (user) {
      // Pre-poblar el formulario con datos del perfil o de facturación previa
      const defaultData: Partial<CustomerAddress> = {
        first_name: user.billing?.first_name || user.first_name || '',
        last_name: user.billing?.last_name || user.last_name || '',
        email: user.billing?.email || user.email || '',
        phone: user.billing?.phone || '',
        address_1: user.billing?.address_1 || '',
        city: user.billing?.city || '',
        postcode: user.billing?.postcode || '',
        state: user.billing?.state || '',
        country: user.billing?.country || 'AR'
      };
      
      reset(defaultData as CustomerAddress);

      if (user.billing?.address_1) {
        setUseSavedAddress(true);
      }
    }
    
    // Analytics: Begin Checkout
    if (items.length > 0) {
      trackBeginCheckout(items, cartTotal());
    }
  }, [user, reset]);

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  const handleToggleSavedAddress = (val: boolean) => {
    setUseSavedAddress(val);
    if (!val) {
      reset({}); // Limpiar formulario para datos nuevos
    }
  };

  const onSubmit = async (formData: CustomerAddress) => {
    setLoading(true);

    // Determinar qué datos usar: los guardados o los del formulario
    let finalBillingData: CustomerAddress;

    // Si useSavedAddress es true, intentamos usar los del perfil, 
    // pero si el formulario fue editado o se pre-rellenó por reset(), 
    // los datos ya están en formData si se usa handleSubmit.
    
    finalBillingData = {
      ...formData,
      country: formData.country || 'AR',
    };

    // Preparar metadatos de conversión para la nota del pedido
    const { rate: currentRate } = useConfigStore.getState();
    const hasIphoneItems = items.some(i => isIphoneCategory(i.categories || []));
    
    const iphoneDetails = items
      .filter(item => isIphoneCategory(item.categories || []))
      .map(item => `${item.name}: ARS $${(parseFloat(item.price) * item.quantity).toLocaleString('es-AR')} (Cant: ${item.quantity})`)
      .join('\n');

    const selectedGateway = gateways.find(g => g.id === paymentMethod);

    const orderData: any = {
      payment_method: paymentMethod,
      payment_method_title: selectedGateway?.title || 'Pedido Directo',
      set_paid: paymentMethod === 'woo-mercado-pago-basic', 
      billing: finalBillingData,
      shipping: finalBillingData,
      shipping_lines: selectedShipping ? [{ method_id: selectedShipping, method_title: shippingMethods.find(s => s.id === selectedShipping)?.title || 'Envío' }] : [],
      line_items: items.map(item => {
        return {
          product_id: Number(item.id),
          variation_id: Number(item.variationId || 0),
          quantity: Number(item.quantity)
        };
      }),
      coupon_lines: coupon ? [{ code: coupon.code }] : [],
      // Pasamos info extra para que el backend cree la nota
      _conversion_data: hasIphoneItems && currentRate ? {
        rate: currentRate,
        total_ars: cartTotal(),
        details: iphoneDetails
      } : null
    };

    if (user?.id && Number(user.id) > 0) {
      orderData.customer_id = Number(user.id);
    }

    console.log('[Checkout] 🚀 Enviando orden:', JSON.stringify(orderData, null, 2));

    const apiUrl = import.meta.env.VITE_API_URL || "";
    try {
      const response = await fetch(`${apiUrl}/auth/orders`, {
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

      // --- ACTUALIZACIÓN DE PERFIL ---
      // Si el usuario está logueado, actualizamos sus datos en WordPress para futuras compras
      if (user?.id) {
        try {
          const updatePayload = {
            first_name: finalBillingData.first_name,
            last_name: finalBillingData.last_name,
            billing: finalBillingData,
            shipping: finalBillingData
          };
          
          const updateRes = await fetch(`${apiUrl}/auth/customer/${user.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatePayload)
          });
          
          if (updateRes.ok) {
            const data = await updateRes.json();
            // Normalizamos los datos de WordPress/WooCommerce al formato de nuestro UserProfile
            const normalizedUser = {
              id: data.id,
              email: data.email,
              first_name: data.first_name,
              last_name: data.last_name,
              billing: data.billing || {},
              shipping: data.shipping || {}
            };
            
            // Actualizamos el estado local global
            updateUser(normalizedUser);
            console.log('[Checkout] ✅ Datos de perfil actualizados en WordPress y LocalStore');
          }
        } catch (updateErr) {
          console.error('[Checkout] ⚠️ Error al actualizar perfil (pero el pedido fue exitoso):', updateErr);
        }
      }
      
      if (result.init_point) {
        window.location.href = result.init_point;
        return;
      }

      clearCart();
      navigate('/thanks', { state: { order: result } });
    } catch (error: any) {
      console.error('Error en checkout:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
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
               <form id="checkout-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre</label>
                      <input {...register("first_name", { required: !useSavedAddress })} className="w-full rounded-xl border-gray-200 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 placeholder-gray-300" placeholder="Juan" />
                      {errors.first_name && <span className="text-red-500 text-[10px] font-bold">REQUERIDO</span>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Apellido</label>
                      <input {...register("last_name", { required: !useSavedAddress })} className="w-full rounded-xl border-gray-200 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 placeholder-gray-300" placeholder="Pérez" />
                      {errors.last_name && <span className="text-red-500 text-[10px] font-bold">REQUERIDO</span>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                      <input {...register("email", { required: !useSavedAddress, pattern: /^\S+@\S+$/i })} type="email" className="w-full rounded-xl border-gray-200 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 placeholder-gray-300" placeholder="juan@ejemplo.com" />
                      {errors.email && <span className="text-red-500 text-[10px] font-bold">EMAIL INVÁLIDO</span>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Teléfono</label>
                      <input {...register("phone", { required: !useSavedAddress })} type="tel" className="w-full rounded-xl border-gray-200 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 placeholder-gray-300" placeholder="11 1234 5678" />
                      {errors.phone && <span className="text-red-500 text-[10px] font-bold">REQUERIDO</span>}
                    </div>
                  </div>
                  
                   <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dirección</label>
                    <input {...register("address_1", { required: !useSavedAddress })} className="w-full rounded-xl border-gray-200 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 placeholder-gray-300" placeholder="Calle Falsa 123" />
                     {errors.address_1 && <span className="text-red-500 text-[10px] font-bold">REQUERIDO</span>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ciudad</label>
                      <input {...register("city", { required: !useSavedAddress })} className="w-full rounded-xl border-gray-200 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 placeholder-gray-300" />
                       {errors.city && <span className="text-red-500 text-[10px] font-bold">REQUERIDO</span>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Código Postal</label>
                      <input {...register("postcode", { required: !useSavedAddress })} className="w-full rounded-xl border-gray-200 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 placeholder-gray-300" />
                       {errors.postcode && <span className="text-red-500 text-[10px] font-bold">REQUERIDO</span>}
                    </div>
                  </div>
               </form>
             </div>
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
                        <img src={item.images?.[0]?.src || '/placeholder.png'} className="w-full h-full object-cover" />
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
              
              <div className="mb-8">
                <h3 className="font-bold mb-4 text-gray-900 uppercase text-xs tracking-widest">Método de Envío</h3>
                <div className="space-y-3">
                  {shippingMethods.map(method => (
                    <button 
                      key={method.id}
                      type="button"
                      onClick={() => setSelectedShipping(method.id)}
                      className={`w-full p-4 rounded-xl border flex justify-between items-center transition-all ${selectedShipping === method.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`}
                    >
                      <span className="font-bold text-sm">{method.title || method.method_title}</span>
                      <span className="text-[10px] uppercase font-black text-blue-600">Gratis</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-4 mb-8 space-y-2">
                {coupon && (
                   <div className="flex justify-between text-sm text-green-600 font-bold uppercase tracking-widest">
                      <span>CUPÓN: {coupon.code}</span>
                      <span>-{coupon.type === 'percent' ? `${coupon.amount}%` : `$${coupon.amount}`}</span>
                   </div>
                )}
                <div className="flex justify-between font-bold text-lg text-gray-900">
                  <span>Total</span>
                  <span className="text-blue-600">${cartTotal().toFixed(2)}</span>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-bold mb-3 text-gray-900 uppercase text-xs tracking-widest">Método de Pago</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  {gateways.map(gateway => (
                    <button 
                      key={gateway.id}
                      type="button"
                      onClick={() => setPaymentMethod(gateway.id)}
                      className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === gateway.id ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200'}`}
                    >
                      <span className="text-xs font-bold uppercase">{gateway.title}</span>
                    </button>
                  ))}
                </div>

                {paymentMethod === 'bacs' && (
                  <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg text-sm text-blue-800 animate-fadeIn">
                    <p className="font-bold mb-2">Instrucciones:</p>
                    <div className="opacity-90 mb-4 whitespace-pre-wrap">
                      Realiza tu transferencia a la cuenta:
                       Titular: Diego Armando Ariel Niz 
                       Banco: Provincia
                       CBU: 0140092203703152862397
                       Alias: Dn.style.3
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
              </div>

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