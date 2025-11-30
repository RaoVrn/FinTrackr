"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Dashboard() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalExpenses: 0,
    totalAmount: 0,
    categoriesCount: 0,
    monthlyTotal: 0
  });

  useEffect(() => {
    fetch("/api/expenses")
      .then((res) => res.json())
      .then((data) => {
        setExpenses(data);
        calculateStats(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching expenses:', error);
        setLoading(false);
      });
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
      .slice(0, 5);
  };

  const getRecentExpenses = () => {
    return expenses
      .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
      .slice(0, 5);
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Overview of your financial activity</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="stat-card animate-scale-in">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Expenses</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalExpenses}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </div>

        <div className="stat-card animate-scale-in" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Amount</p>
              <p className="text-3xl font-bold text-gray-900">₹{stats.totalAmount.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>

        <div className="stat-card animate-scale-in" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-3xl font-bold text-gray-900">₹{stats.monthlyTotal.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <span className="text-2xl">📅</span>
            </div>
          </div>
        </div>

        <div className="stat-card animate-scale-in" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Categories</p>
              <p className="text-3xl font-bold text-gray-900">{stats.categoriesCount}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <span className="text-2xl">🏷️</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Categories */}
        <div className="card animate-slide-up">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Top Categories</h2>
            <Link href="/expenses" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View All →
            </Link>
          </div>
          
          {getCategoryStats().length > 0 ? (
            <div className="space-y-4">
              {getCategoryStats().map(([category, amount], index) => (
                <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{getCategoryIcon(category)}</span>
                    <span className="font-medium text-gray-900">{category}</span>
                  </div>
                  <span className="font-semibold text-gray-900">₹{amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <span className="text-4xl mb-2 block">📊</span>
              <p>No category data yet</p>
            </div>
          )}
        </div>

        {/* Recent Expenses */}
        <div className="card animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Recent Expenses</h2>
            <Link href="/expenses" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View All →
            </Link>
          </div>
          
          {getRecentExpenses().length > 0 ? (
            <div className="space-y-4">
              {getRecentExpenses().map((expense) => (
                <div key={expense._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{getCategoryIcon(expense.category)}</span>
                    <div>
                      <p className="font-medium text-gray-900">{expense.title}</p>
                      <p className="text-sm text-gray-500">{expense.category || 'Uncategorized'}</p>
                    </div>
                  </div>
                  <span className="font-semibold text-gray-900">₹{expense.amount?.toLocaleString() || 0}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <span className="text-4xl mb-2 block">💸</span>
              <p>No expenses yet</p>
              <Link 
                href="/expenses/new"
                className="btn-primary mt-4 inline-block"
              >
                Add First Expense
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 animate-fade-in">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link 
            href="/expenses/new"
            className="card card-hover text-center group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-200">➕</div>
            <h3 className="font-semibold text-gray-900">Add Expense</h3>
            <p className="text-sm text-gray-600 mt-1">Record a new expense</p>
          </Link>
          
          <Link 
            href="/expenses"
            className="card card-hover text-center group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-200">📋</div>
            <h3 className="font-semibold text-gray-900">View All</h3>
            <p className="text-sm text-gray-600 mt-1">Browse all expenses</p>
          </Link>
          
          <div className="card text-center opacity-50">
            <div className="text-3xl mb-2">📈</div>
            <h3 className="font-semibold text-gray-900">Analytics</h3>
            <p className="text-sm text-gray-600 mt-1">Coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}