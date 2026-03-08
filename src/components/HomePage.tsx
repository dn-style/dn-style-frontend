import HeroSection from "./HeroSection";
import Divitions from "./Divitions";
import FeaturesSection from "./FeaturesSection";
import { useCategoriesStore } from "../store/categoriesStore";
import SEO from "./SEO";

const HomePage = () => {
  const apiUrl = import.meta.env.VITE_API_URL || "";
  const slugToId = useCategoriesStore((state) => state.slugToId);

  // Solo bloqueamos si no hay categorías cargadas aún Y el store está vacío
  // Esto previene el parpadeo pero permite mostrar la página si las categorías fallan o están vacías
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "url": "https://dnshop.com.ar",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://dnshop.com.ar/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <div className="bg-white min-h-screen">
      <SEO 
        title="Inicio"
        description="DN shop Store - Fragancias Premium, lo último en Electrónica y Tecnología Apple. Envíos a todo el país desde Brandsen."
        structuredData={structuredData}
      />
      
      {/* SECCIÓN 1: Hero Principal (Fragancias) */}
      <section className="relative">
        <HeroSection
          title="Compra tus airpod pro 2 y participa por tu IPHONE 15 sellado!"
          subtitle=""
          backgroundImage={`${apiUrl}/wp-content/uploads/2026/03/3_50.png`}
          backgroundImageMobile={`${apiUrl}/wp-content/uploads/2026/03/Gemini_Generated_Image_kuj0hnkuj0hnkuj0-4.jpg`}
          slug="promo-airpods"
          align="left"
        />
      </section>

      {/* SECCIÓN 3: Vitrina de Fragancias */}
      {slugToId["fragancias"] ? (
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Tendencias en Fragancias</h2>
            <a href="/categoria/fragancias" className="text-blue-600 font-semibold hover:underline">Ver todo &rarr;</a>
          </div>
          <Divitions categoryId={slugToId["fragancias"]} />
        </section>
      ) : null}

      {/* SECCIÓN 4: Vitrina de Apple */}
      {slugToId["apple"] ? (
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Lo mejor de Apple</h2>
            <a href="/categoria/apple" className="text-blue-600 font-semibold hover:underline">Ver todo &rarr;</a>
          </div>
          <Divitions categoryId={slugToId["apple"]} />
        </section>
      ) : null}

      {/* SECCIÓN 5: Vitrina de Electrónica */}
      {slugToId["electronica"] ? (
         <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 bg-gray-50">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Tendencias en Electrónica</h2>
            <a href="/categoria/electronica" className="text-blue-600 font-semibold hover:underline">Ver todo &rarr;</a>
          </div>
          <Divitions categoryId={slugToId["electronica"]} />
        </section>
      ) : null}
      {/* SECCIÓN 2: Barra de Beneficios/Confianza */}
      <FeaturesSection />
    </div>
  );
};

export default HomePage;
