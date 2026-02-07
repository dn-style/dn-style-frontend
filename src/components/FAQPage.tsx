import React from "react";

const faqs = [
  {
    question: "¿Cuánto tardan los envíos?",
    answer: "Los envíos en CABA y GBA se realizan en un plazo de 24 a 48 horas hábiles. Para el resto del país, el tiempo estimado es de 3 a 7 días hábiles dependiendo de la localidad."
  },
  {
    question: "¿Cuáles son los métodos de pago?",
    answer: "Aceptamos todas las tarjetas de crédito y débito a través de nuestra pasarela segura, así como transferencias bancarias directas."
  },
  {
    question: "¿Los productos son originales?",
    answer: "Absolutamente. Todos nuestros perfumes y productos electrónicos son 100% originales, importados legalmente y cuentan con su respectiva garantía de fábrica."
  },
  {
    question: "¿Cómo realizo un cambio o devolución?",
    answer: "Tienes 30 días para realizar cambios de productos electrónicos (sellados) y perfumes (sin abrir). Contáctanos por WhatsApp para iniciar el proceso."
  }
];

const FAQPage = () => {
  return (
    <div className="bg-white min-h-screen py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center">Preguntas Frecuentes</h1>
        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div key={index} className="border-b border-gray-100 pb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">{faq.question}</h3>
              <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FAQPage;
