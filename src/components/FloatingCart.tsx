import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "../store/cartStore";

const FloatingCart: React.FC = () => {
  const itemsCount = useCartStore((state) => state.itemsCount());
  const location = useLocation();

  // No mostrar el botón si estamos en el carrito o en el checkout
  const hidePaths = ["/cart", "/checkout"];
  if (hidePaths.includes(location.pathname) || itemsCount === 0) {
    return null;
  }

  return (
    <div className="md:hidden fixed bottom-24 right-6 z-40 animate-in fade-in zoom-in duration-300">
      <Link
        to="/cart"
        className="relative flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-full shadow-[0_10px_25px_rgba(37,99,235,0.4)] active:scale-90 transition-transform"
      >
        <ShoppingCart size={24} />
        
        {/* Badge de cantidad */}
        <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-pink-500 text-[10px] font-black border-2 border-white shadow-sm">
          {itemsCount}
        </span>

        {/* Efecto de pulso si hay pocos items para llamar la atención */}
        <span className="absolute inset-0 rounded-full bg-blue-600 animate-ping opacity-20 -z-10"></span>
      </Link>
    </div>
  );
};

export default FloatingCart;
