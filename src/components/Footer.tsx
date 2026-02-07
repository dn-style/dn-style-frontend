import React from "react";
import { Link } from "react-router-dom";
import { Instagram, Facebook, Twitter, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        
        {/* Columna 1: Marca y Redes */}
        <div className="space-y-6">
          <Link to="/" className="inline-block">
             <span className="text-2xl font-bold text-white tracking-tight">DN STYLE</span>
          </Link>
          <p className="text-sm leading-relaxed">
            Tu destino premium para fragancias exclusivas y la última tecnología. Elevamos tu estilo personal con productos seleccionados.
          </p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition-colors"><Instagram size={20} /></a>
            <a href="#" className="hover:text-white transition-colors"><Facebook size={20} /></a>
            <a href="#" className="hover:text-white transition-colors"><Twitter size={20} /></a>
          </div>
        </div>

        {/* Columna 2: Mapa del Sitio */}
        <div>
          <h3 className="text-white font-bold mb-6 uppercase text-sm tracking-widest">Navegación</h3>
          <ul className="space-y-4 text-sm">
            <li><Link to="/" className="hover:text-white transition-colors">Inicio</Link></li>
            <li><Link to="/categoria/perfumes" className="hover:text-white transition-colors">Perfumes</Link></li>
            <li><Link to="/categoria/electronica" className="hover:text-white transition-colors">Electrónica</Link></li>
            <li><Link to="/about" className="hover:text-white transition-colors">Nosotros</Link></li>
            <li><Link to="/account" className="hover:text-white transition-colors">Mi Cuenta</Link></li>
          </ul>
        </div>

        {/* Columna 3: Legal y Ayuda */}
        <div>
          <h3 className="text-white font-bold mb-6 uppercase text-sm tracking-widest">Asistencia</h3>
          <ul className="space-y-4 text-sm">
            <li><Link to="/faq" className="hover:text-white transition-colors">Preguntas Frecuentes</Link></li>
            <li><Link to="/terms" className="hover:text-white transition-colors">Términos y Condiciones</Link></li>
            <li><Link to="/privacy" className="hover:text-white transition-colors">Políticas de Privacidad</Link></li>
            <li><Link to="/tracking" className="hover:text-white transition-colors">Seguimiento de Pedido</Link></li>
          </ul>
        </div>

        {/* Columna 4: Contacto */}
        <div>
          <h3 className="text-white font-bold mb-6 uppercase text-sm tracking-widest">Contacto</h3>
          <ul className="space-y-4 text-sm">
            <li className="flex items-start gap-3">
              <MapPin size={18} className="text-blue-500 shrink-0" />
              <span>Av. Libertador 1234, CABA, Argentina</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone size={18} className="text-blue-500 shrink-0" />
              <span>+54 11 1234-5678</span>
            </li>
            <li className="flex items-center gap-3">
              <Mail size={18} className="text-blue-500 shrink-0" />
              <span>hola@dnstyle.com.ar</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-gray-800 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs uppercase tracking-tighter">
        <p>© 2026 DN STYLE. TODOS LOS DERECHOS RESERVADOS.</p>
        <div className="flex gap-6">
           <span>Fabricado en Buenos Aires 🇦🇷</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
