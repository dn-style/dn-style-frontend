import { useQuery } from "@tanstack/react-query";
import Slider, { type Settings } from "react-slick";

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

const DivitionsCarousel = ({ categoryId }: DivitionsProps) => {
  const fetchProducts = async (): Promise<Product[]> => {
    const res = await fetch(
      `http://localhost:4000/wc/products?category=${categoryId}`
    );
    if (!res.ok) throw new Error("Error al obtener productos");
    return res.json();
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ["products", categoryId],
    queryFn: fetchProducts,
  });

  if (isLoading) return <p>Cargando productos...</p>;
  if (isError) return <p>Error al cargar productos</p>;

  // Ordenamos productos: destacados primero y luego random
  const sortedProducts = [...data!]
    .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
    .sort(() => Math.random() - 0.5);

  const settings: Settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 8,
    slidesToScroll: 5,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 2 } },
      { breakpoint: 640, settings: { slidesToShow: 1 } },
    ],
  };

  return (
    <div className="p-4">
      <Slider {...settings}>
        {sortedProducts.map((product) => (
          <div key={product.id} className="p-2">
            <div className="border border-gray-100 rounded-lg shadow-md p-3 text-center">
              <img
                src={product.images[0]?.src || "/placeholder.png"}
                alt={product.name}
                className="w-full h-48 object-cover rounded-md"
              />
              <h3 className="text-lg font-semibold mt-2">{product.name}</h3>
              {/* {product.price && (
                <p className="text-gray-600 font-medium mt-1">${product.price}</p>
              )} */}
            </div>
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default DivitionsCarousel;
