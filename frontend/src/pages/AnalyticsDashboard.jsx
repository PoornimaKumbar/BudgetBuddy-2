import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

import {
  IncomeBarChart,
  ExpenseLineChart,
  CategoryPieChart,
  BudgetUsagePieChart,
  CategoryTrendChart,
  SavingsTrendChart,
} from '../components/Charts';

import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  Target,
  RefreshCw,
  CalendarDays,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';


/* ============================================================
   HELPERS
============================================================ */

const today = new Date();

const formatDateInput = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const getStartOfMonth = (date) => {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    1
  );
};

const getEndOfMonth = (date) => {
  return new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0
  );
};

const subtractMonths = (date, numberOfMonths) => {
  return new Date(
    date.getFullYear(),
    date.getMonth() - numberOfMonths,
    1
  );
};

const money = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return '₹0.00';
  }

  return `₹${number.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const percent = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return '0.00%';
  }

  return `${number.toFixed(2)}%`;
};

const safeArray = (value) => {
  return Array.isArray(value) ? value : [];
};


/* ============================================================
   RESPONSE NORMALIZERS
============================================================ */

const normalizeSummary = (data) => {
  if (!data || typeof data !== 'object') {
    return {
      total_income: 0,
      total_expenses: 0,
      net_savings: 0,
      savings_rate: 0,
    };
  }

  const totalIncome = Number(
    data.total_income ??
    data.income ??
    data.totalIncome ??
    0
  );

  const totalExpenses = Number(
    data.total_expenses ??
    data.expenses ??
    data.totalExpenses ??
    0
  );

  const netSavings = Number(
    data.net_savings ??
    data.netSavings ??
    data.net_balance ??
    data.netBalance ??
    totalIncome - totalExpenses
  );

  const savingsRate = Number(
    data.savings_rate ??
    data.savingsRate ??
    (
      totalIncome > 0
        ? (netSavings / totalIncome) * 100
        : 0
    )
  );

  return {
    ...data,

    total_income:
      Number.isFinite(totalIncome)
        ? totalIncome
        : 0,

    total_expenses:
      Number.isFinite(totalExpenses)
        ? totalExpenses
        : 0,

    net_savings:
      Number.isFinite(netSavings)
        ? netSavings
        : 0,

    savings_rate:
      Number.isFinite(savingsRate)
        ? savingsRate
        : 0,
  };
};


/* ============================================================
   CATEGORY NORMALIZER
   Includes calculated percentage for Pie Chart labels.
============================================================ */

const normalizeCategoryData = (data) => {
  const source = Array.isArray(data)
    ? data
    : Array.isArray(data?.categories)
      ? data.categories
      : Array.isArray(data?.data)
        ? data.data
        : [];

  const normalized = source
    .map((item) => ({
      category:
        item.category ??
        item.name ??
        item.label ??
        'Other',

      amount: Number(
        item.amount ??
        item.total ??
        item.total_expenses ??
        item.value ??
        0
      ),
    }))
    .filter((item) =>
      Number.isFinite(item.amount)
    );

  const total = normalized.reduce(
    (sum, item) => sum + item.amount,
    0
  );

  return normalized.map((item) => ({
    ...item,

    percentage:
      total > 0
        ? (item.amount / total) * 100
        : 0,
  }));
};


const normalizeMonthlyTrend = (data) => {
  const source = Array.isArray(data)
    ? data
    : Array.isArray(data?.trend)
      ? data.trend
      : Array.isArray(data?.data)
        ? data.data
        : [];

  return source.map((item) => {
    const income = Number(
      item.income ??
      item.total_income ??
      item.totalIncome ??
      0
    );

    const expenses = Number(
      item.expenses ??
      item.total_expenses ??
      item.totalExpenses ??
      0
    );

    const net = Number(
      item.net ??
      item.net_savings ??
      income - expenses
    );

    return {
      month:
        item.month_label ??
        item.month ??
        item.month_key ??
        'Unknown',

      month_key:
        item.month_key ??
        item.month ??
        'unknown',

      income:
        Number.isFinite(income)
          ? income
          : 0,

      expenses:
        Number.isFinite(expenses)
          ? expenses
          : 0,

      net:
        Number.isFinite(net)
          ? net
          : income - expenses,
    };
  });
};


const normalizeSavingsGoals = (data) => {
  const source = Array.isArray(data)
    ? data
    : Array.isArray(data?.goals)
      ? data.goals
      : Array.isArray(data?.savings_goals)
        ? data.savings_goals
        : Array.isArray(data?.data)
          ? data.data
          : [];

  return source.map((goal) => {
    const target = Number(
      goal.target ??
      goal.target_amount ??
      goal.targetAmount ??
      0
    );

    const current = Number(
      goal.current ??
      goal.current_amount ??
      goal.currentAmount ??
      0
    );

    const calculatedPercentage =
      target > 0
        ? (current / target) * 100
        : 0;

    const remaining = Number(
      goal.remaining ??
      Math.max(target - current, 0)
    );

    const percentage = Number(
      goal.percentage ??
      goal.progress_percentage ??
      calculatedPercentage
    );

    return {
      ...goal,

      id: goal.id,

      title:
        goal.title ??
        goal.name ??
        'Savings Goal',

      goal_type:
        goal.goal_type ??
        goal.goalType ??
        '',

      target:
        Number.isFinite(target)
          ? target
          : 0,

      current:
        Number.isFinite(current)
          ? current
          : 0,

      remaining:
        Number.isFinite(remaining)
          ? remaining
          : Math.max(target - current, 0),

      percentage:
        Number.isFinite(percentage)
          ? percentage
          : calculatedPercentage,

      status:
        goal.status ??
        'in_progress',
    };
  });
};


const normalizeSavingsTrend = (data) => {
  const source = Array.isArray(data)
    ? data
    : Array.isArray(data?.trend)
      ? data.trend
      : Array.isArray(data?.data)
        ? data.data
        : [];

  return source.map((item) => {
    const contribution = Number(
      item.contribution ??
      item.amount ??
      item.total_contribution ??
      0
    );

    const cumulative = Number(
      item.cumulative_contribution ??
      item.cumulative ??
      0
    );

    return {
      month:
        item.month_label ??
        item.month ??
        item.month_key ??
        'Unknown',

      month_key:
        item.month_key ??
        item.month ??
        'unknown',

      contribution:
        Number.isFinite(contribution)
          ? contribution
          : 0,

      cumulative_contribution:
        Number.isFinite(cumulative)
          ? cumulative
          : 0,
    };
  });
};


const normalizeCategoryTrend = (data) => {
  if (!data || typeof data !== 'object') {
    return [];
  }

  const trend = safeArray(data.trend);

  return trend
    .map((item) => {
      const amount = Number(
        item.amount ??
        item.total_expenses ??
        0
      );

      return {
        month:
          item.month ??
          item.month_key ??
          'Unknown',

        category:
          item.category ??
          'Other',

        amount:
          Number.isFinite(amount)
            ? amount
            : 0,
      };
    })
    .filter((item) => item.amount >= 0);
};


/* ============================================================
   COMPONENT
============================================================ */

export default function AnalyticsDashboard() {
  const { user } = useAuth();


  const [startDate, setStartDate] = useState(
    formatDateInput(
      subtractMonths(
        getStartOfMonth(today),
        11
      )
    )
  );

  const [endDate, setEndDate] = useState(
    formatDateInput(today)
  );

  const [months, setMonths] = useState(12);

  const [summary, setSummary] = useState(null);

  const [categoryData, setCategoryData] = useState([]);

  const [monthlyTrend, setMonthlyTrend] = useState([]);

  const [categoryTrend, setCategoryTrend] = useState([]);

  const [comparison, setComparison] = useState(null);

  const [savingsTrend, setSavingsTrend] = useState([]);

  const [budgetStatus, setBudgetStatus] = useState([]);

  const [savingsGoals, setSavingsGoals] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');

  const [exporting, setExporting] = useState('');


  /* ==========================================================
     DATE PRESETS
  ========================================================== */

  const applyPreset = async (preset) => {
    const now = new Date();

    let start;
    let end;
    let selectedMonths;

    if (preset === 'month') {
      start = getStartOfMonth(now);
      end = getEndOfMonth(now);
      selectedMonths = 1;
    }

    else if (preset === '3months') {
      start = subtractMonths(
        getStartOfMonth(now),
        2
      );

      end = getEndOfMonth(now);
      selectedMonths = 3;
    }

    else if (preset === '6months') {
      start = subtractMonths(
        getStartOfMonth(now),
        5
      );

      end = getEndOfMonth(now);
      selectedMonths = 6;
    }

    else if (preset === '12months') {
      start = subtractMonths(
        getStartOfMonth(now),
        11
      );

      end = getEndOfMonth(now);
      selectedMonths = 12;
    }

    else {
      return;
    }

    const newStartDate =
      formatDateInput(start);

    const newEndDate =
      formatDateInput(end);

    setStartDate(newStartDate);

    setEndDate(newEndDate);

    setMonths(selectedMonths);

    await fetchAnalytics(
      selectedMonths,
      newStartDate,
      newEndDate
    );
  };


  /* ==========================================================
     FETCH ANALYTICS
  ========================================================== */

  const fetchAnalytics = async (
    monthsToFetch = months,
    startDateToFetch = startDate,
    endDateToFetch = endDate
  ) => {

    setLoading(true);
    setError('');

    const results = {
      summary: null,
      categoryData: [],
      monthlyTrend: [],
      categoryTrend: [],
      comparison: null,
      savingsTrend: [],
      savingsGoals: [],
      budgetStatus: [],
    };


    /* --------------------------------------------------------
       SUMMARY
    -------------------------------------------------------- */

    try {
      const response = await api.get(
        '/analytics/summary'
      );

      results.summary =
        normalizeSummary(
          response.data
        );

    } catch (err) {
      console.error(
        'Analytics summary error:',
        err
      );
    }


    /* --------------------------------------------------------
       CUSTOM RANGE / CATEGORY
    -------------------------------------------------------- */

    try {
      const response = await api.get(
        '/analytics/custom-range',
        {
          params: {
            start_date: startDateToFetch,
            end_date: endDateToFetch,
          },
        }
      );

      const data = response.data;

      results.categoryData =
        normalizeCategoryData(
          data?.category_breakdown ??
          data?.categories ??
          []
        );

    } catch (err) {

      console.error(
        'Custom range/category analytics error:',
        err
      );


      /* ------------------------------------------------------
         FALLBACK
      ------------------------------------------------------ */

      try {
        const fallback =
          await api.get(
            '/analytics/spending-by-category',
            {
              params: {
                months: monthsToFetch,
              },
            }
          );

        results.categoryData =
          normalizeCategoryData(
            fallback.data
          );

      } catch (fallbackError) {

        console.error(
          'Category fallback error:',
          fallbackError
        );
      }
    }


    /* --------------------------------------------------------
       MONTHLY TREND
    -------------------------------------------------------- */

    try {
      const response =
        await api.get(
          '/analytics/monthly-trend',
          {
            params: {
              months: monthsToFetch,
            },
          }
        );

      results.monthlyTrend =
        normalizeMonthlyTrend(
          response.data
        );

    } catch (err) {

      console.error(
        'Monthly trend error:',
        err
      );
    }


    /* --------------------------------------------------------
       SAVINGS GOALS
    -------------------------------------------------------- */

    try {
      const response =
        await api.get(
          '/analytics/savings-progress'
        );

      results.savingsGoals =
        normalizeSavingsGoals(
          response.data
        );

    } catch (err) {

      console.error(
        'Savings goals error:',
        err
      );


      /* ------------------------------------------------------
         FALLBACK
      ------------------------------------------------------ */

      try {
        const fallback =
          await api.get(
            '/savings-goals'
          );

        results.savingsGoals =
          normalizeSavingsGoals(
            fallback.data
          );

      } catch (fallbackError) {

        console.error(
          'Savings goals fallback error:',
          fallbackError
        );
      }
    }


    /* --------------------------------------------------------
       CATEGORY TREND
    -------------------------------------------------------- */

    try {
      const response =
        await api.get(
          '/analytics/category-trend',
          {
            params: {
              months: monthsToFetch,
            },
          }
        );

      results.categoryTrend =
        normalizeCategoryTrend(
          response.data
        );

    } catch (err) {

      console.error(
        'Category trend error:',
        err
      );
    }


    /* --------------------------------------------------------
       MONTH COMPARISON
    -------------------------------------------------------- */

    try {
      const response =
        await api.get(
          '/analytics/month-comparison'
        );

      results.comparison =
        response.data ?? null;

    } catch (err) {

      console.error(
        'Month comparison error:',
        err
      );
    }


    /* --------------------------------------------------------
       SAVINGS TREND
    -------------------------------------------------------- */

    try {
      const response =
        await api.get(
          '/analytics/savings-trend',
          {
            params: {
              months: monthsToFetch,
            },
          }
        );

      results.savingsTrend =
        normalizeSavingsTrend(
          response.data
        );

    } catch (err) {

      console.error(
        'Savings trend error:',
        err
      );
    }


    /* --------------------------------------------------------
       BUDGET STATUS
    -------------------------------------------------------- */

    try {
      const selectedEnd =
        new Date(endDateToFetch);

      const year =
        selectedEnd.getFullYear();

      const month =
        selectedEnd.getMonth() + 1;

      const response =
        await api.get(
          '/reports/monthly',
          {
            params: {
              year,
              month,
            },
          }
        );

      results.budgetStatus =
        safeArray(
          response.data?.budget_status
        );

    } catch (err) {

      console.error(
        'Budget status error:',
        err
      );
    }


    /* --------------------------------------------------------
       SAVE RESULTS
    -------------------------------------------------------- */

    setSummary(
      results.summary
    );

    setCategoryData(
      results.categoryData
    );

    setMonthlyTrend(
      results.monthlyTrend
    );

    setCategoryTrend(
      results.categoryTrend
    );

    setComparison(
      results.comparison
    );

    setSavingsTrend(
      results.savingsTrend
    );

    setSavingsGoals(
      results.savingsGoals
    );

    setBudgetStatus(
      results.budgetStatus
    );

    setLoading(false);
  };


  /* ==========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    fetchAnalytics();
  }, []);


  /* ==========================================================
     APPLY DATE RANGE
  ========================================================== */

  const handleApplyDateRange = async () => {

    if (!startDate || !endDate) {
      setError(
        'Please select both start and end dates.'
      );

      return;
    }

    if (startDate > endDate) {
      setError(
        'Start date cannot be after end date.'
      );

      return;
    }

    const start =
      new Date(startDate);

    const end =
      new Date(endDate);

    const monthDifference =
      (
        end.getFullYear() -
        start.getFullYear()
      ) *
        12 +
      (
        end.getMonth() -
        start.getMonth()
      ) +
      1;

    const newMonths =
      Math.min(
        Math.max(
          monthDifference,
          1
        ),
        12
      );

    setMonths(
      newMonths
    );

    await fetchAnalytics(
      newMonths,
      startDate,
      endDate
    );
  };


  /* ==========================================================
     REFRESH
  ========================================================== */

  const handleRefresh = async () => {
    await fetchAnalytics(
      months,
      startDate,
      endDate
    );
  };


  /* ==========================================================
     EXPORT
  ========================================================== */

  


  /* ==========================================================
     COMPARISON VALUES
  ========================================================== */

  const currentMonthExpenses =
    Number(
      comparison?.current_month?.expenses ??
      comparison?.current_month?.total_expenses ??
      0
    );

  const previousMonthExpenses =
    Number(
      comparison?.previous_month?.expenses ??
      comparison?.previous_month?.total_expenses ??
      0
    );

  const percentageChange =
    Number(
      comparison?.percentage_change?.expenses ??
      comparison?.percentage_change ??
      0
    );


  /* ==========================================================
     SAVINGS TOTAL
  ========================================================== */

  const totalContributions =
    savingsTrend.length > 0
      ? Number(
          savingsTrend[
            savingsTrend.length - 1
          ]?.cumulative_contribution ?? 0
        )
      : 0;


  /* ==========================================================
     TOTAL GOAL TARGET / CURRENT
  ========================================================== */

  const totalGoalTarget =
    savingsGoals.reduce(
      (total, goal) =>
        total +
        Number(
          goal.target ?? 0
        ),
      0
    );

  const totalGoalCurrent =
    savingsGoals.reduce(
      (total, goal) =>
        total +
        Number(
          goal.current ?? 0
        ),
      0
    );

  const overallGoalProgress =
    totalGoalTarget > 0
      ? (
          totalGoalCurrent /
          totalGoalTarget
        ) *
        100
      : 0;


  /* ==========================================================
     BUDGET DATA FOR CHART
  ========================================================== */

  const budgetChartData =
    budgetStatus
      .map((budget) => {

        const spent =
          Number(
            budget.spent_amount ??
            budget.spent ??
            budget.amount_spent ??
            0
          );

        const remaining =
          Math.max(
            Number(
              budget.remaining_amount ??
              budget.remaining ??
              0
            ),
            0
          );

        return {
          category:
            budget.category ??
            'Other',

          spent:
            Number.isFinite(spent)
              ? spent
              : 0,

          remaining:
            Number.isFinite(remaining)
              ? remaining
              : 0,
        };
      })
      .filter(
        (item) =>
          item.spent > 0 ||
          item.remaining > 0
      );


  /* ==========================================================
     DISPLAY DATES
  ========================================================== */

  const selectedPeriodLabel =
    `${startDate} to ${endDate}`;


  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading && !summary) {

    return (
      <div className="min-h-screen bg-slate-50 p-6">

        <div className="flex min-h-[60vh] items-center justify-center">

          <div className="flex flex-col items-center gap-4">

            <RefreshCw
              className="h-8 w-8 animate-spin text-emerald-600"
            />

            <p className="text-sm text-slate-500">
              Loading premium analytics...
            </p>

          </div>

        </div>

      </div>
    );
  }


  /* ==========================================================
     UI
  ========================================================== */

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div>

          <div className="mb-2 flex items-center gap-2">

            <BarChart3 className="h-7 w-7 text-emerald-600" />

            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
              Premium Analytics
            </h1>

          </div>

          <p className="text-sm text-slate-500 md:text-base">
            Deep-dive financial insights, trends, comparisons and savings progress
          </p>

        </div>


        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >

          <RefreshCw
            className={`h-4 w-4 ${
              loading
                ? 'animate-spin'
                : ''
            }`}
          />

          Refresh Analytics

        </button>

      </div>


      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}


      {/* ======================================================
          DATE RANGE
      ====================================================== */}

      


      {/* ======================================================
          SUMMARY CARDS
      ====================================================== */}

      <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">

        {/* Income */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="mb-4 flex items-center justify-between">

            <div className="rounded-xl bg-emerald-50 p-2.5">

              <Wallet className="h-5 w-5 text-emerald-600" />

            </div>

          </div>

          <p className="text-sm text-slate-500">
            Total Income
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {money(
              summary?.total_income
            )}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Lifetime total income
          </p>

        </div>


        {/* Expenses */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="mb-4 flex items-center justify-between">

            <div className="rounded-xl bg-red-50 p-2.5">

              <TrendingDown className="h-5 w-5 text-red-600" />

            </div>

          </div>

          <p className="text-sm text-slate-500">
            Total Expenses
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {money(
              summary?.total_expenses
            )}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Lifetime total expenses
          </p>

        </div>


        {/* Net Savings */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="mb-4 flex items-center justify-between">

            <div className="rounded-xl bg-blue-50 p-2.5">

              <TrendingUp className="h-5 w-5 text-blue-600" />

            </div>

          </div>

          <p className="text-sm text-slate-500">
            Net Savings
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {money(
              summary?.net_savings
            )}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Lifetime net savings
          </p>

        </div>


        {/* Savings Rate */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="mb-4 flex items-center justify-between">

            <div className="rounded-xl bg-purple-50 p-2.5">

              <PiggyBank className="h-5 w-5 text-purple-600" />

            </div>

          </div>

          <p className="text-sm text-slate-500">
            Savings Rate
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {percent(
              summary?.savings_rate
            )}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Lifetime savings rate
          </p>

        </div>

      </div>


      {/* ======================================================
          COMPARISON
      ====================================================== */}

      <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

        <div className="mb-6">

          <h2 className="text-lg font-bold text-slate-900">
            This Month vs Last Month
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Compare your recent spending performance
          </p>

        </div>


        <div className="grid gap-4 md:grid-cols-3">

          <div className="rounded-xl bg-slate-50 p-5">

            <p className="text-sm text-slate-500">
              This Month
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {money(
                currentMonthExpenses
              )}
            </p>

          </div>


          <div className="rounded-xl bg-slate-50 p-5">

            <p className="text-sm text-slate-500">
              Last Month
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {money(
                previousMonthExpenses
              )}
            </p>

          </div>


          <div className="rounded-xl bg-slate-50 p-5">

            <p className="text-sm text-slate-500">
              Change
            </p>

            <div className="mt-2 flex items-center gap-2">

              {percentageChange < 0 ? (
                <TrendingDown className="h-5 w-5 text-emerald-600" />
              ) : (
                <TrendingUp className="h-5 w-5 text-red-600" />
              )}

              <p
                className={`text-2xl font-bold ${
                  percentageChange < 0
                    ? 'text-emerald-600'
                    : 'text-red-600'
                }`}
              >
                {percent(
                  Math.abs(
                    percentageChange
                  )
                )}
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* ======================================================
          MONTHLY CHARTS
      ====================================================== */}

      <div className="mb-8 grid gap-6 xl:grid-cols-2">

        {/* Income */}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="mb-5">

            <h2 className="text-lg font-bold text-slate-900">{user?.role === "user" ? "Income" : "Monthly Income"}</h2>

            <p className="text-sm text-slate-500">
              Historical income trend
            </p>

          </div>

          {monthlyTrend.length > 0 ? (
            <IncomeBarChart
              data={monthlyTrend}
            />
          ) : (
            <EmptyState
              text="No income trend data available."
            />
          )}

        </section>


        {/* Expenses */}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="mb-5">

            <h2 className="text-lg font-bold text-slate-900">{user?.role === "user" ? "Expenses" : "Monthly Expenses"}</h2>

            <p className="text-sm text-slate-500">
              Historical expense trend
            </p>

          </div>

          {monthlyTrend.length > 0 ? (
            <ExpenseLineChart
              data={monthlyTrend}
            />
          ) : (
            <EmptyState
              text="No expense trend data available."
            />
          )}

        </section>

      </div>


      {/* ======================================================
          CATEGORY + BUDGET
      ====================================================== */}

      <div className="mb-8 grid gap-6 xl:grid-cols-2">

        {/* Category */}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="mb-5">

            <h2 className="text-lg font-bold text-slate-900">
              Spending by Category
            </h2>

            <p className="text-sm text-slate-500">
              Selected date range
            </p>

          </div>

          {categoryData.length > 0 ? (
            <CategoryPieChart
              data={categoryData}
            />
          ) : (
            <EmptyState
              text="No spending data available for this period."
            />
          )}

        </section>


        {/* Budget */}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="mb-5">

            <h2 className="text-lg font-bold text-slate-900">
              Budget Usage
            </h2>

            <p className="text-sm text-slate-500">
              Current budget utilization
            </p>

          </div>

          {budgetChartData.length > 0 ? (
            <BudgetUsagePieChart
              data={budgetChartData}
            />
          ) : (
            <EmptyState
              text="Not enough budget data available to display this chart."
            />
          )}

        </section>

      </div>


      {/* ======================================================
          CATEGORY TREND
      ====================================================== */}

      <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

        <div className="mb-5">

          <h2 className="text-lg font-bold text-slate-900">
            Category Spending Over Time
          </h2>

          <p className="text-sm text-slate-500">{user?.role === "user" ? "Category breakdown" : "Monthly category breakdown"}</p>

        </div>

        {categoryTrend.length > 0 ? (
          <CategoryTrendChart
            data={categoryTrend}
          />
        ) : (
          <EmptyState
            text="No category trend data available."
          />
        )}

      </section>


      {/* ======================================================
          SAVINGS TREND
      ====================================================== */}

      <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

        <div className="mb-6">

          <h2 className="text-lg font-bold text-slate-900">
            Savings Contribution Trend
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Track contributions and cumulative savings
          </p>

        </div>


        {/* Total Contributions */}

        <div className="mb-6 rounded-xl bg-slate-50 p-5">

          <p className="text-sm text-slate-500">
            Total Contributions
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {money(
              totalContributions
            )}
          </p>

        </div>


        {/* Savings Chart */}

        {savingsTrend.length > 0 ? (
          <SavingsTrendChart
            data={savingsTrend}
          />
        ) : (
          <EmptyState
            text="No savings contribution data available."
          />
        )}

      </section>


      {/* ======================================================
          SAVINGS GOALS
      ====================================================== */}

      <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

        <div className="mb-6 flex items-center gap-2">

          <Target className="h-5 w-5 text-emerald-600" />

          <div>

            <h2 className="text-lg font-bold text-slate-900">
              Savings Goals Progress
            </h2>

            <p className="text-sm text-slate-500">
              Current progress toward your financial goals
            </p>

          </div>

        </div>


        {savingsGoals.length > 0 ? (

          <div className="space-y-5">

            {savingsGoals.map(
              (goal, index) => {

                const progress =
                  Math.min(
                    Math.max(
                      Number(
                        goal.percentage ?? 0
                      ),
                      0
                    ),
                    100
                  );

                return (

                  <div
                    key={
                      goal.id ??
                      `${goal.title}-${index}`
                    }
                    className="rounded-xl border border-slate-100 bg-slate-50 p-5"
                  >

                    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                      <div>

                        <h3 className="font-semibold text-slate-900">
                          {goal.title}
                        </h3>

                        {goal.goal_type && (
                          <p className="text-xs capitalize text-slate-500">

                            {String(
                              goal.goal_type
                            ).replace(
                              /_/g,
                              ' '
                            )}

                          </p>
                        )}

                      </div>


                      <div className="text-left sm:text-right">

                        <p className="text-sm font-semibold text-slate-900">

                          {money(
                            goal.current
                          )}

                          {' / '}

                          {money(
                            goal.target
                          )}

                        </p>

                        <p className="text-xs text-slate-500">

                          {percent(
                            progress
                          )}

                          {' ('}

                          {goal.status ??
                            'in_progress'}

                          {')'}

                        </p>

                      </div>

                    </div>


                    <div className="h-3 overflow-hidden rounded-full bg-slate-200">

                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                        style={{
                          width: `${progress}%`,
                        }}
                      />

                    </div>

                  </div>

                );
              }
            )}


            {/* Goal Summary */}

            <div className="mt-6 grid gap-4 md:grid-cols-3">

              <div className="rounded-xl border border-slate-100 bg-white p-4">

                <p className="text-xs text-slate-500">
                  Total Target
                </p>

                <p className="mt-1 text-lg font-bold text-slate-900">
                  {money(
                    totalGoalTarget
                  )}
                </p>

              </div>


              <div className="rounded-xl border border-slate-100 bg-white p-4">

                <p className="text-xs text-slate-500">
                  Current Saved
                </p>

                <p className="mt-1 text-lg font-bold text-emerald-600">
                  {money(
                    totalGoalCurrent
                  )}
                </p>

              </div>


              <div className="rounded-xl border border-slate-100 bg-white p-4">

                <p className="text-xs text-slate-500">
                  Overall Progress
                </p>

                <p className="mt-1 text-lg font-bold text-slate-900">
                  {percent(
                    overallGoalProgress
                  )}
                </p>

              </div>

            </div>

          </div>

        ) : (

          <EmptyState
            text="No savings goals available."
          />

        )}

      </section>


      {/* ======================================================
          FOOTER
      ====================================================== */}

      <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 text-center text-xs text-slate-500">

        Summary cards show lifetime totals. Trends, category analysis and exports use the selected period.

      </div>

    </div>
  );
}


/* ============================================================
   EMPTY STATE
============================================================ */

function EmptyState({
  text,
}) {
  return (
    <div className="flex min-h-[180px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 text-center">

      <p className="text-sm text-slate-500">
        {text}
      </p>

    </div>
  );
}

