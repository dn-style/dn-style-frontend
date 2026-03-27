const PrivacyPage = () => {
  return (
    <div className="bg-white min-h-screen py-16 px-4">
      <div className="max-w-4xl mx-auto prose prose-blue text-gray-600">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center">Polticas de Privacidad</h1>
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">1. Recoleccin de Informacin</h2>
          <p>Recopilamos informacin personal bsica como nombre, correo electrnico y direccin para procesar sus pedidos y mejorar su experiencia de compra.</p>
        </section>
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">2. Uso de Datos</h2>
          <p>Sus datos son utilizados exclusivamente para el envo de productos y comunicaciones relacionadas con su compra. No compartimos informacin con terceros sin su consentimiento.</p>
        </section>
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">3. Seguridad</h2>
          <p>Implementamos medidas de seguridad SSL para proteger sus transacciones y datos personales durante la navegacin en nuestro sitio.</p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPage;
