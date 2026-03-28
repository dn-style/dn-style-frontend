import React from "react";
import SEO from "./SEO";

const ShippingPolicyPage = () => {
  return (
    <div className="bg-white min-h-screen py-16 px-4">
      <SEO 
        title="Políticas de Envío" 
        description="Conoce nuestras políticas de envío y garantías para equipos sellados, seminuevos, electrodomésticos y fragancias."
      />
      <div className="max-w-4xl mx-auto prose prose-blue text-gray-600">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-12 text-center uppercase tracking-tighter italic">Políticas de Envío y Garantía</h1>

        {/* EQUIPOS SELLADOS */}
        <section className="mb-12 bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl"></span>
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight m-0">Equipos Sellados</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">1. Consulta de disponibilidad</h3>
              <p>Todos los equipos sellados estn sujetos a disponibilidad de stock y color. Antes o despus de realizar la compra, el cliente deber comunicarse va WhatsApp oficial para confirmar: color disponible, tiempo estimado de despacho y modalidad de entrega. La confirmacin final de envo se realiza nicamente una vez validada la disponibilidad.</p>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">2. Plazos de despacho</h3>
              <ul className="list-none p-0 space-y-2">
                <li className="flex gap-2"><strong> Antes de las 13:00 hs:</strong> Despacho al da hbil siguiente por la maana.</li>
                <li className="flex gap-2"><strong> Despus de las 13:00 hs:</strong> Despacho a las 48 horas hbiles por la maana.</li>
              </ul>
              <div className="mt-4 bg-white p-4 rounded-xl text-sm italic border border-gray-100">
                <p className="m-0">Ejemplo: Compra lunes 12:30  se enva martes maana. / Compra lunes 15:00  se enva mircoles maana.</p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">3. Consideraciones importantes</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>El despacho comienza a contarse una vez acreditado el pago.</li>
                <li>Los plazos pueden extenderse en das no hbiles o alta demanda.</li>
                <li>En caso de no haber disponibilidad inmediata, se ofrecer alternativa o reprogramacin.</li>
              </ul>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">4. Garanta oficial</h3>
              <p>Cuentan con <strong>garanta oficial del fabricante (1 ao)</strong>, gestionada directamente por la marca. DN Shop no interviene en la garanta oficial.</p>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">5. Accesorios incluidos (Seminuevos)</h3>
              <p>Incluyen: Funda protectora, vidrio templado y cable de carga. Cargador original opcional por USD 30.</p>
            </div>
          </div>
        </section>

        {/* EQUIPOS SEMINUEVOS */}
        <section className="mb-12 bg-blue-50/30 p-8 rounded-[2.5rem] border border-blue-100">
          <div className="flex items-center gap-3 mb-6 text-blue-900">
            <span className="text-2xl"></span>
            <h2 className="text-2xl font-black uppercase tracking-tight m-0">Equipos Seminuevos</h2>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">1. Plazos de despacho</h3>
              <ul className="list-none p-0 space-y-2">
                <li className="flex gap-2"><strong> Antes de las 14:00 hs:</strong> Despacho el mismo da o al da hbil siguiente.</li>
                <li className="flex gap-2"><strong> Despus de las 14:00 hs:</strong> Despacho al da hbil siguiente maana.</li>
              </ul>
            </div>

            <div className="border-t border-blue-100 pt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">2. Proceso de verificacin</h3>
              <p>Se realiza un <strong>video completo</strong> del equipo funcionando y del proceso de empaquetado (nmero de serie, estado esttico). El paquete se sella en cmara. <strong>El cliente debe grabar un video continuo al recibir y abrir el paquete.</strong></p>
            </div>

            <div className="border-t border-blue-100 pt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">3. Accesorios incluidos</h3>
              <p>Incluyen: Funda protectora, vidrio templado y cable de carga. Cargador original opcional por USD 30.</p>
            </div>

            <div className="border-t border-blue-100 pt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">4. Garanta</h3>
              <p><strong>1 mes de garanta directa con DN Shop</strong>. Condiciones: No haber sido abierto, conservar piezas originales, sin golpes ni humedad, y uso con cargador certificado.</p>
            </div>
          </div>
        </section>

        {/* ELECTRODOMESTICOS */}
        <section className="mb-12 bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl"></span>
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight m-0">Electrodomsticos</h2>
          </div>
          <div className="space-y-4">
            <p><strong>1. Coordinacin:</strong> El cliente debe contactar va WhatsApp para coordinar entrega y cotizar el costo de envo personalizado.</p>
            <p><strong>2. Plazos:</strong> Despacho entre 2 y 4 das hbiles desde la confirmacin del pago.</p>
            <p><strong>3. Garanta:</strong> Garanta oficial del fabricante, gestionada directamente con la marca.</p>
          </div>
        </section>

        {/* FRAGANCIAS */}
        <section className="mb-12 bg-pink-50/20 p-8 rounded-[2.5rem] border border-pink-100">
          <div className="flex items-center gap-3 mb-6 text-pink-900">
            <span className="text-2xl"></span>
            <h2 className="text-2xl font-black uppercase tracking-tight m-0">Fragancias</h2>
          </div>
          <div className="space-y-4">
            <p><strong>Stock:</strong> Disponibilidad inmediata si figura en la web. Para perfumes de nicho no publicados, consultar va WhatsApp.</p>
            <p><strong>Plazos:</strong> Compras antes de las 14hs se despachan el mismo da o da hbil siguiente maana.</p>
          </div>
        </section>

        <section className="mt-16 pt-8 border-t border-gray-200 text-sm text-center font-bold uppercase tracking-widest text-gray-400">
          DN shop - Brandsen, Argentina
        </section>
      </div>
    </div>
  );
};

export default ShippingPolicyPage;
