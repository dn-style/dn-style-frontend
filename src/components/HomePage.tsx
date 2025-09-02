import HeroSection from "./HeroSection";
import Divitions from "./Divitions";
import { useCategoriesStore } from "../store/categoriesStore";

const HomePage = () => {
  const slugToId = useCategoriesStore((state) => state.slugToId);

  // Si los IDs aún no están cargados, mostramos loader simple
  const allIdsReady =
    slugToId["perfumes"] && slugToId["electronica"] && slugToId["iphone"];

  if (!allIdsReady) {
    return <p>Cargando categorías...</p>;
  }

  return (
    <>
      <div className="grid lg:grid-cols-2 grid-cols-1 gap-5 lg:w-3/4 lg:mx-auto">
        <div className="flex flex-col">
          {slugToId["perfumes"] && (
            <>
              <HeroSection
                title="Perfumes"
                subtitle="Las más exquisitas Fragancias"
                backgroundImage="https://fotografias.larazon.es/clipping/cmsimages02/2021/11/21/2633ECE9-F91A-4734-8A8E-E77EFD5B1B02/98.jpg?crop=5184,2917,x0,y270&width=1900&height=1069&optimize=low&format=webply"
                slug="perfumes"
              />
              <Divitions categoryId={slugToId["perfumes"]} />
            </>
          )}
        </div>
        <div className="flex flex-col">
          {slugToId["electronica"] && (
            <>
              <HeroSection
                title="Electronica"
                subtitle="Los mejores dispositivos electrónicos"
                backgroundImage="https://cdn.agenciasinc.es/var/ezwebin_site/storage/images/_aliases/img_1col/noticias/circuitos-termicos-de-precision-micrometrica-para-prevenir-el-sobrecalentamiento-en-dispositivos-electronicos/12205067-3-esl-MX/Circuitos-termicos-de-precision-micrometrica-para-prevenir-el-sobrecalentamiento-en-dispositivos-electronicos.jpg"
                slug="electronica"
              />
              <Divitions categoryId={slugToId["electronica"]} />
            </>
          )}
        </div>
        <div className="flex flex-col">
          {slugToId["iphone"] && (
            <>
              <HeroSection
                title="Iphone"
                subtitle="Iphone y accesorios"
                backgroundImage="https://media.revistagq.com/photos/66d83382ef1f8fee378c5e57/16:9/w_1920,c_limit/iphone%2016-pro-colores.jpg"
                slug="iphone"
              />
              <Divitions categoryId={slugToId["iphone"]} />
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default HomePage;
