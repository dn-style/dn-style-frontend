import HeroSection from "./HeroSection";
import Divitions from "./Divitions";
import FeaturesSection from "./FeaturesSection";
import { useCategoriesStore } from "../store/categoriesStore";

const HomePage = () => {
  const slugToId = useCategoriesStore((state) => state.slugToId);
  const categories = useCategoriesStore((state) => state.categories);

  // Solo bloqueamos si no hay categorías cargadas aún Y el store está vacío
  // Esto previene el parpadeo pero permite mostrar la página si las categorías fallan o están vacías
  const isInitializing = categories.length === 0;

  // Si queremos mostrar un esqueleto mientras carga el primer fetch
  // Pero si ya hay categorías (aunque no sean las hardcodeadas), renderizamos
  if (isInitializing && Object.keys(slugToId).length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium font-sans">DN Style Store</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      
      {/* SECCIÓN 1: Hero Principal (Fragancias) */}
      <section className="relative">
        <HeroSection
          title="Esencia & Elegancia"
          subtitle="Descubre las fragancias que definen tu estilo personal."
          backgroundImage="https://fotografias.larazon.es/clipping/cmsimages02/2021/11/21/2633ECE9-F91A-4734-8A8E-E77EFD5B1B02/98.jpg?crop=5184,2917,x0,y270&width=1900&height=1069&optimize=low&format=webply"
          slug="fragancias"
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
      ) : (
        <div className="py-12 text-center text-gray-400 text-sm italic">
          Crea la categoría "fragancias" en WooCommerce para ver esta sección.
        </div>
      )}

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
