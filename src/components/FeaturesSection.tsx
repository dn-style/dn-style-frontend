import React from "react";

const features = [
  {
    icon: (
      <svg className="w-8 h-8 text-blue-600 " fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
      </svg>
    ),
    title: "Calidad Garantizada",
    description: "Productos seleccionados de las mejores marcas.",
  },
  {
    icon: (
      <svg className="w-8 h-8 text-blue-600 " fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Envío Rápido",
    description: "Recibe tu pedido en tiempo récord.",
  },
  {
    icon: (
      <svg className="w-8 h-8 text-blue-600 " fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    title: "Pago Seguro",
    description: "Transacciones protegidas y encriptadas.",
  },
  {
    icon: (
      <svg className="w-8 h-8 text-blue-600 " fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    title: "Soporte 24/7",
    description: "Estamos aquí para ayudarte en todo momento.",
  },
];

const FeaturesSection = () => {
  return (
    <div className="py-12 bg-gray-50  border-y border-gray-100 ">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <div key={index} className="flex flex-col items-center text-center p-4 hover:bg-white  rounded-lg transition-colors duration-200">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-50  mb-4">
                {feature.icon}
              </div>
              <h3 className="text-lg font-medium text-gray-900 ">{feature.title}</h3>
              <p className="mt-2 text-sm text-gray-500 ">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeaturesSection;
