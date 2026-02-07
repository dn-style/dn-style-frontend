import { useState } from "react";

const AccountPage = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 ">
      <div className="max-w-md w-full space-y-8 bg-white  p-8 rounded-2xl shadow-xl border border-gray-100 ">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 ">
            Mi Cuenta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 ">
            Accede a tu historial de pedidos y detalles.
          </p>
        </div>
        
        <div className="flex border-b border-gray-200 ">
          <button
            className={`flex-1 py-4 text-center font-medium transition-colors ${activeTab === 'login' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('login')}
          >
            Iniciar Sesión
          </button>
          <button
            className={`flex-1 py-4 text-center font-medium transition-colors ${activeTab === 'register' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('register')}
          >
            Registrarse
          </button>
        </div>

        {activeTab === 'login' ? (
          <form className="mt-8 space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email-address" className="sr-only">Email</label>
                <input id="email-address" name="email" type="email" required className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" placeholder="Correo electrónico" />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">Contraseña</label>
                <input id="password" name="password" type="password" required className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" placeholder="Contraseña" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 ">Recordarme</label>
              </div>
              <div className="text-sm">
                <a href="#" className="font-medium text-blue-600 hover:text-blue-500">¿Olvidaste tu contraseña?</a>
              </div>
            </div>

            <div>
              <button type="submit" className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Entrar
              </button>
            </div>
            <p className="text-xs text-center text-gray-500 mt-4">
               * Nota: La autenticación completa de clientes requiere configuración avanzada de JWT en el backend.
            </p>
          </form>
        ) : (
          <div className="mt-8 text-center text-gray-600">
             <p className="mb-4">El registro de usuarios está habilitado durante el checkout.</p>
             <button onClick={() => setActiveTab('login')} className="text-blue-600 font-medium hover:underline">Volver a Login</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountPage;
