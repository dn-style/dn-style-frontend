import React from "react";

const TermsPage = () => {
  return (
    <div className="bg-white min-h-screen py-16 px-4">
      <div className="max-w-4xl mx-auto prose prose-blue text-gray-600">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center">Términos y Condiciones</h1>
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">1. Aceptación de Términos</h2>
          <p>Al acceder y utilizar el sitio web de DN STYLE, usted acepta estar sujeto a los términos y condiciones aquí descritos. Si no está de acuerdo con alguna parte, por favor no utilice el sitio.</p>
        </section>
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">2. Propiedad Intelectual</h2>
          <p>Todo el contenido, incluyendo logos, diseños, textos e imágenes, son propiedad exclusiva de DN STYLE o sus licenciantes.</p>
        </section>
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">3. Políticas de Venta</h2>
          <p>Los precios están sujetos a cambios sin previo aviso. DN STYLE se reserva el derecho de cancelar órdenes por errores de stock o técnicos.</p>
        </section>
      </div>
    </div>
  );
};

export default TermsPage;
