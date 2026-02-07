const AboutPage = () => {
  return (
    <div className="bg-white  min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900  mb-6">Sobre DN Style</h1>
        <p className="text-xl text-gray-600  mb-12 leading-relaxed">
          Somos más que una tienda online. Somos una experiencia curada para aquellos que buscan calidad, estilo y distinción en cada detalle de su vida.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
        <div className="rounded-2xl overflow-hidden shadow-2xl transform hover:scale-[1.02] transition-transform duration-500">
           <img 
             src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" 
             alt="Nuestro equipo" 
             className="w-full h-full object-cover"
           />
        </div>
        <div className="space-y-6">
           <h2 className="text-3xl font-bold text-gray-900 ">Nuestra Misión</h2>
           <p className="text-gray-600  text-lg">
             Conectar a nuestros clientes con productos excepcionales, desde las fragancias más exclusivas hasta la última tecnología, garantizando siempre autenticidad y un servicio impecable.
           </p>
           <ul className="space-y-4">
             <li className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
               </div>
               <span className="font-medium text-gray-800 ">Productos 100% Originales</span>
             </li>
             <li className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               </div>
               <span className="font-medium text-gray-800 ">Envíos en 24/48 horas</span>
             </li>
           </ul>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
