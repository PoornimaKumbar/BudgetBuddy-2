import React, { useState, useEffect } from 'react';
import api from '../api/axios';

import {
  CategoryPieChart,
  ExpenseLineChart
} from '../components/Charts';


export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [systemAnalytics, setSystemAnalytics] = useState(null);

  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  const [filterRole, setFilterRole] = useState('');
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');

  const fetchAdminData = async () => {
    try {
      const [usersRes, statsRes, analyticsRes] = await Promise.all([
        api.get('/admin/users', {
          params: {
            role: filterRole || undefined,
            search: search || undefined
          }
        }),
        api.get('/admin/stats'),
        api.get('/admin/analytics')
      ]);

      setUsers(usersRes.data);
      setStats(statsRes.data);
      setSystemAnalytics(analyticsRes.data);

      setLoading(false);
      setAnalyticsLoading(false);
    } catch (err) {
      console.error('Admin dashboard error:', err);
      setLoading(false);
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [filterRole, search]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, {
        role: newRole
      });

      fetchAdminData();
    } catch (err) {
      console.error(err);
      alert('Failed to update role');
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();

    if (!message.trim()) return;

    try {
      await api.post('/admin/notifications', {
        message,
        target_role: 'all'
      });

      alert('Notification sent successfully');
      setMessage('');
    } catch (err) {
      console.error(err);
      alert('Failed to send notification');
    }
  };

  const formatCurrency = (value) => {
    return `₹${Number(value || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-300">
        Loading Admin Data...
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <div>
        <h1 className="text-3xl font-bold text-slate-100">
          Admin Dashboard
        </h1>

        <p className="text-slate-400 mt-1">
          Manage users and monitor system-wide financial activity.
        </p>
      </div>


      {/* =====================================================
          ADMIN STATISTICS
      ====================================================== */}

      {stats && (
        <section>
          <h2 className="text-xl font-bold text-slate-100 mb-4">
            Administration Overview
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">

            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow">
              <h3 className="text-slate-400 text-xs uppercase tracking-wider mb-2">
                Total Users
              </h3>

              <p className="text-3xl text-blue-400 font-bold">
                {stats.total_users}
              </p>
            </div>

            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow">
              <h3 className="text-slate-400 text-xs uppercase tracking-wider mb-2">
                Normal Users
              </h3>

              <p className="text-3xl text-slate-300 font-bold">
                {stats.normal_users}
              </p>
            </div>

            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow">
              <h3 className="text-slate-400 text-xs uppercase tracking-wider mb-2">
                Premium Users
              </h3>

              <p className="text-3xl text-purple-400 font-bold">
                {stats.total_premium}
              </p>
            </div>

            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow">
              <h3 className="text-slate-400 text-xs uppercase tracking-wider mb-2">
                Administrators
              </h3>

              <p className="text-3xl text-rose-400 font-bold">
                {stats.total_admins}
              </p>
            </div>

            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow">
              <h3 className="text-slate-400 text-xs uppercase tracking-wider mb-2">
                Active / Inactive
              </h3>

              <p className="text-3xl text-emerald-400 font-bold">
                {stats.active_users}
                <span className="text-red-400 text-xl">
                  {' '}
                  / {stats.inactive_users}
                </span>
              </p>
            </div>

          </div>
        </section>
      )}


      {/* =====================================================
          SYSTEM ANALYTICS
      ====================================================== */}

      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-100">
              System Analytics
            </h2>

            <p className="text-slate-400 mt-1">
              Aggregated financial insights across all users.
            </p>
          </div>

          <button
            onClick={fetchAdminData}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold transition"
          >
            Refresh Analytics
          </button>
        </div>


        {analyticsLoading ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
            Loading system analytics...
          </div>
        ) : systemAnalytics ? (
          <div className="space-y-6">

            {/* -------------------------------------------------
                USER ROLE BREAKDOWN
            -------------------------------------------------- */}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

              <div className="bg-slate-900 p-5 rounded-xl border border-blue-500/20 shadow">
                <p className="text-slate-400 text-xs uppercase tracking-wider">
                  System Users
                </p>

                <p className="text-3xl font-bold text-blue-400 mt-2">
                  {systemAnalytics.users?.total || 0}
                </p>
              </div>

              <div className="bg-slate-900 p-5 rounded-xl border border-slate-700 shadow">
                <p className="text-slate-400 text-xs uppercase tracking-wider">
                  Normal
                </p>

                <p className="text-3xl font-bold text-slate-300 mt-2">
                  {systemAnalytics.users?.normal || 0}
                </p>
              </div>

              <div className="bg-slate-900 p-5 rounded-xl border border-purple-500/20 shadow">
                <p className="text-slate-400 text-xs uppercase tracking-wider">
                  Premium
                </p>

                <p className="text-3xl font-bold text-purple-400 mt-2">
                  {systemAnalytics.users?.premium || 0}
                </p>
              </div>

              <div className="bg-slate-900 p-5 rounded-xl border border-rose-500/20 shadow">
                <p className="text-slate-400 text-xs uppercase tracking-wider">
                  Admin
                </p>

                <p className="text-3xl font-bold text-rose-400 mt-2">
                  {systemAnalytics.users?.admin || 0}
                </p>
              </div>

            </div>


            {/* -------------------------------------------------
                FINANCIAL SUMMARY
            -------------------------------------------------- */}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              <div className="bg-slate-900 p-6 rounded-xl border border-emerald-500/20 shadow">
                <p className="text-slate-400 text-sm">
                  Total System Income
                </p>

                <p className="text-3xl font-bold text-emerald-400 mt-2">
                  {formatCurrency(
                    systemAnalytics.financial_summary?.total_income
                  )}
                </p>

                <p className="text-xs text-slate-500 mt-2">
                  Combined income across all users
                </p>
              </div>

              <div className="bg-slate-900 p-6 rounded-xl border border-red-500/20 shadow">
                <p className="text-slate-400 text-sm">
                  Total System Expenses
                </p>

                <p className="text-3xl font-bold text-red-400 mt-2">
                  {formatCurrency(
                    systemAnalytics.financial_summary?.total_expenses
                  )}
                </p>

                <p className="text-xs text-slate-500 mt-2">
                  Combined expenses across all users
                </p>
              </div>

              <div className="bg-slate-900 p-6 rounded-xl border border-indigo-500/20 shadow">
                <p className="text-slate-400 text-sm">
                  System Net Savings
                </p>

                <p className="text-3xl font-bold text-indigo-400 mt-2">
                  {formatCurrency(
                    systemAnalytics.financial_summary?.net_savings
                  )}
                </p>

                <p className="text-xs text-slate-500 mt-2">
                  Income minus expenses
                </p>
              </div>

            </div>


            {/* -------------------------------------------------
                SAVINGS GOALS SUMMARY
            -------------------------------------------------- */}

            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow">

              <div className="flex justify-between items-center mb-5">
                <div>
                  <h3 className="text-lg font-bold text-slate-100">
                    System Savings Goals
                  </h3>

                  <p className="text-sm text-slate-400">
                    Combined progress across all user savings goals.
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-slate-500 uppercase">
                    Goals
                  </p>

                  <p className="text-2xl font-bold text-blue-400">
                    {systemAnalytics.savings_goals?.count || 0}
                  </p>
                </div>
              </div>


              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                <div>
                  <p className="text-sm text-slate-400">
                    Total Target
                  </p>

                  <p className="text-xl font-bold text-slate-100 mt-1">
                    {formatCurrency(
                      systemAnalytics.savings_goals?.total_target
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-400">
                    Current Savings
                  </p>

                  <p className="text-xl font-bold text-emerald-400 mt-1">
                    {formatCurrency(
                      systemAnalytics.savings_goals?.total_current
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-400">
                    Overall Progress
                  </p>

                  <p className="text-xl font-bold text-purple-400 mt-1">
                    {Number(
                      systemAnalytics.savings_goals?.progress_percentage || 0
                    ).toFixed(2)}
                    %
                  </p>
                </div>

              </div>


              <div className="mt-5">
                <div className="h-3 bg-slate-800 rounded-full overflow-hidden">

                  <div
                    className="h-full bg-purple-500 rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        Number(
                          systemAnalytics.savings_goals?.progress_percentage || 0
                        ),
                        100
                      )}%`
                    }}
                  />

                </div>
              </div>

            </div>


            {/* -------------------------------------------------
                SPENDING BY CATEGORY
            -------------------------------------------------- */}

            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow">

              <div className="mb-5">
                <h3 className="text-lg font-bold text-slate-100">
                  System Spending by Category
                </h3>

                <p className="text-sm text-slate-400">
                  Expense distribution across all users.
                </p>
              </div>


              {systemAnalytics.spending_by_category?.length > 0 ? (
                        <div className="h-64 sm:h-80 w-full">
                          <CategoryPieChart 
                            data={systemAnalytics.spending_by_category.map(c => ({
                              name: c.category || c.name || 'Unknown',
                              value: c.amount || c.value || 0
                            }))} 
                          />
                        </div>
                      ) : (
                <p className="text-slate-500">
                  No system spending data available.
                </p>
              )}

            </div>


            {/* -------------------------------------------------
                MONTHLY SYSTEM TREND
            -------------------------------------------------- */}

            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow">

              <div className="mb-5">
                <h3 className="text-lg font-bold text-slate-100">
                  System Monthly Financial Trend
                </h3>

                <p className="text-sm text-slate-400">
                  Monthly income, expenses and net savings across all users.
                </p>
              </div>


              {systemAnalytics.monthly_trend?.length > 0 ? (
                        <div className="h-64 sm:h-80 w-full">
                          <ExpenseLineChart 
                            data={systemAnalytics.monthly_trend.map(m => ({
                              date: m.month || m.date || 'Unknown',
                              amount: m.total_expenses || m.amount || 0
                            }))} 
                          />
                        </div>
                      ) : (
                <p className="text-slate-500">
                  No monthly system data available.
                </p>
              )}

            </div>

          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500">
            System analytics could not be loaded.
          </div>
        )}

      </section>


      {/* =====================================================
          GLOBAL NOTIFICATION
      ====================================================== */}

      <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow">

        <h2 className="text-xl font-bold text-slate-100 mb-4">
          Send Global Notification
        </h2>

        <form
          onSubmit={handleSendNotification}
          className="flex flex-col md:flex-row gap-4"
        >

          <input
            type="text"
            className="flex-1 bg-slate-800 text-slate-100 rounded-lg p-3 border border-slate-700 focus:outline-none focus:border-blue-500"
            placeholder="Notification message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 px-5 py-3 rounded-lg text-white font-semibold transition"
          >
            Send
          </button>

        </form>

      </div>


      {/* =====================================================
          USER MANAGEMENT
      ====================================================== */}

      <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow">

        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-5">

          <div>
            <h2 className="text-xl font-bold text-slate-100">
              User Management
            </h2>

            <p className="text-sm text-slate-400 mt-1">
              Manage user roles and inspect individual accounts.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">

            <select
              className="bg-slate-800 text-slate-100 rounded-lg p-2 border border-slate-700"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="">
                All Roles
              </option>

              <option value="user">
                User
              </option>

              <option value="premium">
                Premium
              </option>

              <option value="admin">
                Admin
              </option>
            </select>

            <input
              type="text"
              placeholder="Search users..."
              className="bg-slate-800 text-slate-100 rounded-lg p-2 border border-slate-700"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

          </div>

        </div>


        <div className="overflow-x-auto">

          <table className="w-full text-left text-sm text-slate-300">

            <thead className="bg-slate-800 text-slate-100 uppercase text-xs">

              <tr>
                <th className="p-3 rounded-tl">
                  Name
                </th>

                <th className="p-3">
                  Email
                </th>

                <th className="p-3">
                  Role
                </th>

                <th className="p-3">
                  Joined
                </th>

                <th className="p-3 rounded-tr">
                  Actions
                </th>
              </tr>

            </thead>

            <tbody>

              {users.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-slate-800 hover:bg-slate-800/50"
                >

                  <td className="p-3 font-medium text-slate-100">
                    {u.full_name}
                  </td>

                  <td className="p-3">
                    {u.email}
                  </td>

                  <td className="p-3">

                    <span
                      className={`px-2 py-1 text-xs rounded-full font-bold uppercase ${
                        u.role === 'admin'
                          ? 'bg-red-900/50 text-red-400'
                          : u.role === 'premium'
                          ? 'bg-purple-900/50 text-purple-400'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {u.role}
                    </span>

                  </td>

                  <td className="p-3">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>

                  <td className="p-3 flex gap-2 items-center">

                    <select
                      className="bg-slate-700 rounded-lg text-xs p-2 text-slate-200"
                      value={u.role}
                      onChange={(e) =>
                        handleRoleChange(
                          u.id,
                          e.target.value
                        )
                      }
                    >

                      <option value="user">
                        User
                      </option>

                      <option value="premium">
                        Premium
                      </option>

                      <option value="admin">
                        Admin
                      </option>

                    </select>

                    <a
                      href={`/admin/users/${u.id}/accounts`}
                      className="bg-blue-600 hover:bg-blue-500 px-3 py-2 rounded-lg text-white text-xs font-semibold"
                    >
                      View Accounts
                    </a>

                  </td>

                </tr>
              ))}

            </tbody>

          </table>

          {users.length === 0 && (
            <p className="text-center text-slate-400 p-6">
              No users found.
            </p>
          )}

        </div>

      </div>

    </div>
  );
}
