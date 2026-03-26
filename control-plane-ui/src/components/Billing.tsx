import React, { useState, useEffect } from 'react';
import { Check, RefreshCcw, Users } from 'lucide-react';
import { PayPalButtons } from "@paypal/react-paypal-js";
import { api } from '../lib/api';
import type { UserSession } from '../types';

interface BillingProps {
  user: UserSession;
}

export const Billing: React.FC<BillingProps> = ({ user }) => {
  const [billing, setBilling] = useState<any>(null);
  const [teamSize, setTeamSize] = useState(1);
 
  useEffect(() => {
    api.get('/billing').then(r => setBilling(r.data));
    api.get('/team').then(r => setTeamSize(r.data.length));
  }, [user]);

  if (!billing) return <div className="text-center p-40 animate-pulse font-black text-gray-700 tracking-[0.5em] uppercase text-white">Initialising Billing Engine</div>;

  return (
    <div className="max-w-7xl mx-auto">
      <header className="mb-14">
          <span className="px-6 py-2 bg-blue-600/10 border border-blue-500/30 rounded-full text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] mb-4 inline-block">Subscription Management</span>
          <h1 className="text-6xl font-black mb-4 tracking-tighter glow-text uppercase italic text-white flex gap-4 items-center">
             Service Plans
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl font-black uppercase italic tracking-tighter opacity-70">Manage your subscription and service limits. Upgrade to enable more management capabilities for your network.</p>
      </header>

      {/* Current Active Plan */}
      <div className="glass-card p-12 mb-20 relative overflow-hidden group border-white/10 ring-1 ring-white/5 bg-gradient-to-br from-blue-600/5 via-transparent to-transparent shadow-3xl shadow-black">
         <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px]" />
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-12 relative z-10">
            <div>
               <div className="flex items-center gap-4 mb-6">
                  <div className="px-4 py-1.5 bg-green-500/10 border border-green-500/30 rounded-xl text-[10px] font-black text-green-500 uppercase tracking-widest">{billing.status}</div>
                  <div className="text-[10px] text-gray-600 font-black uppercase tracking-widest">SUB_ID: {billing.paypal_sub_id}</div>
               </div>
               <h2 className="text-5xl font-black tracking-tighter uppercase italic text-white flex items-center gap-6 mb-4">
                  {billing.current_plan.name}
                  <div className="w-4 h-4 bg-blue-500 rounded-full shadow-lg shadow-blue-500" />
               </h2>
               <div className="flex flex-col md:flex-row items-start md:items-center gap-8 mt-10">
                  <div className="flex items-center gap-3 text-gray-400">
                    <Check className="w-5 h-5 text-green-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">Limit: {billing.current_plan.max_agents} active devices</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-400">
                    <Users className="w-5 h-5 text-blue-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">Seats: {teamSize} / {billing.current_plan.max_seats} Used</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-400">
                    <RefreshCcw className="w-4 h-4 text-blue-500 animate-spin-slow" />
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none italic">Next billing: {billing.next_bill}</span>
                  </div>
               </div>
            </div>
            <div className="text-right">
               <div className="text-[10px] text-gray-600 font-black uppercase tracking-[0.2em] mb-2 opacity-70">Monthly Throughput</div>
               <div className="text-7xl font-black glow-text text-white leading-none">${billing.current_plan.price}<span className="text-xs font-normal text-gray-500 lowercase opacity-50">.00/mo</span></div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {billing.all_plans.map((plan: any) => (
          <div key={plan.id} className={`glass-card p-12 flex flex-col group relative overflow-hidden transition-all duration-700 ${billing.current_plan.name === plan.name ? 'border-blue-500/50 bg-blue-500/5 ring-4 ring-blue-500/5' : 'hover:border-white/20 border-white/5'}`}>
            {billing.current_plan.name === plan.name && (
              <div className="absolute top-0 right-0 bg-blue-600 px-12 py-2 rotate-45 translate-x-12 translate-y-6 text-[10px] font-black tracking-[0.2em] text-white shadow-xl shadow-blue-500/50">CURRENT_PLAN</div>
            )}
            
            <div className="mb-12">
              <h3 className="text-2xl font-black mb-8 uppercase italic tracking-tighter text-white">{plan.name}</h3>
              <div className="flex items-baseline gap-2 mb-10">
                <span className="text-6xl font-black text-white leading-none">${plan.price}</span>
                <span className="text-sm text-gray-600 uppercase font-black tracking-widest font-mono">USD</span>
              </div>
               <div className="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                  <div className="text-[10px] text-gray-500 font-black tracking-[0.2em] uppercase mb-4">Service Limits</div>
                  <div className="flex flex-col gap-2 mb-6">
                    <div className="text-xl font-black text-blue-400 leading-none">{plan.max_agents} <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest grayscale font-sans">Active Devices</span></div>
                    <div className="text-xl font-black text-purple-400 leading-none">{plan.max_seats} <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest grayscale font-sans">Admin Seats</span></div>
                  </div>
                  
                  <div className="space-y-3 pt-4 border-t border-white/5">
                     {plan.features_raw?.split(',').map((f: string, i: number) => (
                       <div key={i} className="flex items-center gap-3 text-gray-400">
                          <Check className="w-4 h-4 text-blue-500" />
                          <span className="text-[10px] font-black uppercase tracking-widest">{f}</span>
                       </div>
                     ))}
                  </div>
               </div>
            </div>

            {billing.current_plan.name === plan.name ? (
              <button disabled className="w-full py-6 rounded-2xl font-black text-[10px] tracking-[0.3em] uppercase bg-white/5 text-gray-700 cursor-not-allowed border-white/5">
                ACTIVE
              </button>
            ) : (
              <div className="mt-4">
                <PayPalButtons
                  style={{ layout: 'vertical', color: 'blue', shape: 'pill', label: 'subscribe' }}
                  createSubscription={(_data, actions) => {
                    return actions.subscription.create({
                      'plan_id': plan.paypal_id
                    });
                  }}
                  onApprove={async (data, _actions) => {
                    await api.post('/paypal/webhook', {
                      event_type: "BILLING.SUBSCRIPTION.ACTIVATED",
                      resource: { 
                        id: data.subscriptionID, 
                        plan_id: plan.id, 
                        tenant_id: user.tenant 
                      }
                    });
                    alert('Subscription Processed Successfully');
                    window.location.reload();
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
