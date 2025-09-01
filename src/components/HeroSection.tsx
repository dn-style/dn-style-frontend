import { Link } from "react-router-dom";
interface HeroSectionProps {
  title: string;
  subtitle: string;
  backgroundImage: string;
}

const HeroSection: React.FC<HeroSectionProps> = ({
  title,
  subtitle,
  backgroundImage,
}) => {
  return (
    <div className="w-full relative h-[400px] overflow-hidden shadow-2xl z-0">
      {/* Imagen de fondo */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${backgroundImage}')` }}
      ></div>

      {/* Contenido del hero */}
      <div className="relative z-10 flex flex-col justify-center h-full max-w-7xl mx-auto px-4 ">
        <div className="bg-gradient-to-r from-gray-700/80 to-transparent ">
          <h1 className="text-white text-5xl md:text-6xl font-bold leading-tight mb-2">
            {title}
          </h1>
          <h2 className="text-white text-xl md:text-2xl font-medium">
            {subtitle}
          </h2>
        </div>
      </div>

      {/* Enlace click al hero */}
      <Link to="/perfumes-arabes" className="absolute inset-0 z-20"></Link>
    </div>
  );
};

export default HeroSection;
