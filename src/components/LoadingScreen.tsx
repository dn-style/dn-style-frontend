import React from "react";

const LoadingScreen: React.FC = () => {
  const apiUrl = import.meta.env.VITE_API_URL || "";

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white">
      <div className="relative">
        {/* Logo con efecto de pulso */}
        <div className="relative z-10 animate-pulse">
          <img
            src={`${apiUrl}/wp-content/uploads/2025/08/390a25d5-d704-4638-8371-7745f58f5b28.svg`}
            alt="Loading..."
            className="h-24 w-auto"
          />
        </div>
        
        {/* Spinner animado alrededor del logo (opcional, decorativo) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-4 border-pink-100 border-t-pink-500 rounded-full animate-spin"></div>
      </div>
      
      {/* Texto de carga */}
      <div className="mt-8 flex flex-col items-center">
        <p className="text-sm font-black tracking-[0.3em] uppercase text-slate-900 animate-bounce">
          DN Style
        </p>
        <div className="mt-2 w-48 h-1 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-pink-500 to-rose-600 animate-progress origin-left"></div>
        </div>
      </div>

      <style>{`
        @keyframes progress {
          0% { transform: scaleX(0); }
          50% { transform: scaleX(0.7); }
          100% { transform: scaleX(1); }
        }
        .animate-progress {
          animation: progress 2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
