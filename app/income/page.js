"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import { incomeAPI } from '../lib/api';

function IncomeContent() {
  const { user } = useAuth();
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All Categories');
  const [stats, setStats] = useState({
    totalIncome: 0,
    monthlyIncome: 0,
    incomeCount: 0,
    averageIncome: 0
  });

  useEffect(() => {
    fetchIncomes();
  }, [filter]);

  const fetchIncomes = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = {};
      if (filter !== 'All Categories') {
        params.category = filter;
      }
      
      const response = await incomeAPI.getAll(params);
      
      if (response.success) {
        setIncomes(response.incomes || []);
        calculateStats(response.incomes || []);
      } else {
        throw new Error(response.error || 'Failed to fetch incomes');
      }
    } catch (err) {
      console.error('Error fetching incomes:', err);
      setError(err.message);
      setIncomes([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (incomeData) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyIncomes = incomeData.filter(income => {
      const incomeDate = new Date(income.createdAt || income.date);
      return incomeDate.getMonth() === currentMonth && 
             incomeDate.getFullYear() === currentYear;
    });

    const totalAmount = incomeData.reduce((sum, income) => sum + (income.amount || 0), 0);
    const monthlyAmount = monthlyIncomes.reduce((sum, income) => sum + (income.amount || 0), 0);

    setStats({
      totalIncome: totalAmount,
      monthlyIncome: monthlyAmount,
      incomeCount: incomeData.length,
      averageIncome: incomeData.length > 0 ? totalAmount / incomeData.length : 0
    });
  };

  const handleDelete = async (incomeId) => {
    if (!window.confirm('Are you sure you want to delete this income source?')) {
      return;
    }

    try {
      await incomeAPI.delete(incomeId);
      await fetchIncomes(); // Refresh the list
    } catch (err) {
      console.error('Error deleting income:', err);
      alert('Failed to delete income. Please try again.');
    }
  };

  const handleEdit = (incomeId) => {
    // Navigate to edit page - we'll create this later
    window.location.href = `/income/edit/${incomeId}`;
  };

  const categories = [
    'All Categories',
    'Salary',
    'Freelance', 
    'Business',
    'Investment',
    'Rental',
    'Passive',
    'Other'
  ];

  const getCategoryIcon = (category) => {
    const icons = {
      'Salary': '💼',
      'Freelance': '💻',
      'Business': '🏢',
      'Investment': '📈',
      'Rental': '🏠',
      'Passive': '💰',
      'Other': '💵'
    };
    return icons[category] || icons['Other'];
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Salary': 'from-blue-400 to-blue-600',
      'Freelance': 'from-purple-400 to-purple-600',
      'Business': 'from-green-400 to-green-600',
      'Investment': 'from-yellow-400 to-orange-600',
      'Rental': 'from-indigo-400 to-indigo-600',
      'Passive': 'from-emerald-400 to-emerald-600',
      'Other': 'from-gray-400 to-gray-600'
    };
    return colors[category] || colors['Other'];
  };

  const getFrequencyBadge = (frequency, isRecurring) => {
    if (!isRecurring) {
      return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">One-time</span>;
    }

    const colors = {
      'Daily': 'bg-green-100 text-green-700',
      'Weekly': 'bg-blue-100 text-blue-700',
      'Monthly': 'bg-purple-100 text-purple-700',
      'Quarterly': 'bg-orange-100 text-orange-700',
      'Yearly': 'bg-red-100 text-red-700'
    };

    return (
      <span className={`px-2 py-1 text-xs rounded-full ${colors[frequency] || 'bg-gray-100 text-gray-600'}`}>
        {frequency}
      </span>
    );
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your income data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent mb-2">
                Income Management
              </h1>
              <p className="text-gray-600 text-lg">Track all your income sources and earnings</p>
            </div>
            <Link 
              href="/income/new" 
              className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium shadow-lg hover:shadow-xl"
            >
              + Add Income
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">💰</span>
              </div>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Total Income</h3>
            <p className="text-2xl font-bold text-gray-900">₹{stats.totalIncome.toLocaleString()}</p>
            <p className="text-sm text-green-600">All time earnings</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">📅</span>
              </div>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">This Month</h3>
            <p className="text-2xl font-bold text-gray-900">₹{stats.monthlyIncome.toLocaleString()}</p>
            <p className="text-sm text-blue-600">Monthly earnings</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">📊</span>
              </div>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Income Sources</h3>
            <p className="text-2xl font-bold text-gray-900">{stats.incomeCount}</p>
            <p className="text-sm text-purple-600">Active sources</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">📈</span>
              </div>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Average Income</h3>
            <p className="text-2xl font-bold text-gray-900">₹{Math.round(stats.averageIncome).toLocaleString()}</p>
            <p className="text-sm text-orange-600">Per source</p>
          </div>
        </div>

        {/* Income List */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Your Income Sources</h2>
              <p className="text-gray-600">Manage and track all your earnings</p>
            </div>
            <div className="flex space-x-3">
              <select 
                value={filter} 
                onChange={(e) => handleFilterChange(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          {incomes.length > 0 ? (
            <div className="space-y-4">
              {incomes.map((income) => (
                <div key={income.id} className="bg-white p-6 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                  <div className={`absolute left-0 top-0 w-1 h-full bg-gradient-to-b ${getCategoryColor(income.category)} rounded-l-xl`}></div>
                  
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-3xl">
                        {getCategoryIcon(income.category)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{income.title}</h3>
                          {getFrequencyBadge(income.frequency, income.isRecurring)}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{income.category} • {income.source}</p>
                        <p className="text-sm text-gray-500">{income.description}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600 mb-1">
                        +₹{income.amount.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(income.date)}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end mt-4 space-x-2">
                    <button className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium">
                      Edit
                    </button>
                    <button className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No income recorded yet</h3>
              <p className="text-gray-600 mb-6">Start tracking your earnings by adding your first income source</p>
              <Link 
                href="/income/new" 
                className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Add Your First Income
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function IncomePage() {
  return (
    <ProtectedRoute>
      <IncomeContent />
    </ProtectedRoute>
  );
}