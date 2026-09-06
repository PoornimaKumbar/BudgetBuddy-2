import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  BarChart3,
  CreditCard,
  TrendingUp,
  TrendingDown,
  PieChart,
  Target,
  User,
  X,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

export default function Sidebar({
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  let navItems = [
    {
      label: user?.role === 'admin' ? 'Admin Dashboard' : 'Dashboard',
      path: user?.role === 'admin' ? '/admin' : '/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Bank Accounts',
      path: '/accounts',
      icon: CreditCard,
    },
    {
      label: 'Income',
      path: '/income',
      icon: TrendingUp,
    },
    {
      label: 'Expenses',
      path: '/expenses',
      icon: TrendingDown,
    },
    {
      label: 'Budgets',
      path: '/budgets',
      icon: PieChart,
    },
    {
      label: 'Savings Goals',
      path: '/goals',
      icon: Target,
    },
    {
      label: user?.role === 'premium' || user?.role === 'admin' ? 'Advanced Analytics' : 'Analytics',
      path: '/analytics',
      icon: BarChart3,
    },
  ];

  /*
   * Premium users and Admins can access:
   * - Advanced Analytics
   * - Premium Reports
   *
   * Premium Dashboard is NOT included here because
   * it should be visible only to Admins.
   */
  if (user?.role === 'premium' || user?.role === 'admin') {
    navItems.push(
      {
        label: 'Reports',
        path: '/reports',
        icon: BarChart3,
      }
    );
  }

  

  navItems.push({
    label: 'My Profile',
    path: '/profile',
    icon: User,
  });

  

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden transition-opacity"
        />
      )}

      {/* Dynamic Sidebar Panel */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 bg-slate-900/95 border-r border-slate-800/80 backdrop-blur-xl transition-all duration-300 ease-in-out flex flex-col justify-between md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'md:w-20' : 'md:w-64'} w-64`}
      >
        {/* Top Header & Navigation */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-4">

          {/* Mobile Top Header */}
          <div className="flex justify-between items-center md:hidden pb-2 px-2 border-b border-slate-800">
            <span className="font-bold text-slate-300 text-xs tracking-wider uppercase">
              Navigation
            </span>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Dynamic Back Button */}
          <div className="px-1">
            <button
              onClick={() => navigate(-1)}
              title="Go Back to Previous Page"
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-300 bg-slate-800/50 hover:bg-blue-600/20 hover:text-blue-400 border border-slate-700/60 hover:border-blue-500/40 transition-all group ${
                isCollapsed ? 'md:justify-center md:px-0' : ''
              }`}
            >
              <ArrowLeft className="w-4 h-4 text-blue-400 group-hover:-translate-x-1 transition-transform shrink-0" />

              <span
                className={`${isCollapsed ? 'md:hidden' : 'block'}`}
              >
                Go Back
              </span>
            </button>
          </div>

          {/* Divider */}
          <div className="h-px bg-slate-800/60 mx-1" />

          {/* Dynamic Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  title={item.label}
                  className={({ isActive }) =>
                    `relative flex items-center space-x-3.5 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all group ${
                      isCollapsed
                        ? 'md:justify-center md:px-0'
                        : ''
                    } ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600/20 to-indigo-600/10 text-blue-400 border border-blue-500/30 shadow-lg shadow-blue-500/10'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border border-transparent'
                    }`
                  }
                >
                  {/* Active Indicator Bar */}
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-r-full" />
                  )}

                  <Icon
                    className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                      isActive
                        ? 'text-blue-400'
                        : 'text-slate-400 group-hover:text-blue-400'
                    }`}
                  />

                  <span
                    className={`${
                      isCollapsed ? 'md:hidden' : 'block'
                    } truncate`}
                  >
                    {item.label}
                  </span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer Area */}
        <div className="p-3 border-t border-slate-800/80 space-y-2 bg-slate-900/60">

          {/* User Profile Card */}
          {user && (
            <div
              className={`flex items-center space-x-3 p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 ${
                isCollapsed
                  ? 'md:justify-center md:p-1.5'
                  : ''
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-md">
                {user.full_name?.slice(0, 2).toUpperCase() || 'U'}
              </div>

              <div
                className={`flex-1 min-w-0 ${
                  isCollapsed ? 'md:hidden' : 'block'
                }`}
              >
                <p className="text-xs font-bold text-slate-200 truncate">
                  {user.full_name}
                </p>

                <div className="flex items-center space-x-1 text-[10px] text-emerald-400">

                  {user.role === 'admin' && (
                    <>
                      <ShieldCheck className="w-3 h-3 text-rose-400" />
                      <span className="text-rose-400">
                        ADMIN
                      </span>
                    </>
                  )}

                  {user.role === 'premium' && (
                    <>
                      <ShieldCheck className="w-3 h-3 text-yellow-400" />
                      <span className="text-yellow-400">
                        PREMIUM
                      </span>
                    </>
                  )}

                  {user.role === 'user' && (
                    <>
                      <User className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">
                        USER
                      </span>
                    </>
                  )}

                </div>
              </div>
            </div>
          )}

          {/* Desktop Collapse / Expand Toggle Button */}
          <button
            onClick={onToggleCollapse}
            title={
              isCollapsed
                ? 'Expand Sidebar'
                : 'Collapse Sidebar'
            }
            className="hidden md:flex w-full items-center justify-center space-x-2 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/40 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span>Collapse Sidebar</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}

