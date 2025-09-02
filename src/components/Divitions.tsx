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

    fetch(`http://10.10.0.3:4000/wc/products?category=${categoryId}`)
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
                  <div className="border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-3 text-center lg:h-40 h-80 flex flex-col">
                    <div
                      className="flex-1 relative overflow-visible rounded-md bg-gray-100"
                      style={{
                        backgroundImage: `url(${
                          product.images[0]?.src || "/placeholder.png"
                        })`,
                        backgroundPosition: "center",
                        backgroundOrigin: "center",
                        backgroundSize: "contain",
                        backgroundRepeat: "no-repeat",

                      }}
                    >
                      {product.price && (
                        <span className="absolute top-3 right-2 -translate-y-1/2 z-10 bg-orange-200 text-black flex items-center justify-center rounded-full w-12 h-12 shadow-md">
                          ${product.price}
                        </span>
                      )}
                    </div>
                    <div className="mt-3">
                      <h3 className="text-sm font-medium text-gray-800 line-clamp-2">
                        {product.name}
                      </h3>
                      {/* <p className="text-lg font-bold text-blue-600 mt-1">
                      {product.price}
                    </p> */}
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
