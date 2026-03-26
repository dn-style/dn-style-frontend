import React from "react";

const TermsPage = () => {
  return (
    <div className="bg-white min-h-screen py-16 px-4">
      <div className="max-w-4xl mx-auto prose prose-blue text-gray-600">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center">Trminos y Condiciones</h1>
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">1. Aceptacin de Trminos</h2>
          <p>Al acceder y utilizar el sitio web de DN shop, usted acepta estar sujeto a los trminos y condiciones aqu descritos. Si no est de acuerdo con alguna parte, por favor no utilice el sitio.</p>
        </section>
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">2. Propiedad Intelectual</h2>
          <p>Todo el contenido, incluyendo logos, diseos, textos e imgenes, son propiedad exclusiva de DN shop o sus licenciantes.</p>
        </section>
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">3. Polticas de Venta</h2>
          <p>Los precios estn sujetos a cambios sin previo aviso. DN shop se reserva el derecho de cancelar rdenes por errores de stock o tcnicos.</p>
        </section>
      </div>
    </div>
  );
};

export default TermsPage;
