import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Check, ArrowRight } from 'lucide-react';
import api from '../api/axios';

export default function Pricing() {
  const { user, showToast, setUser } = useAuth();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '₹0',
      period: '',
      description: 'Normal users',
      features: ['Basic budget tracking', 'Standard reports', 'Up to 2 bank accounts'],
      buttonText: 'Current Plan',
      isCurrent: user?.role === 'user',
      popular: false
    },
    {
      id: 'premium_monthly',
      name: 'Premium Monthly',
      price: '₹99',
      period: '/month',
      description: 'Users who want flexibility',
      features: ['All Free features', 'Unlimited accounts', 'Premium Dashboard', 'Export to PDF/Excel', 'Advanced Analytics'],
      buttonText: 'Upgrade to Monthly',
      isCurrent: false,
      popular: false
    },
    {
      id: 'premium_yearly',
      name: 'Premium Yearly',
      price: '₹799',
      period: '/year',
      description: 'Best value',
      features: ['All Monthly features', 'Save ₹389 per year', 'Priority support', 'Early access to features'],
      buttonText: 'Upgrade to Yearly',
      isCurrent: false,
      popular: true
    },
    {
      id: 'premium_lifetime',
      name: 'Premium Lifetime',
      price: '₹1,999',
      period: ' one-time',
      description: 'Optional',
      features: ['Pay once, use forever', 'Lifetime updates', 'All Premium features included'],
      buttonText: 'Get Lifetime Access',
      isCurrent: false,
      popular: false
    }
  ];

  const handleUpgrade = async (planId) => {
    if (planId === 'free') return;
    
    setProcessing(true);
    // Simulate payment process delay
    setTimeout(async () => {
      try {
        // We'll call a backend mock endpoint or just update the role if the backend doesn't have it
        // Actually, since we don't have a payment endpoint, let's just use the admin role-update logic or a mock upgrade endpoint.
        // Wait, regular users can't hit /admin/users/role. Let's just mock it by setting the user state or we can build a quick /auth/upgrade endpoint.
        // Let's create an endpoint in auth.py called /auth/upgrade-premium
        await api.post('/auth/upgrade-premium', { plan: planId });
        
        const updatedUser = { ...user, role: 'premium' };
        setUser(updatedUser);
        localStorage.setItem('budgetbuddy_user', JSON.stringify(updatedUser));
        
        showToast('success', 'Payment successful! Welcome to Premium! 🎉');
        navigate('/premium');
      } catch (err) {
        showToast('error', 'Payment failed. Please try again.');
      } finally {
        setProcessing(false);
      }
    }, 1500);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex p-3 rounded-2xl bg-yellow-500/10 text-yellow-400 mb-4">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-black text-white">Upgrade to Premium</h1>
        <p className="text-slate-400 mt-3">
          Unlock the full power of BudgetBuddy with our advanced analytics, premium dashboard, and unlimited accounts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <div 
            key={plan.id} 
            className={`relative rounded-3xl border p-6 flex flex-col ${
              plan.popular 
                ? 'bg-gradient-to-b from-blue-900/40 to-slate-900 border-blue-500/50 shadow-xl shadow-blue-900/20' 
                : 'bg-slate-900 border-slate-800'
            }`}
          >
            {plan.popular && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <span className="bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                  Most Popular
                </span>
              </div>
            )}
            
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white">{plan.name}</h3>
              <p className="text-slate-400 text-xs mt-1 min-h-[32px]">{plan.description}</p>
              <div className="mt-4 flex items-baseline">
                <span className="text-3xl font-black text-white">{plan.price}</span>
                <span className="text-slate-400 text-sm ml-1">{plan.period}</span>
              </div>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start text-sm text-slate-300">
                  <Check className="w-4 h-4 text-emerald-400 mr-2 shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleUpgrade(plan.id)}
              disabled={plan.isCurrent || processing || user?.role === 'admin'}
              className={`w-full py-3 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all ${
                plan.isCurrent || user?.role === 'admin'
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : plan.popular
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25'
                  : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
              }`}
            >
              <span>{processing ? 'Processing...' : plan.buttonText}</span>
              {!plan.isCurrent && user?.role !== 'admin' && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
