import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle } from "lucide-react";
import { useUserStore } from "../store/userStore";
import { toast } from "react-toastify";

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const { login } = useUserStore();

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }

    const apiUrl = import.meta.env.VITE_API_URL || "";
    fetch(`${apiUrl}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    })
    .then(async res => {
      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        
        if (data.autoLogin && data.token && data.user) {
           // Autologin exitoso
           login({
             id: data.user.id,
             email: data.user.email,
             first_name: data.user.first_name,
             last_name: data.user.last_name,
             billing: {} as any,
             shipping: {} as any
           }, data.token);
           
           toast.success("¡Cuenta verificada! Redirigiendo...");
           setTimeout(() => navigate('/account'), 2000);
        }
      } else {
        throw new Error();
      }
    })
    .catch(() => setStatus('error'));
  }, [token, login, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <div className="max-w-md w-full text-center">
        {status === 'loading' && (
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="font-bold text-gray-500 uppercase tracking-widest">Verificando...</p>
          </div>
        )}
        
        {status === 'success' && (
          <div className="animate-in fade-in zoom-in">
            <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} />
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tight mb-4">¡Cuenta Verificada!</h1>
            <p className="text-gray-500 mb-8">Gracias por confirmar tu email. Ya puedes acceder a tu cuenta.</p>
            <button 
              onClick={() => navigate('/account')}
              className="w-full bg-black text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl"
            >
              Iniciar Sesión
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="animate-in shake">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle size={40} />
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tight mb-4">Enlace Inválido</h1>
            <p className="text-gray-500 mb-8">El enlace de verificación ha expirado o no es válido.</p>
            <button 
              onClick={() => navigate('/account')}
              className="w-full bg-gray-100 text-gray-900 py-4 rounded-2xl font-black uppercase text-xs tracking-widest"
            >
              Volver
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
