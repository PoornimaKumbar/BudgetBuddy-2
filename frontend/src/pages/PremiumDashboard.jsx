import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function PremiumDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-100">BudgetBuddy Premium</h1>
            <span className="bg-blue-500/20 text-blue-400 text-xs font-bold px-2 py-1 rounded border border-blue-500/30 flex items-center gap-1">
              <span>✨</span> Premium Unlocked
            </span>
          </div>
          <p className="text-blue-400 text-sm">Welcome to your Premium Dashboard</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <Link to="/reports" className="bg-slate-900 border border-slate-800 hover:border-blue-500/50 p-8 rounded-xl text-center transition-all hover:scale-[1.02] shadow-lg">
          <span className="block text-5xl mb-4">📊</span>
          <h2 className="text-xl font-bold text-slate-100 mb-2">Advanced Reports</h2>
          <p className="text-slate-400 text-sm">Download detailed financial reports as PDF & Excel</p>
        </Link>
        
        <Link to="/analytics" className="bg-slate-900 border border-slate-800 hover:border-blue-500/50 p-8 rounded-xl text-center transition-all hover:scale-[1.02] shadow-lg">
          <span className="block text-5xl mb-4">📉</span>
          <h2 className="text-xl font-bold text-slate-100 mb-2">Advanced Analytics</h2>
          <p className="text-slate-400 text-sm">Deep dive into your spending and income trends</p>
        </Link>
      </div>
    </div>
  );
}
