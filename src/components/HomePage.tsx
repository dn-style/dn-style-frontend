import HeroSection from "./HeroSection";
import Divitions from "./Divitions";
import FeaturesSection from "./FeaturesSection";
import { useCategoriesStore } from "../store/categoriesStore";
import SEO from "./SEO";

const HomePage = () => {
  const apiUrl = import.meta.env.VITE_API_URL || "";
  const slugToId = useCategoriesStore((state) => state.slugToId);
  const categories = useCategoriesStore((state) => state.categories);

  // Solo bloqueamos si no hay categorías cargadas aún Y el store está vacío
  // Esto previene el parpadeo pero permite mostrar la página si las categorías fallan o están vacías
  const isInitializing = categories.length === 0;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "url": "https://test.system4us.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://test.system4us.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <div className="bg-white min-h-screen">
      <SEO 
        title="Inicio"
        description="DN Style Store - Fragancias Premium, lo último en Electrónica y Tecnología Apple. Envíos a todo el país desde Brandsen."
        structuredData={structuredData}
      />
      
      {/* SECCIÓN 1: Hero Principal (Fragancias) */}
      <section className="relative">
        <HeroSection
          title="Compra tus airpod pro 2 y participa por tu IPHONE 15 sellado!"
          subtitle=""
          backgroundImage={`${apiUrl}/wp-content/uploads/2026/03/3_50.png`}
          backgroundImageMobile={`${apiUrl}/wp-content/uploads/2026/03/Gemini_Generated_Image_uw8l8uw8l8uw8l8u_401x760.png`}
          slug="promo-airpods"
          align="left"
        />
      </section>

      {/* SECCIÓN 2: Barra de Beneficios/Confianza */}
      <FeaturesSection />

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

      {/* SECCIÓN 4: Hero Secundario (Electrónica) */}
      <section className="relative mt-12">
         <HeroSection
              title="Innovación Digital"
              subtitle="Tecnología que transforma tu día a día."
              backgroundImage="https://cdn.agenciasinc.es/var/ezwebin_site/storage/images/_aliases/img_1col/noticias/circuitos-termicos-de-precision-micrometrica-para-prevenir-el-sobrecalentamiento-en-dispositivos-electronicos/12205067-3-esl-MX/Circuitos-termicos-de-precision-micrometrica-para-prevenir-el-sobrecalentamiento-en-dispositivos-electronicos.jpg"
              slug="electronica"
              align="center"
            />
      </section>

      {/* SECCIÓN 5: Vitrina de Electrónica */}
      {slugToId["electronica"] ? (
         <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 bg-gray-50">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Gadgets Recomendados</h2>
            <a href="/categoria/electronica" className="text-blue-600 font-semibold hover:underline">Ver todo &rarr;</a>
          </div>
          <Divitions categoryId={slugToId["electronica"]} />
        </section>
      ) : null}

       {/* SECCIÓN 6: Colección iPhone */}
       <section className="relative mt-12">
          <HeroSection
            title="Universo Apple"
            subtitle="iPhone y el ecosistema perfecto."
            backgroundImage="https://media.revistagq.com/photos/66d83382ef1f8fee378c5e57/16:9/w_1920,c_limit/iphone%2016-pro-colores.jpg"
            slug="iphone"
            align="right"
          />
        </section>

        {/* SECCIÓN 7: Vitrina de iPhone */}
        {slugToId["iphone"] && (
          <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Accesorios & Dispositivos</h2>
              <a href="/categoria/iphone" className="text-blue-600 font-semibold hover:underline">Ver todo &rarr;</a>
            </div>
            <Divitions categoryId={slugToId["iphone"]} />
          </section>
        )}
    </div>
  );
};

export default HomePage;
