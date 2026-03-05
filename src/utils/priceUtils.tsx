import { useConfigStore } from '../store/configStore';

// Hook para obtener el valor del dólar blue (desde el store global)
export const useDolarBlue = () => {
  const rate = useConfigStore(state => state.rate);
  const loading = useConfigStore(state => state.loading);

  return { rate, loading };
};

export const isIphoneCategory = (categories: { id: number; name: string; slug: string; parent?: number }[]) => {
  // Verificamos si tiene la categoría 'iphone' y si es una categoría principal (parent === 0 o no tiene parent)
  // Nota: En WooCommerce API, si parent es 0 es principal.
  return categories.some(cat => cat.slug === 'apple' && (!cat.parent || cat.parent === 0));
};

export const formatPrice = (price: string | number) => {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  return new Intl.NumberFormat('es-AR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

interface PriceDisplayProps {
  price: string | number;
  categories: any[];
  className?: string;
  usdClassName?: string;
  arsClassName?: string;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({ 
  price, 
  categories, 
  className = "", 
  usdClassName = "text-blue-600 font-black", 
  arsClassName = "text-gray-400 text-xs font-bold" 
}) => {
  const { rate } = useDolarBlue();
  // Mostramos siempre ambos precios si tenemos el rate, o solo USD si no lo tenemos.
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;

  const priceInArs = rate ? numericPrice * rate : null;
  return (
    <div className={`flex flex-col ${className}`}>
      <span className={usdClassName}>US$ {formatPrice(numericPrice)}</span>
      {priceInArs && (
        <span className={arsClassName}>
          ARS ${formatPrice(priceInArs)}
        </span>
      )}
    </div>
  );
};
