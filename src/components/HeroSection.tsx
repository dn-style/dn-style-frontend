import { Link } from "react-router-dom";

interface HeroSectionProps {
  title: string;
  subtitle: string;
  backgroundImage: string;
  slug: string;
  align?: "left" | "center" | "right";
}

const HeroSection: React.FC<HeroSectionProps> = ({
  title,
  subtitle,
  backgroundImage,
  slug,
  align = "left",
}) => {
  const alignmentClasses = {
    left: "items-start text-left",
    center: "items-center text-center",
    right: "items-end text-right",
  };

  return (
    <div className="group relative w-full h-[500px] lg:h-[600px] overflow-hidden">
      {/* Background Image with Zoom Effect */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
         <img 
            src={backgroundImage} 
            alt={title}
            className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
            loading="eager" // Prioridad alta para el Hero (LCP)
         />
        {/* Dark Overlay for Readability */}
        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors duration-500"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 h-full max-w-7xl mx-auto px-6 sm:px-12 flex flex-col justify-center">
        <div className={`flex flex-col max-w-2xl ${alignmentClasses[align]}`}>
          <span className="inline-block py-1 px-3 mb-4 rounded-full bg-blue-600/90 text-white text-xs font-bold tracking-wider uppercase backdrop-blur-sm">
            Colección Destacada
          </span>
          <h1 className="text-white text-5xl md:text-7xl font-extrabold leading-tight mb-4 drop-shadow-lg">
            {title}
          </h1>
          <p className="text-gray-100 text-lg md:text-xl font-medium mb-8 max-w-lg drop-shadow-md opacity-90">
            {subtitle}
          </p>
          
          <Link 
            to={`/categoria/${slug}`} 
            className="inline-flex items-center justify-center px-8 py-3 text-base font-bold text-gray-900 transition-all duration-200 bg-white border border-transparent rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transform hover:-translate-y-1 shadow-lg"
          >
            Explorar Colección
            <svg className="w-5 h-5 ml-2 -mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
