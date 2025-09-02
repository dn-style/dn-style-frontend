import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import InfiniteScroll from "react-infinite-scroll-component";
import { useCategoriesStore } from "../store/categoriesStore";

export interface Product {
  id: number;
  name: string;
  images: { src: string }[];
  price?: string | number;
  attributes?: { id: number; name: string; slug: string; options: string[] }[];
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  parent?: number;
}

export interface Attribute {
  id: number;
  name: string;
  slug: string;
  options: string[];
}

const PAGE_SIZE = 10;

const CategoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const { categories } = useCategoriesStore();

  const currentCategory = slug
    ? categories.find((c) => c.slug === slug)
    : undefined;

  const mainCategoryId = currentCategory?.parent
    ? currentCategory.parent
    : currentCategory?.id;

  const mainCategory = categories.find((c) => c.id === mainCategoryId);
  const subCategories = categories.filter((c) => c.parent === mainCategoryId);

  const [selectedSubCat, setSelectedSubCat] = useState<number | null>(
    currentCategory?.parent ? currentCategory.id : null
  );

  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  // ------------------------------
  // ATTRIBUTES STATE
  // ------------------------------
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [selectedAttributes, setSelectedAttributes] = useState<
    Record<string, string>
  >({});

  // Fetch atributos por categoría (solo los que tienen productos)
  useEffect(() => {
    if (!mainCategoryId) return;

    const fetchAttributesForCategory = async (categoryId: number) => {
      const res = await fetch(
        `http://localhost:4000/wc/products?category=${categoryId}&per_page=100`
      );
      if (!res.ok) return [];
      const products: Product[] = await res.json();

      const attrsMap: Record<string, { name: string; options: Set<string> }> =
        {};

      products.forEach((p) => {
        p.attributes?.forEach((attr) => {
          if (!attrsMap[attr.slug]) {
            attrsMap[attr.slug] = { name: attr.name, options: new Set() };
          }
          (attr.options || []).forEach((o) =>
            attrsMap[attr.slug].options.add(o)
          );
        });
      });

      return Object.entries(attrsMap).map(([slug, { name, options }]) => ({
        id: 0, // opcional, si no tienes el ID local
        slug,
        name, // aquí sí usamos el nombre real
        options: Array.from(options),
      }));
    };

    fetchAttributesForCategory(selectedSubCat ?? mainCategoryId).then((data) =>
      setAttributes(data)
    );
  }, [mainCategoryId, selectedSubCat, products]);

  const toggleAttribute = (attrSlug: string, option: string) => {
    setProducts([]);
    setPage(1);
    setHasMore(true);

    setSelectedAttributes((prev) => {
      const current = prev[attrSlug];
      if (current === option) {
        const copy = { ...prev };
        delete copy[attrSlug];
        return copy;
      } else {
        return { ...prev, [attrSlug]: option };
      }
    });
  };

  // ------------------------------
  // CATEGORY / PRODUCT FUNCTIONS
  // ------------------------------
  const selectCategory = (cat: Category | null) => {
    setProducts([]);
    setPage(1);
    setHasMore(true);

    if (!cat) {
      setSelectedSubCat(null);
      navigate(`/categoria/${mainCategory?.slug}`);
    } else if (cat.parent) {
      setSelectedSubCat(cat.id);
      navigate(`/categoria/${cat.slug}`);
    } else {
      setSelectedSubCat(null);
      navigate(`/categoria/${cat.slug}`);
    }
  };

  const fetchProducts = async (pageNum: number) => {
    if (!mainCategoryId) return [];

    const categoryParam = selectedSubCat ?? mainCategoryId;
    const params: Record<string, string> = {
      per_page: PAGE_SIZE.toString(),
      page: pageNum.toString(),
      category: categoryParam.toString(),
      attributes: JSON.stringify(selectedAttributes),
    };

    const url = `http://localhost:4000/wc/products?${new URLSearchParams(
      params
    )}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Error cargando productos");

    return (await res.json()) as Product[];
  };

  const loadMore = async () => {
    const newProducts = await fetchProducts(page);
    setProducts((prev) => [...prev, ...newProducts]);

    if (newProducts.length < PAGE_SIZE) {
      setHasMore(false);
    } else {
      setPage((p) => p + 1);
    }
  };

  useEffect(() => {
    if (mainCategoryId) {
      setProducts([]);
      setPage(1);
      setHasMore(true);
      setLoading(true);

      fetchProducts(1).then((data) => {
        setProducts(data);
        setLoading(false);
        if (data.length < PAGE_SIZE) setHasMore(false);
      });
    }
  }, [mainCategoryId, selectedSubCat, selectedAttributes]);

  // ------------------------------
  // RENDER
  // ------------------------------
  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="flex gap-6">
        {/* Sidebar categorías + atributos */}
        <aside
          className={`
    fixed top-0 left-0 h-full w-64 bg-white z-50 p-4 overflow-auto shadow-md
    transform transition-transform duration-300
    ${showSidebar ? "translate-x-0" : "-translate-x-full"} 
    md:relative md:translate-x-0 md:w-1/4
  `}
        >
          <div className="flex flex-col space-y-2">
            <button
              className={`px-3 py-1 rounded text-sm ${
                selectedSubCat === null ? "bg-orange-200" : "bg-gray-100"
              }`}
              onClick={() => selectCategory(null)}
            >
              Todos
            </button>

            {subCategories.map((sub) => (
              <button
                key={sub.id}
                className={`px-3 py-1 rounded text-sm ${
                  selectedSubCat === sub.id ? "bg-orange-200" : "bg-gray-100"
                }`}
                onClick={() => selectCategory(sub)}
              >
                {sub.name}
              </button>
            ))}
          </div>

          {/* ATRIBUTOS */}
          {attributes.map((attr) => (
            <div key={attr.slug} className="mt-4">
              <h3 className="font-semibold">{attr.name}</h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {attr.options.map((option) => (
                  <button
                    key={option}
                    className={`px-2 py-1 text-sm rounded ${
                      selectedAttributes[attr.slug] === option
                        ? "bg-orange-300"
                        : "bg-gray-100"
                    }`}
                    onClick={() => toggleAttribute(attr.slug, option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </aside>

        {/* Productos con InfiniteScroll */}
        <main className="w-full md:w-3/4 md:ml-1/4">
          {loading && products.length === 0 && (
            <div className="flex justify-center items-center py-10">
              <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
            </div>
          )}
          {/* Botón Filtros para móviles */}
          <div className="flex justify-end mb-4 md:hidden">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="px-4 py-2 bg-orange-200 text-black rounded"
            >
              Filtros
            </button>
          </div>
          <InfiniteScroll
            dataLength={products.length}
            next={loadMore}
            hasMore={hasMore}
            loader={<p className="text-center mt-4">Cargando más...</p>}
            endMessage={
              <p className="text-center mt-4 text-gray-500">
                No hay más productos
              </p>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
              {products.map((product) => (
                <Link to={`/producto/${product.id}`} key={product.id}>
                  <div className="p-2 rounded shadow-sm">
                    <div
                      className="relative border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-3 text-center lg:h-40 h-80 flex flex-col"
                      style={{
                        backgroundImage: `url(${
                          product.images?.[0]?.src || "/placeholder.png"
                        })`,
                        minHeight: "10rem",
                        backgroundSize: "contain",
                        backgroundRepeat: "no-repeat",
                        backgroundOrigin: "center",
                        backgroundPosition: "center",
                      }}
                    >
                      {product.price && (
                        <span className="absolute -top-4 right-0 z-50 bg-orange-200 text-black flex items-center justify-center rounded-full w-10 h-10 shadow-md">
                          ${product.price}
                        </span>
                      )}
                      <h2 className="absolute bottom-0 right-0 mt-2 text-sm text-stone-900 font-light font-serif bg-gradient-to-r from-orange-300 to-transparent">
                        {product.name}
                      </h2>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </InfiniteScroll>
        </main>
      </div>
    </div>
  );
};

export default CategoryPage;
