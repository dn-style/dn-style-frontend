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
  
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'orders' | 'profile' | 'forgot'>('login');
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [reviewingProduct, setReviewingProduct] = useState<{orderId: number, productId: number} | null>(null);
  const [ratedProducts, setRatedProducts] = useState<number[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  
  const { register: registerLogin, handleSubmit: submitLogin } = useForm();
  const { register: registerReg, handleSubmit: submitReg } = useForm();
  const { register: registerProfile, handleSubmit: submitProfile, reset: resetProfile } = useForm();
  const { register: registerForgot, handleSubmit: submitForgot } = useForm();

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";

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
    } catch (err) { console.error(err); } finally { setLoadingProfile(false); }
  };

  const fetchOrders = async (email: string) => {
    setLoadingOrders(true);
    try {
      const res = await fetch(`${apiUrl}/auth/orders?email=${email}`);
      const data = await res.json();
      if (Array.isArray(data)) setOrders(data);
    } catch (err) { console.error(err); } finally { setLoadingOrders(false); }
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
        billing: {} as any, shipping: {} as any
      };
      
      login(basicUser, result.token);
      toast.success(`¡Hola!`);
      if (redirectPath === 'checkout') navigate('/checkout');
      else { setActiveTab('orders'); fetchOrders(result.user_email); fetchFullProfile(result.user_email); }
    } catch (err: any) { toast.error(err.message); }
  };

  const handleRegister = async (data: any) => {
    try {
      const res = await fetch(`${apiUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Error al registrarse');
      toast.success('Registro exitoso. Ya puedes entrar.');
      setActiveTab('login');
    } catch (err: any) { toast.error(err.message); }
  };

  const handleForgotPassword = async (data: any) => {
    try {
      const res = await fetch(`${apiUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email })
      });
      if (res.ok) { toast.success("Enlace enviado por email."); setActiveTab('login'); }
      else throw new Error("Email no encontrado.");
    } catch (err: any) { toast.error(err.message); }
  };

  const handleLogout = () => { logout(); setActiveTab('login'); toast.info("Sesión cerrada"); navigate('/account'); };

  const handleSaveProfile = async (data: any) => {
    if (!user) return;
    setLoadingProfile(true);
    try {
      const res = await fetch(`${apiUrl}/auth/customer/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first_name: data.first_name, last_name: data.last_name, billing: data, shipping: data })
      });
      if (!res.ok) throw new Error("Error al guardar");
      const updated = await res.json();
      updateUser(updated);
      toast.success("Perfil actualizado");
    } catch (err: any) { toast.error(err.message); } finally { setLoadingProfile(false); }
  };

  const handleUploadReceipt = async (orderId: number) => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append('order_id', orderId.toString());
    formData.append('file', selectedFile);
    try {
      const res = await fetch(`${apiUrl}/orders/upload-receipt`, { method: 'POST', body: formData });
      if (res.ok) { toast.success("Enviado!"); setSelectedFile(null); fetchOrders(user!.email); }
    } catch (err) { toast.error("Error"); }
  };

  const handleSendReview = async (productId: number) => {
    if (!user) return;
    setSubmittingReview(true);
    try {
      const res = await fetch(`${apiUrl}/wc/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, review: comment, reviewer: `${user.first_name} ${user.last_name}`, reviewer_email: user.email, rating })
      });
      if (res.ok) { toast.success("Gracias!"); setRatedProducts(p => [...p, productId]); setReviewingProduct(null); setComment(""); }
    } catch (err) { toast.error("Error"); } finally { setSubmittingReview(false); }
  };

  const RatingSection = ({ item, orderId }: { item: any, orderId: number }) => {
    const [hasReviewed, setHasReviewed] = useState<boolean | null>(null);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
      if (!user) return;
      fetch(`${apiUrl}/wc/reviews/check?product_id=${item.product_id}&email=${user.email}`)
        .then(r => r.json()).then(d => setHasReviewed(d.hasReviewed)).finally(() => setChecking(false));
    }, [item.product_id, user]);

    if (checking) return <div className="h-10 bg-slate-50 animate-pulse rounded-full w-24"></div>;

    const isRated = hasReviewed || ratedProducts.includes(item.product_id);
    const isCurrentlyReviewing = reviewingProduct?.productId === item.product_id;

    return (
      <div className="bg-white/80 p-4 rounded-2xl flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <span className="font-black text-xs text-slate-800 uppercase tracking-tight truncate max-w-full">{item.name}</span>
          {isRated ? (
            <span className="flex items-center gap-1 text-[9px] font-black text-green-500 uppercase tracking-widest bg-green-50 px-3 py-1.5 rounded-full border border-green-100"><CheckCircle size={10} /> Calificado</span>
          ) : (
            <button onClick={() => setReviewingProduct(isCurrentlyReviewing ? null : {orderId, productId: item.product_id})} className={`px-4 py-1.5 rounded-full bg-pink-600 text-white text-[9px] font-black uppercase tracking-widest shadow-lg ${isCurrentlyReviewing ? 'bg-slate-400 shadow-none' : ''}`}>
              {isCurrentlyReviewing ? 'Cerrar' : 'Calificar'}
            </button>
          )}
        </div>
        {isCurrentlyReviewing && !isRated && (
          <div className="pt-4 animate-in zoom-in-95">
            <div className="flex gap-2 mb-4">
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => setRating(s)}><Star size={20} className={s <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"} /></button>
              ))}
            </div>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Tu opinión..." className="w-full p-3 rounded-xl border-none bg-white text-sm mb-3 shadow-inner" rows={2} />
            <button onClick={() => handleSendReview(item.product_id)} disabled={submittingReview} className="w-full bg-pink-600 text-white py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest">{submittingReview ? 'Enviando...' : 'Publicar'}</button>
          </div>
        )}
      </div>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 bg-gray-50 text-gray-900">
        <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-xl border border-gray-100">
          <div className="flex border-b border-gray-100 mb-8">
            <button className={`flex-1 py-4 text-xs font-black uppercase tracking-[0.2em] ${activeTab === 'login' || activeTab === 'forgot' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-300'}`} onClick={() => setActiveTab('login')}>Login</button>
            <button className={`flex-1 py-4 text-xs font-black uppercase tracking-[0.2em] ${activeTab === 'register' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-300'}`} onClick={() => setActiveTab('register')}>Registro</button>
          </div>
          {activeTab === 'login' ? (
            <form className="space-y-5" onSubmit={submitLogin(handleLogin)}>
              <input {...registerLogin("email", { required: true })} type="email" placeholder="EMAIL" className="w-full px-5 py-4 rounded-2xl border-gray-100 bg-gray-50 text-sm font-bold uppercase" />
              <input {...registerLogin("password", { required: true })} type="password" placeholder="CONTRASEÑA" className="w-full px-5 py-4 rounded-2xl border-gray-100 bg-gray-50 text-sm font-bold uppercase" />
              <div className="flex justify-end"><button type="button" onClick={() => setActiveTab('forgot')} className="text-[10px] font-black text-gray-400 hover:text-blue-600 uppercase tracking-widest">¿Olvidaste tu contraseña?</button></div>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase text-xs tracking-[0.3em] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Entrar'}
              </button>
            </form>
          ) : activeTab === 'forgot' ? (
            <form className="space-y-5" onSubmit={submitForgot(handleForgotPassword)}>
              <input {...registerForgot("email", { required: true })} type="email" placeholder="TU EMAIL" className="w-full px-5 py-4 rounded-2xl border-gray-100 bg-gray-50 text-sm font-bold uppercase" />
              <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-[0.3em]">Enviar Enlace</button>
              <button type="button" onClick={() => setActiveTab('login')} className="w-full text-center text-[10px] font-black text-gray-400 uppercase tracking-widest mt-4">Volver</button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={submitReg(handleRegister)}>
               <div className="grid grid-cols-2 gap-4">
                  <input {...registerReg("first_name", { required: true })} placeholder="NOMBRE" className="w-full px-5 py-4 rounded-2xl border-gray-100 bg-gray-50 text-xs font-bold" />
                  <input {...registerReg("last_name", { required: true })} placeholder="APELLIDO" className="w-full px-5 py-4 rounded-2xl border-gray-100 bg-gray-50 text-xs font-bold" />
               </div>
               <input {...registerReg("email", { required: true })} type="email" placeholder="EMAIL" className="w-full px-5 py-4 rounded-2xl border-gray-100 bg-gray-50 text-xs font-bold" />
               <input {...registerReg("password", { required: true })} type="password" placeholder="CONTRASEÑA" className="w-full px-5 py-4 rounded-2xl border-gray-100 bg-gray-50 text-xs font-bold" />
               <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase text-xs tracking-[0.3em] disabled:opacity-50 flex items-center justify-center gap-2"
               >
                 {isSubmitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Registrarse'}
               </button>
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
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 text-center uppercase font-black">
               <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl border-4 border-white shadow-inner">{user.first_name?.[0] || user.email[0]}</div>
               <h2 className="text-lg tracking-tight truncate">{user.first_name} {user.last_name}</h2>
               <p className="text-[10px] text-gray-400 tracking-widest">{user.email}</p>
            </div>
            <button onClick={() => setActiveTab('orders')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'orders' ? 'bg-black text-white' : 'bg-white text-gray-500 hover:bg-gray-100'}`}><Package size={20} /> <span className="text-xs font-black uppercase tracking-widest">Pedidos</span></button>
            <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'profile' ? 'bg-black text-white' : 'bg-white text-gray-500 hover:bg-gray-100'}`}><User size={20} /> <span className="text-xs font-black uppercase tracking-widest">Mis Datos</span></button>
            <button onClick={handleLogout} className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl bg-white text-red-400 hover:bg-red-50 transition-all mt-8 font-black uppercase text-xs tracking-widest"><LogOut size={20} /> Salir</button>
          </aside>
          <main className="flex-1">
            <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100 min-h-[600px]">
              {activeTab === 'orders' && (
                <div className="space-y-8">
                  <h1 className="text-2xl font-bold uppercase tracking-tight mb-10">Mis Pedidos</h1>
                  {loadingOrders ? <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin"></div></div> : orders.length === 0 ? <p className="text-gray-400 font-black uppercase text-xs text-center py-24">No hay pedidos</p> : (
                    <div className="space-y-8">
                      {orders.map((order) => (
                        <div key={order.id} className="border border-gray-50 rounded-[2.5rem] p-8 bg-gray-50/30 transition-all">
                          <div className="flex flex-wrap justify-between items-start gap-6 mb-8 uppercase font-black">
                            <div><span className="text-[10px] text-blue-600 tracking-widest block">ORDEN #{order.id}</span><p className="text-sm text-gray-400">{new Date(order.date_created).toLocaleDateString()}</p></div>
                            <div className="text-right"><span className="px-4 py-1.5 rounded-full text-[9px] tracking-widest mb-3 inline-block bg-gray-100">{order.status}</span><p className="text-2xl text-gray-900 tracking-tighter">${order.total}</p></div>
                          </div>
                          {order.status === 'completed' && <div className="mb-8 p-6 bg-pink-50 rounded-[2rem] border border-pink-100 animate-in fade-in slide-in-from-bottom-4"><div className="flex items-center gap-3 mb-6 text-pink-500 font-black uppercase tracking-tight text-sm"><Star size={20} className="fill-current" /> Califica tus productos</div><div className="space-y-3">{order.line_items.map((item: any) => <RatingSection key={item.id} item={item} orderId={order.id} />)}</div></div>}
                          <div className="space-y-2 mb-8 px-2 text-xs font-bold text-gray-400 uppercase">{order.line_items.map((item: any) => <div key={item.id} className="flex justify-between"><span>{item.name} <b>x{item.quantity}</b></span><span>${item.total}</span></div>)}</div>
                          <div className="flex flex-col sm:flex-row gap-4 border-t border-gray-100 pt-8 mt-4">
                             {order.status === 'pending' || (order.status === 'on-hold' && order.payment_method === 'bacs') ? (
                               <div className="flex-1 flex flex-col sm:flex-row gap-4 w-full font-black uppercase text-[10px]">
                                 <input type="file" id={`file-${order.id}`} className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                                 <label htmlFor={`file-${order.id}`} className="flex-1 px-6 py-4 bg-white border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 cursor-pointer text-center">{selectedFile ? selectedFile.name : 'Subir Comprobante'}</label>
                                 <button onClick={() => handleUploadReceipt(order.id)} disabled={!selectedFile} className="bg-black text-white px-8 py-4 rounded-2xl shadow-xl disabled:opacity-20 w-full sm:w-auto">Enviar</button>
                               </div>
                             ) : order.status === 'completed' && <p className="text-[10px] font-black text-green-600 uppercase tracking-[0.2em] flex items-center gap-2 bg-green-50 px-6 py-3 rounded-full border border-green-100 w-full justify-center"><CheckCircle size={16} /> Pago validado</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'profile' && (
                <div>
                  <h1 className="text-3xl font-black mb-10 uppercase tracking-tighter">Mis Datos</h1>
                  {loadingProfile ? <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin"></div></div> : (
                    <form className="space-y-8 max-w-2xl" onSubmit={submitProfile(handleSaveProfile)}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-bold uppercase text-xs">
                        <input {...registerProfile("first_name")} placeholder="NOMBRE" className="w-full px-6 py-4 rounded-2xl border-gray-100 bg-gray-50 focus:bg-white transition-all" />
                        <input {...registerProfile("last_name")} placeholder="APELLIDO" className="w-full px-6 py-4 rounded-2xl border-gray-100 bg-gray-50 focus:bg-white transition-all" />
                      </div>
                      <input {...registerProfile("email")} type="email" readOnly className="w-full px-6 py-4 rounded-2xl border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed font-bold text-xs uppercase" />
                      <input {...registerProfile("phone")} type="tel" placeholder="TELÉFONO" className="w-full px-6 py-4 rounded-2xl border-gray-100 bg-gray-50 focus:bg-white transition-all font-bold text-xs uppercase" />
                      <input {...registerProfile("address_1")} placeholder="DIRECCIÓN" className="w-full px-6 py-4 rounded-2xl border-gray-100 bg-gray-50 focus:bg-white transition-all font-bold text-xs uppercase" />
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 font-bold text-xs uppercase">
                        <input {...registerProfile("city")} placeholder="CIUDAD" className="w-full px-6 py-4 rounded-2xl border-gray-100 bg-gray-50" />
                        <input {...registerProfile("state")} placeholder="PROVINCIA" className="w-full px-6 py-4 rounded-2xl border-gray-100 bg-gray-50" />
                        <input {...registerProfile("postcode")} placeholder="CP" className="w-full px-6 py-4 rounded-2xl border-gray-100 bg-gray-50" />
                      </div>
                      <button type="submit" className="bg-black text-white px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-[0.3em] shadow-2xl hover:bg-blue-600 transition-all active:scale-95 flex items-center gap-3"><Save size={18} /> Guardar</button>
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
