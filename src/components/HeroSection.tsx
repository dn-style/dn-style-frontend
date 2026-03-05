import { Link } from "react-router-dom";

interface HeroSectionProps {
  title: string;
  subtitle: string;
  backgroundImage: string;
  backgroundImageMobile?: string;
  slug: string;
  align?: "left" | "center" | "right";
}

const HeroSection: React.FC<HeroSectionProps> = ({
  title,
  subtitle,
  backgroundImage,
  backgroundImageMobile,
  slug,
  align = "left",
}) => {
  const alignmentClasses = {
    left: "items-start text-left",
    center: "items-center text-center",
    right: "items-end text-right",
  };

  return (
    <div className="group relative w-full h-[calc(100dvh-104px)] md:h-[calc(100dvh-176px)] min-h-[500px] overflow-hidden">
      {/* Background Image with Zoom Effect */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <picture>
          {backgroundImageMobile && (
            <source media="(max-width: 768px)" srcSet={backgroundImageMobile} />
          )}
          <img 
            src={backgroundImage} 
            alt={title}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
            loading="eager" 
          />
        </picture>
        {/* Dynamic Gradient for better contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent md:bg-gradient-to-r md:from-black/70 md:to-transparent transition-opacity duration-500"></div>
      </div>

      {/* Content Container */}
      <div className="relative z-10 h-full w-full max-w-[1440px] mx-auto px-6 md:px-12 flex flex-col justify-end md:justify-center pb-20 md:pb-0">
        <div className={`flex flex-col w-full ${alignmentClasses[align]}`}>
          {title && (
            <h1 className="text-2xl sm:text-3xl md:text-6xl font-black text-white mb-6 drop-shadow-2xl max-w-[300px] sm:max-w-md md:max-w-3xl leading-[1.2] tracking-tight uppercase">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="text-base md:text-2xl text-gray-200 mb-8 max-w-xl font-medium drop-shadow-md">
              {subtitle}
            </p>
          )}
          
          <div className="flex w-full md:w-auto">
            <Link 
              to={`/promo/${slug}`} 
              className="w-full md:w-auto inline-flex items-center justify-center px-8 md:px-10 py-4 md:py-5 text-xs md:text-base font-black uppercase tracking-widest text-gray-900 transition-all duration-300 bg-white border-2 border-white rounded-full hover:bg-transparent hover:text-white focus:outline-none transform hover:-translate-y-1 shadow-2xl active:scale-95"
            >
              Quiero mis airpods
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
