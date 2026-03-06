import { useConfigStore } from '../store/configStore';

// Hook para obtener el valor del dólar blue (desde el store global)
export const useDolarBlue = () => {
  const rate = useConfigStore(state => state.rate);
  const loading = useConfigStore(state => state.loading);

  return { rate, loading };
};

export const isIphoneCategory = (categories: { id: number; name: string; slug: string; parent?: number }[]) => {
  // Verificamos si tiene la categoría 'apple' o 'iphone' y si es una categoría principal
  return categories.some(cat => (cat.slug === 'apple' || cat.slug === 'iphone') && (!cat.parent || cat.parent === 0));
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
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
  const isApple = isIphoneCategory(categories || []);

  if (isApple) {
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
  }

  // Para productos que no son Apple, mostramos solo en ARS
  // Asumimos que el precio base ya viene en ARS si no es Apple
  return (
    <div className={`flex flex-col ${className}`}>
      <span className={usdClassName.replace('text-blue-600', 'text-gray-900')}>
        ARS ${formatPrice(numericPrice)}
      </span>
    </div>
  );
};
