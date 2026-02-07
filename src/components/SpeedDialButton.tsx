import React, { useState, useEffect } from 'react';
import { MessageCircle, ShoppingCart, X, Send } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { useCartStore } from '../store/cartStore';
import { Link } from 'react-router-dom';

const SpeedDialButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<{ text: string, sender: 'user' | 'agent' }[]>([]);
  const [inputText, setInputText] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  
  const itemsCount = useCartStore((state) => state.itemsCount());
  const whatsappNumber = "5491112345678"; // Reemplazar con número real

  useEffect(() => {
    if (isChatOpen && !socket) {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";
      const newSocket = io(apiUrl);
      
      newSocket.on('connect', () => {
        console.log('Conectado al chat');
        newSocket.emit('join_chat', { name: 'Visitante' });
      });

      newSocket.on('receive_message', (msg) => {
        setMessages((prev) => [...prev, { text: msg.text, sender: 'agent' }]);
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
        setSocket(null);
      };
    }
  }, [isChatOpen]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !socket) return;

    socket.emit('send_message', { text: inputText });
    setMessages((prev) => [...prev, { text: inputText, sender: 'user' }]);
    setInputText('');
  };

  const toggleOpen = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Botón Principal Flotante */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        
        {/* Opciones del Speed Dial */}
        {isOpen && (
          <div className="flex flex-col gap-3 animate-in slide-in-from-bottom-4 fade-in duration-200">
            {/* Botón Carrito (Solo Móvil) */}
            <Link to="/cart" className="md:hidden flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-full shadow-lg font-bold text-xs uppercase tracking-widest hover:bg-gray-50 transition-all">
              <span className="bg-blue-100 px-2 py-0.5 rounded-full">{itemsCount}</span> Carrito <ShoppingCart size={18} />
            </Link>

            {/* Botón WhatsApp */}
            <a 
              href={`https://wa.me/${whatsappNumber}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#25D366] text-white px-4 py-2 rounded-full shadow-lg font-bold text-xs uppercase tracking-widest hover:bg-[#20ba5a] transition-all"
            >
              WhatsApp <MessageCircle size={18} />
            </a>

            {/* Botón Chat en Vivo */}
            <button 
              onClick={() => { setIsChatOpen(true); setIsOpen(false); }}
              className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-full shadow-lg font-bold text-xs uppercase tracking-widest hover:bg-gray-800 transition-all"
            >
              Chat en Vivo <MessageCircle size={18} />
            </button>
          </div>
        )}

        {/* Trigger Button */}
        <button
          onClick={toggleOpen}
          className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 ${isOpen ? 'bg-gray-200 text-gray-600 rotate-45' : 'bg-black text-white hover:scale-110'}`}
        >
          {isOpen ? <X size={24} /> : <MessageCircle size={28} />}
        </button>
      </div>

      {/* Ventana de Chat */}
      {isChatOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 md:w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 fade-in duration-300 h-[500px]">
          {/* Header Chat */}
          <div className="bg-black text-white p-4 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-sm">Soporte DN Style</h3>
              <p className="text-[10px] text-gray-400 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> En línea
              </p>
            </div>
            <button onClick={() => setIsChatOpen(false)} className="hover:text-gray-300">
              <X size={18} />
            </button>
          </div>

          {/* Área de Mensajes */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-3">
            {messages.map((msg, idx) => (
              <div key={idx} className={`max-w-[80%] p-3 rounded-2xl text-xs font-medium ${msg.sender === 'user' ? 'bg-blue-600 text-white self-end rounded-br-none' : 'bg-white text-gray-700 self-start rounded-bl-none shadow-sm'}`}>
                {msg.text}
              </div>
            ))}
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100 flex gap-2">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Escribe tu mensaje..."
              className="flex-1 bg-gray-100 border-0 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-black"
            />
            <button type="submit" className="p-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors">
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default SpeedDialButton;
