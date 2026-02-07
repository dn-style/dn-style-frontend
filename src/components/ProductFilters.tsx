import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface FilterProps {
  attributes: { id: number; name: string; slug: string; options: string[] }[];
  selectedAttributes: Record<string, string>;
  onAttributeChange: (slug: string, value: string) => void;
  minPrice: string;
  maxPrice: string;
  onPriceChange: (min: string, max: string) => void;
  stockStatus: string;
  onStockChange: (status: string) => void;
  search: string;
  onSearchChange: (term: string) => void;
  onClearFilters: () => void;
}

const ProductFilters: React.FC<FilterProps> = ({
  attributes,
  selectedAttributes,
  onAttributeChange,
  minPrice,
  maxPrice,
  onPriceChange,
  stockStatus,
  onStockChange,
  search,
  onSearchChange,
  onClearFilters
}) => {
  const [localMin, setLocalMin] = useState(minPrice);
  const [localMax, setLocalMax] = useState(maxPrice);
  const [localSearch, setLocalSearch] = useState(search);

  // Sincronizar estado local si props cambian externamente (ej. reset)
  useEffect(() => {
    setLocalMin(minPrice);
    setLocalMax(maxPrice);
    setLocalSearch(search);
  }, [minPrice, maxPrice, search]);

  const handlePriceApply = () => {
    onPriceChange(localMin, localMax);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(localSearch);
  };

  const hasActiveFilters = 
    Object.keys(selectedAttributes).length > 0 || 
    minPrice !== '' || 
    maxPrice !== '' || 
    stockStatus !== '' || 
    search !== '';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-900">Filtros</h2>
        {hasActiveFilters && (
          <button 
            onClick={onClearFilters}
            className="text-xs text-red-500 hover:text-red-700 underline flex items-center"
          >
            <X size={12} className="mr-1" /> Limpiar
          </button>
        )}
      </div>

      {/* Búsqueda */}
      <div className="pb-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold mb-2">Buscar</h3>
        <form onSubmit={handleSearchSubmit} className="relative">
          <input
            type="text"
            placeholder="Nombre, marca..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black"
          />
          <Search size={14} className="absolute left-3 top-3 text-gray-400" />
        </form>
      </div>

      {/* Precio */}
      <div className="pb-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold mb-2">Precio</h3>
        <div className="flex items-center gap-2 mb-2">
          <input
            type="number"
            placeholder="Min"
            value={localMin}
            onChange={(e) => setLocalMin(e.target.value)}
            className="w-1/2 p-2 border border-gray-300 rounded text-sm"
          />
          <span className="text-gray-400">-</span>
          <input
            type="number"
            placeholder="Max"
            value={localMax}
            onChange={(e) => setLocalMax(e.target.value)}
            className="w-1/2 p-2 border border-gray-300 rounded text-sm"
          />
        </div>
        <button 
          onClick={handlePriceApply}
          className="w-full bg-black text-white py-1.5 rounded text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors"
        >
          Aplicar Precio
        </button>
      </div>

      {/* Disponibilidad */}
      <div className="pb-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold mb-2">Disponibilidad</h3>
        <div className="space-y-2">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="stock"
              checked={stockStatus === ''}
              onChange={() => onStockChange('')}
              className="text-black focus:ring-black"
            />
            <span className="text-sm text-gray-600">Todos</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="stock"
              checked={stockStatus === 'instock'}
              onChange={() => onStockChange('instock')}
              className="text-black focus:ring-black"
            />
            <span className="text-sm text-gray-600">En Stock</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="stock"
              checked={stockStatus === 'onbackorder'}
              onChange={() => onStockChange('onbackorder')}
              className="text-black focus:ring-black"
            />
            <span className="text-sm text-gray-600">Reserva (Pre-order)</span>
          </label>
        </div>
      </div>

      {/* Atributos Dinámicos (Marcas, Tallas, etc) */}
      {attributes.map((attr) => (
        <div key={attr.slug} className="pb-4 border-b border-gray-100 last:border-0">
          <h3 className="text-sm font-semibold mb-2 capitalize">{attr.name}</h3>
          <div className="flex flex-col space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
            {attr.options.map((option) => (
              <label key={option} className="flex items-center space-x-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedAttributes[attr.slug] === option}
                  onChange={() => onAttributeChange(attr.slug, option)}
                  className="rounded border-gray-300 text-black focus:ring-black"
                />
                <span className={`text-sm ${selectedAttributes[attr.slug] === option ? 'text-black font-medium' : 'text-gray-500 group-hover:text-gray-700'}`}>
                  {option}
                </span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductFilters;
