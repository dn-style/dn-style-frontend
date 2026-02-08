import { useEffect, useRef, useState } from "react";
import Slider, { type Settings } from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { Link } from "react-router-dom";

type Product = {
  id: number;
  name: string;
  description: string;
  featured: boolean;
  price: string;
  images: { src: string }[];
};

interface DivitionsProps {
  categoryId: number;
}

const Divitions = ({ categoryId }: DivitionsProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1200,
    height: typeof window !== "undefined" ? window.innerHeight : 800,
  });
  const sliderRef = useRef<Slider>(null);

  useEffect(() => {
    setLoading(true);
    setError(false);

    const apiUrl = import.meta.env.VITE_API_URL || "";
    fetch(`${apiUrl}/wc/products?category=${categoryId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Error al obtener productos");
        return res.json();
      })
      .then((data: Product[]) => {
        setProducts(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [categoryId]);

  // Efecto para detectar cambios en el tamaño de la ventana
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });

      // Forzar actualización del slider después de redimensionar
      if (sliderRef.current) {
        setTimeout(() => {
          sliderRef.current?.slickGoTo(0);
          setTimeout(() => {
            if (sliderRef.current) {
              // @ts-ignore - react-slick tiene un método interno para redimensionar
              sliderRef.current.innerSlider.adaptHeight();
              sliderRef.current.slickPlay();
            }
          }, 100);
        }, 300);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (loading)
    return <div className="p-4 text-center">Cargando productos...</div>;
  if (error)
    return (
      <div className="p-4 text-center text-red-500">
        Error al cargar productos
      </div>
    );

  const sortedProducts = [...products]
    .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
    .sort(() => Math.random() - 0.5);

  const settings: Settings = {
    dots: true,
    infinite: true,
    speed: 500,
    easing: "ease-in-out",
    slidesToShow:
      windowSize.width < 480
        ? 1
        : windowSize.width < 768
        ? 2
        : windowSize.width < 1024
        ? 3
        : 4,
    slidesToScroll: 1,
    adaptiveHeight: true,
    arrows: false, // Ocultamos las flechas por defecto y usamos las personalizadas
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
          arrows: false,
          rows: 1,
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
          arrows: false,
        },
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          arrows: false,
          dots: windowSize.width > 350, // Ocultar dots en pantallas muy pequeñas
          centerMode: windowSize.width > 350,
          centerPadding: windowSize.width > 350 ? "20px" : "0px",
        },
      },
    ],
  };

  return (
    <div className="my-10 lg:my-2 relative">
      <div className="max-w-7xl mx-auto">
        {sortedProducts.length > 0 ? (
          <Slider ref={sliderRef} {...settings}>
            {sortedProducts.map((product) => (
              <Link to={`/producto/${product.id}`} key={product.id}>
                <div key={product.id} className="px-2 focus:outline-none">
                  <div className="border border-gray-100  rounded-xl bg-white  shadow-sm hover:shadow-xl transition-all duration-300 p-4 h-full flex flex-col group">
                    <div
                      className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-gray-50  mb-4 flex items-center justify-center p-4"
                    >
                      {/* Image background */}
                       <img 
                         src={product.images[0]?.src || "/placeholder.png"}
                         alt={product.name}
                         className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                         loading="lazy"
                       />
                       
                       {/* Badge for price */}
                      {product.price && (
                        <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm text-white text-sm font-bold px-3 py-1 rounded-full shadow-sm">
                          ${product.price}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col flex-grow justify-between">
                      <div>
                                                <h3 className="text-base font-semibold text-gray-900 line-clamp-2 mb-1 group-hover:text-blue-600 transition-colors">
                                                  {product.name}
                                                </h3>
                                                <div className="text-xs text-gray-500 line-clamp-2 min-h-[2.5em]" dangerouslySetInnerHTML={{__html: product.short_description || ''}}></div>
                                              </div>
                                              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center text-blue-600 font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        Ver Detalles
                        <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </Slider>
        ) : (
          <div className="text-center py-10 text-gray-500">
            No hay productos disponibles en esta categoría.
          </div>
        )}
      </div>

      {/* Botones de navegación personalizados */}
      {sortedProducts.length > 0 && (
        <>
          <button
            className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 hidden md:block"
            onClick={() => sliderRef.current?.slickPrev()}
            aria-label="Anterior"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-gray-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 hidden md:block"
            onClick={() => sliderRef.current?.slickNext()}
            aria-label="Siguiente"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-gray-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </>
      )}
    </div>
  );
};

export default Divitions;
