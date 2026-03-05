import React, { useState, useEffect } from 'react';

// Hook para obtener el valor del dólar blue
export const useDolarBlue = () => {
  const [rate, setRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRate = async () => {
      try {
        const res = await fetch('https://dolarapi.com/v1/dolares/blue');
        const data = await res.json();
        if (data && data.venta) {
          setRate(data.venta);
        }
      } catch (error) {
        console.error('Error fetching dollar rate:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRate();
  }, []);

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
  const isIphone = isIphoneCategory(categories || []);
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;

  if (isIphone) {
    const priceInArs = rate ? numericPrice * rate : null;
    return (
      <div className={`flex flex-col ${className}`}>
        <span className={usdClassName}>US$ {formatPrice(numericPrice)}</span>
        {priceInArs && (
          <span className={arsClassName}>
            ARS ${formatPrice(priceInArs)} <span className="text-[8px] opacity-60">(Dólar Blue)</span>
          </span>
        )}
      </div>
    );
  }

  return <span className={usdClassName}>${formatPrice(numericPrice)}</span>;
};
