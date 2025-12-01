'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import { expenseAPI, incomeAPI, debtAPI, investmentAPI } from '../lib/api';

export default function ReportsPage() {
  const [data, setData] = useState({
    expenses: [],
    income: [],
    debts: [],
    investments: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('thisMonth');
  const { user } = useAuth();

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [expenses, income, debts, investments] = await Promise.allSettled([
        expenseAPI.getAll(),
        incomeAPI.getAll(),
        debtAPI.getAll(),
        investmentAPI.getAll()
      ]);

      // Check which APIs failed
      const failedAPIs = [];
      if (expenses.status === 'rejected') failedAPIs.push('Expenses');
      if (income.status === 'rejected') failedAPIs.push('Income');
      if (debts.status === 'rejected') failedAPIs.push('Debts');
      if (investments.status === 'rejected') failedAPIs.push('Investments');

      setData({
        expenses: expenses.status === 'fulfilled' && Array.isArray(expenses.value) ? expenses.value : [],
        income: income.status === 'fulfilled' && Array.isArray(income.value) ? income.value : [],
        debts: debts.status === 'fulfilled' && Array.isArray(debts.value) ? debts.value : [],
        investments: investments.status === 'fulfilled' && Array.isArray(investments.value) ? investments.value : []
      });

      if (failedAPIs.length > 0) {
        setError(`Some data could not be loaded: ${failedAPIs.join(', ')}. Please check your connection and refresh the page.`);
      } else {
        setError('');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch financial data');
    } finally {
      setLoading(false);
    }
  };

  const getDateRangeFilter = (dateRange) => {
    const now = new Date();
    switch (dateRange) {
      case 'thisMonth':
        return (date) => {
          const itemDate = new Date(date);
          return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
        };
      case 'last3Months':
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        return (date) => new Date(date) >= threeMonthsAgo;
      case 'thisYear':
        return (date) => new Date(date).getFullYear() === now.getFullYear();
      case 'allTime':
      default:
        return () => true;
    }
  };

  const filterByDate = getDateRangeFilter(dateRange);

  // Filter data by date range with safety checks
  const filteredExpenses = Array.isArray(data.expenses) ? data.expenses.filter(expense => filterByDate(expense.date)) : [];
  const filteredIncome = Array.isArray(data.income) ? data.income.filter(income => filterByDate(income.date)) : [];

  // Calculate metrics with safety checks
  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  const totalIncome = filteredIncome.reduce((sum, income) => sum + (income.amount || 0), 0);
  const netCashFlow = totalIncome - totalExpenses;
  
  const totalDebt = Array.isArray(data.debts) ? data.debts.reduce((sum, debt) => sum + (debt.currentBalance || 0), 0) : 0;
  const totalInvestments = Array.isArray(data.investments) ? data.investments.reduce((sum, inv) => sum + (inv.currentValue || 0), 0) : 0;

  // Category breakdown for expenses
  const expensesByCategory = filteredExpenses.reduce((acc, expense) => {
    const category = expense.category || 'Other';
    acc[category] = (acc[category] || 0) + (expense.amount || 0);
    return acc;
  }, {});

  // Income by source
  const incomeBySource = filteredIncome.reduce((acc, income) => {
    const source = income.source || 'Other';
    acc[source] = (acc[source] || 0) + (income.amount || 0);
    return acc;
  }, {});

  // Monthly trend (last 6 months)
  const getMonthlyTrend = () => {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = date.toISOString().slice(0, 7); // YYYY-MM
      
      const monthExpenses = Array.isArray(data.expenses) ? data.expenses
        .filter(expense => expense.date && expense.date.startsWith(monthStr))
        .reduce((sum, expense) => sum + (expense.amount || 0), 0) : 0;
        
      const monthIncome = Array.isArray(data.income) ? data.income
        .filter(income => income.date && income.date.startsWith(monthStr))
        .reduce((sum, income) => sum + (income.amount || 0), 0) : 0;
      
      months.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        income: monthIncome,
        expenses: monthExpenses,
        net: monthIncome - monthExpenses
      });
    }
    
    return months;
  };

  const monthlyTrend = getMonthlyTrend();

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Financial Reports</h1>
                <p className="text-gray-600">Analyze your financial performance and trends</p>
              </div>
              <div className="flex gap-2">
                {[
                  { key: 'thisMonth', label: 'This Month' },
                  { key: 'last3Months', label: 'Last 3 Months' },
                  { key: 'thisYear', label: 'This Year' },
                  { key: 'allTime', label: 'All Time' }
                ].map((range) => (
                  <button
                    key={range.key}
                    onClick={() => setDateRange(range.key)}
                    className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                      dateRange === range.key
                        ? 'bg-blue-500 text-white shadow-lg'
                        : 'bg-white text-gray-600 hover:bg-gray-50 shadow'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-6">
              {error}
            </div>
          )}

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Total Income</p>
                  <p className="text-2xl font-bold text-green-600">₹{totalIncome.toLocaleString()}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-600">₹{totalExpenses.toLocaleString()}</p>
                </div>
                <div className="bg-red-100 p-3 rounded-full">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Net Cash Flow</p>
                  <p className={`text-2xl font-bold ${netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{Math.abs(netCashFlow).toLocaleString()}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${netCashFlow >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  <svg className={`w-6 h-6 ${netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Savings Rate</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {totalIncome > 0 ? ((netCashFlow / totalIncome) * 100).toFixed(1) : 0}%
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Monthly Trend */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-800 mb-6">6-Month Trend</h3>
              <div className="space-y-4">
                {monthlyTrend.map((month, index) => (
                  <div key={index} className="border-b border-gray-100 pb-4 last:border-b-0">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-700">{month.month}</span>
                      <span className={`font-semibold ${month.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        Net: ₹{Math.abs(month.net).toLocaleString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Income:</span>
                        <span className="text-green-600 font-medium">₹{month.income.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Expenses:</span>
                        <span className="text-red-600 font-medium">₹{month.expenses.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Expense Categories */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-800 mb-6">Expenses by Category</h3>
              <div className="space-y-4">
                {Object.entries(expensesByCategory)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 8)
                  .map(([category, amount]) => {
                    const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
                    return (
                      <div key={category} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-gray-700 font-medium capitalize">{category}</span>
                            <span className="text-gray-600 text-sm">₹{amount.toLocaleString()}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                }
                {Object.keys(expensesByCategory).length === 0 && (
                  <p className="text-gray-500 text-center py-8">No expense data for selected period</p>
                )}
              </div>
            </div>

            {/* Income Sources */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-800 mb-6">Income Sources</h3>
              <div className="space-y-4">
                {Object.entries(incomeBySource)
                  .sort(([,a], [,b]) => b - a)
                  .map(([source, amount]) => {
                    const percentage = totalIncome > 0 ? (amount / totalIncome) * 100 : 0;
                    return (
                      <div key={source} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-gray-700 font-medium capitalize">{source}</span>
                            <span className="text-gray-600 text-sm">₹{amount.toLocaleString()}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                }
                {Object.keys(incomeBySource).length === 0 && (
                  <p className="text-gray-500 text-center py-8">No income data for selected period</p>
                )}
              </div>
            </div>

            {/* Net Worth Summary */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-800 mb-6">Net Worth Overview</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-green-50 rounded-xl">
                  <span className="text-gray-700 font-medium">Investments</span>
                  <span className="text-green-600 font-semibold">₹{totalInvestments.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-red-50 rounded-xl">
                  <span className="text-gray-700 font-medium">Total Debts</span>
                  <span className="text-red-600 font-semibold">₹{totalDebt.toLocaleString()}</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-800">Net Worth</span>
                    <span className={`text-lg font-bold ${
                      (totalInvestments - totalDebt) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ₹{Math.abs(totalInvestments - totalDebt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}