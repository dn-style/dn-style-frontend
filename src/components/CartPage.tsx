import { useCartStore } from "../store/cartStore";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const CartPage = () => {
  const { items, removeItem, updateQuantity, cartTotal, clearCart } = useCartStore();
  const navigate = useNavigate();

  const handleProceedToCheckout = () => {
    const savedUser = localStorage.getItem('dn_user');
    if (!savedUser) {
      toast.info("Por favor, inicia sesión para finalizar tu compra");
      navigate('/account?redirect=checkout');
    } else {
      navigate('/checkout');
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Tu carrito está vacío</h2>
        <p className="text-gray-500 mb-8">Parece que aún no has añadido productos.</p>
        <Link to="/" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-full transition-colors">
          Explorar Productos
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-gray-900">
      <h1 className="text-3xl font-bold mb-8 uppercase tracking-tight">Carrito de Compras</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Lista de Items */}
        <div className="lg:col-span-2 space-y-6">
          {items.map((item) => (
            <div key={item.cartId} className="flex gap-4 p-4 bg-white rounded-2xl shadow-sm border border-gray-100 group">
              <div className="w-24 h-24 flex-shrink-0 bg-gray-50 rounded-xl overflow-hidden border border-gray-50 flex items-center justify-center p-2">
                <img src={item.images[0]?.src || '/placeholder.png'} alt={item.name} className="w-full h-full object-contain" />
              </div>
              
              <div className="flex-grow flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-lg text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">{item.name}</h3>
                  <button onClick={() => removeItem(item.cartId)} className="text-gray-300 hover:text-red-500 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
                
                <div className="flex justify-between items-end mt-4">
                  <div className="flex items-center bg-gray-50 border border-gray-100 rounded-lg p-1">
                    <button 
                      onClick={() => updateQuantity(item.cartId, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-white rounded-md shadow-sm transition-all disabled:opacity-30"
                      disabled={item.quantity <= 1}
                    >
                      -
                    </button>
                    <span className="px-4 font-bold text-gray-900">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-white rounded-md shadow-sm transition-all"
                    >
                      +
                    </button>
                  </div>
                  <div className="text-xl font-extrabold text-blue-600">
                    ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          <button onClick={clearCart} className="text-xs font-bold text-gray-400 hover:text-red-500 uppercase tracking-widest transition-colors">Vaciar carrito</button>
        </div>

        {/* Resumen */}
        <div className="lg:col-span-1">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 sticky top-24">
            <h2 className="text-xl font-bold mb-6 uppercase tracking-tight">Resumen</h2>
            
            <div className="space-y-4 mb-8 text-gray-600">
              <div className="flex justify-between">
                <span className="text-sm">Subtotal</span>
                <span className="font-bold text-gray-900">${cartTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Envío estimado</span>
                <span className="text-green-600 font-bold uppercase text-[10px] bg-green-50 px-2 py-1 rounded">Gratis</span>
              </div>
              <div className="border-t border-gray-100 pt-4 flex justify-between font-extrabold text-2xl text-gray-900">
                <span>Total</span>
                <span className="text-blue-600">${cartTotal().toFixed(2)}</span>
              </div>
            </div>

            <button 
              onClick={handleProceedToCheckout}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-500/20 transition-all uppercase text-sm tracking-widest"
            >
              Ir al Pago
            </button>
            
            <p className="mt-6 text-center text-[10px] text-gray-400 uppercase leading-relaxed tracking-wider">
              Pago seguro garantizado con tecnología SSL de 256 bits.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;