import React from "react";
import { Link } from "react-router-dom";
import { HelpCircle, FileText, Lock, Truck, MessageCircle } from "lucide-react";

const supportOptions = [
  { title: "Preguntas Frecuentes", icon: <HelpCircle />, link: "/faq", desc: "Respuestas rápidas a tus dudas." },
  { title: "Seguimiento de Pedido", icon: <Truck />, link: "/tracking", desc: "¿Dónde está mi compra?" },
  { title: "Políticas de Privacidad", icon: <Lock />, link: "/privacy", desc: "Cómo cuidamos tus datos." },
  { title: "Términos y Condiciones", icon: <FileText />, link: "/terms", desc: "Reglas de uso del sitio." },
];

const SupportPage = () => {
  return (
    <div className="bg-white min-h-screen py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Centro de Asistencia</h1>
          <p className="text-xl text-gray-500">¿Cómo podemos ayudarte hoy?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {supportOptions.map((opt, index) => (
            <Link key={index} to={opt.link} className="flex items-center gap-6 p-6 border border-gray-100 rounded-2xl hover:border-blue-200 hover:shadow-lg transition-all group">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                {opt.icon}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{opt.title}</h3>
                <p className="text-gray-500 text-sm">{opt.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="bg-blue-600 rounded-3xl p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-2xl font-bold mb-2">¿Prefieres hablar con nosotros?</h2>
            <p className="opacity-90">Nuestro equipo está disponible por WhatsApp de Lunes a Viernes de 9 a 18 hs.</p>
          </div>
          <button className="bg-white text-blue-600 font-bold py-4 px-8 rounded-full flex items-center gap-2 hover:bg-gray-100 transition-colors">
            <MessageCircle size={20} />
            Escribir por WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupportPage;
