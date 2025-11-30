"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "../components/ProtectedRoute";
import { expenseAPI } from "../lib/api";
import { useAuth } from "../context/AuthContext";

function DashboardContent() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalExpenses: 0,
    totalAmount: 0,
    categoriesCount: 0,
    monthlyTotal: 0
  });

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const data = await expenseAPI.getAll();
        setExpenses(data);
        calculateStats(data);
      } catch (error) {
        console.error('Error fetching expenses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
  }, []);

  const calculateStats = (expenseData) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyExpenses = expenseData.filter(expense => {
      const expenseDate = new Date(expense.createdAt || expense.date);
      return expenseDate.getMonth() === currentMonth && 
             expenseDate.getFullYear() === currentYear;
    });

    const categories = [...new Set(expenseData.map(exp => exp.category).filter(Boolean))];
    
    setStats({
      totalExpenses: expenseData.length,
      totalAmount: expenseData.reduce((sum, exp) => sum + (exp.amount || 0), 0),
      categoriesCount: categories.length,
      monthlyTotal: monthlyExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)
    });
  };

  const getCategoryStats = () => {
    const categoryTotals = {};
    expenses.forEach(expense => {
      const category = expense.category || 'Uncategorized';
      categoryTotals[category] = (categoryTotals[category] || 0) + (expense.amount || 0);
    });

    return Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);
  };

  const getRecentExpenses = () => {
    return expenses
      .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
      .slice(0, 3);
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'Food': '🍽️',
      'Transport': '🚗',
      'Entertainment': '🎬',
      'Shopping': '🛍️',
      'Bills': '📄',
      'Health': '🏥',
      'Education': '📚',
      'Travel': '✈️',
      'Uncategorized': '💰'
    };
    return icons[category] || icons['Uncategorized'];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user?.name} 👋</p>
            </div>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Primary Stat - Total Balance */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-blue-100 mb-2">Total Spending</p>
                    <p className="text-5xl font-bold mb-2">₹{stats.totalAmount.toLocaleString()}</p>
                    <div className="flex items-center space-x-2">
                      <span className="text-green-300 text-sm">↗ 0% this month</span>
                    </div>
                  </div>
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <p className="text-blue-100 text-sm mb-1">This Month</p>
                    <p className="text-2xl font-bold">₹{stats.monthlyTotal.toLocaleString()}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <p className="text-blue-100 text-sm mb-1">Total Expenses</p>
                    <p className="text-2xl font-bold">{stats.totalExpenses}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <Link href="/expenses/new" className="block">
              <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-emerald-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Add Expense</p>
                  <p className="text-sm text-gray-500">Record new transaction</p>
                </div>
              </div>
            </Link>

            <Link href="/expenses" className="block">
              <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">View All</p>
                  <p className="text-sm text-gray-500">Browse expenses</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 group border border-gray-100">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">{stats.categoriesCount}</p>
              <p className="text-sm text-gray-500">Categories</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 group border border-gray-100">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">₹{stats.totalAmount > 0 ? Math.round(stats.totalAmount / Math.max(stats.totalExpenses, 1)) : 0}</p>
              <p className="text-sm text-gray-500">Avg per expense</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 group border border-gray-100">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">0</p>
              <p className="text-sm text-gray-500">Goals achieved</p>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Categories */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">Top Categories</h2>
                <p className="text-sm text-gray-500">Your spending breakdown</p>
              </div>
              <Link href="/expenses" className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1 transition-colors">
                <span>View All</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {getCategoryStats().length > 0 ? (
              <div className="space-y-4">
                {getCategoryStats().map(([category, amount], index) => (
                  <div key={category} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center">
                        <span className="text-lg">{getCategoryIcon(category)}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900">{category}</span>
                        <p className="text-xs text-gray-500">{stats.totalAmount > 0 ? Math.round((amount/stats.totalAmount)*100) : 0}% of total</p>
                      </div>
                    </div>
                    <span className="font-bold text-gray-900">₹{amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-gray-500 mb-4">Add some expenses to see your spending breakdown</p>
              </div>
            )}
          </div>

          {/* Recent Expenses */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">Recent Expenses</h2>
                <p className="text-sm text-gray-500">Your latest transactions</p>
              </div>
              <Link href="/expenses" className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1 transition-colors">
                <span>View All</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {getRecentExpenses().length > 0 ? (
              <div className="space-y-4">
                {getRecentExpenses().map((expense) => (
                  <div key={expense._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center">
                        <span className="text-lg">{getCategoryIcon(expense.category)}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{expense.title}</p>
                        <p className="text-xs text-gray-500">{expense.category || 'Uncategorized'}</p>
                      </div>
                    </div>
                    <span className="font-bold text-gray-900">₹{expense.amount?.toLocaleString() || 0}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <p className="text-gray-500 mb-4">No expenses yet</p>
                <Link href="/expenses/new" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Add First Expense
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}