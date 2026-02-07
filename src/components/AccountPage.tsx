import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import { Package, User, LogOut, Upload, CheckCircle, Save, Star, MessageSquare, ArrowRight } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useUserStore } from "../store/userStore";

const AccountPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const redirectPath = searchParams.get('redirect');
  const { user, login, logout, updateUser } = useUserStore();
  
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'orders' | 'profile'>('login');
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Estados para reseñas
  const [reviewingProduct, setReviewingProduct] = useState<{orderId: number, productId: number} | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  
  const { register: registerLogin, handleSubmit: submitLogin } = useForm();
  const { register: registerReg, handleSubmit: submitReg } = useForm();
  const { register: registerProfile, handleSubmit: submitProfile, reset: resetProfile } = useForm();

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";

  // Cargar datos al iniciar
  useEffect(() => {
    if (user) {
      setActiveTab('orders');
      fetchOrders(user.email);
      fetchFullProfile(user.email);
    }
  }, []);

  const fetchFullProfile = async (email: string) => {
    setLoadingProfile(true);
    try {
      const res = await fetch(`${apiUrl}/auth/customer?email=${email}`);
      const data = await res.json();
      if (res.ok) {
        updateUser(data);
        resetProfile({
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone: data.billing?.phone || "",
          address_1: data.billing?.address_1 || "",
          city: data.billing?.city || "",
          state: data.billing?.state || "",
          postcode: data.billing?.postcode || "",
          country: data.billing?.country || "AR"
        });
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const fetchOrders = async (email: string) => {
    setLoadingOrders(true);
    try {
      const res = await fetch(`${apiUrl}/auth/orders?email=${email}`);
      const data = await res.json();
      if (Array.isArray(data)) setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleLogin = async (data: any) => {
    try {
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: data.email, password: data.password })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Error al iniciar sesión');
      
      const basicUser = { 
        id: result.user_id || 0,
        email: result.user_email, 
        first_name: result.user_display_name.split(' ')[0],
        last_name: result.user_display_name.split(' ')[1] || "",
        billing: {} as any,
        shipping: {} as any
      };
      
      login(basicUser, result.token);
      toast.success(`¡Hola de nuevo!`);
      
      if (redirectPath === 'checkout') {
        navigate('/checkout');
      } else {
        setActiveTab('orders');
        fetchOrders(result.user_email);
        fetchFullProfile(result.user_email);
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleRegister = async (data: any) => {
    try {
      const res = await fetch(`${apiUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Error al registrarse');
      
      toast.success('Registro exitoso. Ahora puedes iniciar sesión.');
      setActiveTab('login');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleLogout = () => {
    logout();
    setActiveTab('login');
    toast.info("Sesión cerrada");
    navigate('/account');
  };

  const handleSaveProfile = async (data: any) => {
    if (!user) return;
    setLoadingProfile(true);
    try {
      const updateData = {
        first_name: data.first_name,
        last_name: data.last_name,
        billing: {
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone: data.phone,
          address_1: data.address_1,
          city: data.city,
          state: data.state,
          postcode: data.postcode,
          country: data.country
        },
        shipping: {
          first_name: data.first_name,
          last_name: data.last_name,
          address_1: data.address_1,
          city: data.city,
          state: data.state,
          postcode: data.postcode,
          country: data.country
        }
      };

      const res = await fetch(`${apiUrl}/auth/customer/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (!res.ok) throw new Error("Error al actualizar perfil");
      
      const updated = await res.json();
      updateUser(updated);
      toast.success("Perfil actualizado correctamente");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleUploadReceipt = async (orderId: number) => {
    if (!selectedFile) {
      toast.error("Selecciona un archivo primero");
      return;
    }

    const formData = new FormData();
    formData.append('order_id', orderId.toString());
    formData.append('file', selectedFile);

    try {
      const res = await fetch(`${apiUrl}/orders/upload-receipt`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        toast.success("¡Comprobante enviado!");
        setSelectedFile(null);
        fetchOrders(user!.email);
      }
    } catch (err) {
      toast.error("Error al subir comprobante");
    }
  };

  const handleSendReview = async (productId: number) => {
    if (!user) return;
    setSubmittingReview(true);
    try {
      const res = await fetch(`${apiUrl}/wc/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          review: comment,
          reviewer: `${user.first_name} ${user.last_name}`,
          reviewer_email: user.email,
          rating: rating
        })
      });

      if (res.ok) {
        toast.success("¡Gracias por tu opinión!");
        setReviewingProduct(null);
        setComment("");
      }
    } catch (err) {
      toast.error("Error al enviar reseña");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 bg-gray-50 text-gray-900">
        <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-xl border border-gray-100">
          <div className="flex border-b border-gray-100 mb-8">
            <button className={`flex-1 py-4 text-xs font-black uppercase tracking-[0.2em] ${activeTab === 'login' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-300'}`} onClick={() => setActiveTab('login')}>Login</button>
            <button className={`flex-1 py-4 text-xs font-black uppercase tracking-[0.2em] ${activeTab === 'register' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-300'}`} onClick={() => setActiveTab('register')}>Registro</button>
          </div>
          
          {activeTab === 'login' ? (
            <form className="space-y-5" onSubmit={submitLogin(handleLogin)}>
              <input {...registerLogin("email", { required: true })} type="email" placeholder="EMAIL" className="w-full px-5 py-4 rounded-2xl border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-50 focus:border-blue-500 transition-all text-sm font-bold uppercase tracking-wider" />
              <input {...registerLogin("password", { required: true })} type="password" placeholder="CONTRASEÑA" className="w-full px-5 py-4 rounded-2xl border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-50 focus:border-blue-500 transition-all text-sm font-bold uppercase tracking-wider" />
              <button type="submit" className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase text-xs tracking-[0.3em] shadow-2xl hover:bg-blue-600 transition-all active:scale-95">Entrar</button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={submitReg(handleRegister)}>
               <div className="grid grid-cols-2 gap-4">
                  <input {...registerReg("first_name", { required: true })} placeholder="NOMBRE" className="w-full px-5 py-4 rounded-2xl border-gray-100 bg-gray-50 text-xs font-bold" />
                  <input {...registerReg("last_name", { required: true })} placeholder="APELLIDO" className="w-full px-5 py-4 rounded-2xl border-gray-100 bg-gray-50 text-xs font-bold" />
               </div>
               <input {...registerReg("email", { required: true })} type="email" placeholder="EMAIL" className="w-full px-5 py-4 rounded-2xl border-gray-100 bg-gray-50 text-xs font-bold" />
               <input {...registerReg("password", { required: true })} type="password" placeholder="CONTRASEÑA" className="w-full px-5 py-4 rounded-2xl border-gray-100 bg-gray-50 text-xs font-bold" />
               <button type="submit" className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase text-xs tracking-[0.3em]">Registrarse</button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 text-gray-900 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-8">
          
          <aside className="w-full md:w-64 space-y-3">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 mb-4 text-center">
               <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-black border-4 border-white shadow-inner uppercase">
                 {user.first_name?.[0] || user.email[0]}
               </div>
               <h2 className="font-black text-lg text-gray-900 truncate uppercase tracking-tight">{user.first_name} {user.last_name}</h2>
               <p className="text-[10px] text-gray-400 truncate uppercase font-black tracking-widest">{user.email}</p>
            </div>
            
            <button onClick={() => setActiveTab('orders')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'orders' ? 'bg-black text-white shadow-2xl' : 'bg-white text-gray-500 hover:bg-gray-100'}`}>
              <Package size={20} /> <span className="text-xs font-black uppercase tracking-widest">Pedidos</span>
            </button>
            <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'profile' ? 'bg-black text-white shadow-2xl' : 'bg-white text-gray-500 hover:bg-gray-100'}`}>
              <User size={20} /> <span className="text-xs font-black uppercase tracking-widest">Mis Datos</span>
            </button>
            <button onClick={handleLogout} className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl bg-white text-red-400 hover:bg-red-50 transition-all mt-8">
              <LogOut size={20} /> <span className="text-xs font-black uppercase tracking-widest">Salir</span>
            </button>
          </aside>

          <main className="flex-1">
            <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100 min-h-[600px]">
              
              {activeTab === 'orders' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <h1 className="text-3xl font-black mb-10 uppercase tracking-tighter">Historial de Pedidos</h1>
                  {loadingOrders ? (
                    <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin"></div></div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-24">
                      <div className="bg-gray-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-200">
                        <Package size={48} />
                      </div>
                      <p className="text-gray-400 font-black uppercase text-xs tracking-[0.2em]">No hay pedidos registrados</p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {orders.map((order) => (
                        <div key={order.id} className="border border-gray-50 rounded-[2.5rem] p-8 bg-gray-50/30 hover:border-blue-100 transition-all">
                          <div className="flex flex-wrap justify-between items-start gap-6 mb-8">
                            <div>
                              <span className="text-[10px] font-black text-blue-600 mb-2 block uppercase tracking-[0.3em]">ORDEN #{order.id}</span>
                              <p className="text-sm font-black text-gray-400 uppercase tracking-tight">{new Date(order.date_created).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            </div>
                            <div className="text-right">
                               <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest mb-3 inline-block ${
                                 order.status === 'completed' ? 'bg-green-100 text-green-600' : 
                                 order.status === 'on-hold' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500'
                               }`}>
                                 {order.status}
                               </span>
                               <p className="font-black text-2xl text-gray-900 tracking-tighter">${order.total}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-3 mb-8">
                             {order.line_items.map((item: any) => (
                               <div key={item.id} className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-tight">
                                  <span>{item.name} <b className="text-black ml-2">x{item.quantity}</b></span>
                                  <span className="text-gray-900">${item.total}</span>
                               </div>
                             ))}
                          </div>

                          <div className="flex flex-col sm:flex-row items-center gap-4 border-t border-gray-100 pt-8">
                             {order.status === 'pending' || order.status === 'on-hold' && order.payment_method === 'bacs' ? (
                               <>
                                 <div className="relative flex-1 w-full">
                                    <input type="file" id={`file-${order.id}`} className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                                    <label htmlFor={`file-${order.id}`} className="flex items-center justify-center gap-3 w-full px-6 py-4 bg-white border-2 border-dashed border-gray-200 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] text-gray-400 hover:border-blue-400 hover:text-blue-600 cursor-pointer transition-all">
                                      <Upload size={16} /> {selectedFile ? selectedFile.name : 'Adjuntar Comprobante'}
                                    </label>
                                 </div>
                                 <button onClick={() => handleUploadReceipt(order.id)} disabled={!selectedFile} className="bg-black text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-blue-600 transition-all shadow-xl disabled:opacity-20 w-full sm:w-auto">Enviar</button>
                               </>
                             ) : (
                               <p className="text-[10px] font-black text-green-600 uppercase tracking-[0.2em] flex items-center gap-2 bg-green-50 px-6 py-3 rounded-full border border-green-100 w-full justify-center">
                                 <CheckCircle size={16} /> Pago validado correctamente
                               </p>
                             )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'profile' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <h1 className="text-3xl font-black mb-2 uppercase tracking-tighter">Mis Datos</h1>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-10">Gestiona tu información de envío y contacto</p>
                  
                  {loadingProfile ? (
                     <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin"></div></div>
                  ) : (
                    <form className="space-y-8 max-w-2xl" onSubmit={submitProfile(handleSaveProfile)}>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Nombre</label>
                          <input {...registerProfile("first_name")} className="w-full px-6 py-4 rounded-2xl border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all text-sm font-bold uppercase tracking-tight" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Apellido</label>
                          <input {...registerProfile("last_name")} className="w-full px-6 py-4 rounded-2xl border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all text-sm font-bold uppercase tracking-tight" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Email</label>
                          <input {...registerProfile("email")} type="email" readOnly className="w-full px-6 py-4 rounded-2xl border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed text-sm font-bold uppercase" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Teléfono</label>
                          <input {...registerProfile("phone")} type="tel" className="w-full px-6 py-4 rounded-2xl border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all text-sm font-bold uppercase" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Dirección de Entrega</label>
                        <input {...registerProfile("address_1")} placeholder="CALLE Y NÚMERO" className="w-full px-6 py-4 rounded-2xl border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all text-sm font-bold uppercase" />
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        <div className="md:col-span-1">
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Ciudad</label>
                          <input {...registerProfile("city")} className="w-full px-6 py-4 rounded-2xl border-gray-100 bg-gray-50 focus:bg-white text-sm font-bold uppercase" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Provincia</label>
                          <input {...registerProfile("state")} className="w-full px-6 py-4 rounded-2xl border-gray-100 bg-gray-50 focus:bg-white text-sm font-bold uppercase" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">CP</label>
                          <input {...registerProfile("postcode")} className="w-full px-6 py-4 rounded-2xl border-gray-100 bg-gray-50 focus:bg-white text-sm font-bold uppercase" />
                        </div>
                      </div>

                      <div className="pt-6">
                        <button type="submit" className="flex items-center justify-center gap-3 bg-black text-white px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-[0.3em] shadow-2xl hover:bg-blue-600 transition-all active:scale-95">
                          <Save size={18} /> Guardar Cambios
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;