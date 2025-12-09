import { TrendingUp, TrendingDown, PiggyBank, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useApi } from '../hooks/useApi';
import type { Summary, CategoryBreakdown, MonthlyTrend, Transaction } from '../types';
import { format } from 'date-fns';
import './Dashboard.css';

const COLORS = ['#6366f1', '#8b5cf6', '#d946ef', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e'];

export function Dashboard() {
  const { data: summary } = useApi<Summary>('/analytics/summary');
  const { data: categoryData } = useApi<CategoryBreakdown[]>('/analytics/by-category?type=expense');
  const { data: monthlyData } = useApi<MonthlyTrend[]>('/analytics/monthly?months=6');
  const { data: recentTransactions } = useApi<Transaction[]>('/transactions?limit=5');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatMonth = (month: string) => {
    const [year, m] = month.split('-');
    return format(new Date(parseInt(year), parseInt(m) - 1), 'MMM');
  };

  return (
    <div className="dashboard animate-in">
      <header className="page-header">
        <h1>Dashboard</h1>
        <p>Your financial overview at a glance</p>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon income">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Income</span>
            <span className="stat-value">{formatCurrency(summary?.totalIncome ?? 0)}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon expense">
            <TrendingDown size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Expenses</span>
            <span className="stat-value">{formatCurrency(summary?.totalExpenses ?? 0)}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon savings">
            <PiggyBank size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Net Savings</span>
            <span className={`stat-value ${(summary?.netSavings ?? 0) >= 0 ? 'positive' : 'negative'}`}>
              {formatCurrency(summary?.netSavings ?? 0)}
            </span>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="card chart-card">
          <h3>Monthly Trends</h3>
          <div className="chart-container">
            {monthlyData && monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tickFormatter={formatMonth} stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => formatMonth(label)}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  />
                  <Area type="monotone" dataKey="income" stroke="#10b981" fill="url(#incomeGradient)" strokeWidth={2} name="Income" />
                  <Area type="monotone" dataKey="expenses" stroke="#ef4444" fill="url(#expenseGradient)" strokeWidth={2} name="Expenses" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">
                <p>No data yet. Add some transactions to see trends!</p>
              </div>
            )}
          </div>
        </div>

        <div className="card chart-card">
          <h3>Spending by Category</h3>
          <div className="chart-container">
            {categoryData && categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={categoryData as unknown as Record<string, unknown>[]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="total"
                    nameKey="category"
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">
                <p>No expenses recorded yet</p>
              </div>
            )}
          </div>
          {categoryData && categoryData.length > 0 && (
            <div className="category-legend">
              {categoryData.slice(0, 5).map((item, index) => (
                <div key={item.category} className="legend-item">
                  <span className="legend-color" style={{ background: COLORS[index % COLORS.length] }} />
                  <span className="legend-label">{item.category}</span>
                  <span className="legend-value">{formatCurrency(item.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card recent-transactions">
        <div className="section-header">
          <h3>Recent Transactions</h3>
        </div>
        {recentTransactions && recentTransactions.length > 0 ? (
          <div className="transaction-list">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="transaction-item">
                <div className={`transaction-icon ${tx.type}`}>
                  {tx.type === 'income' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                </div>
                <div className="transaction-details">
                  <span className="transaction-category">{tx.category}</span>
                  <span className="transaction-description">{tx.description || 'No description'}</span>
                </div>
                <div className="transaction-meta">
                  <span className={`transaction-amount ${tx.type}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </span>
                  <span className="transaction-date">{format(new Date(tx.date), 'MMM d')}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No transactions yet. Add your first one!</p>
          </div>
        )}
      </div>
    </div>
  );
}
