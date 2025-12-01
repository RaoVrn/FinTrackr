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
  const [searchTerm, setSearchTerm] = useState('');
  const [summary, setSummary] = useState({
    totalIncome: 0,
    monthlyIncome: 0,
    incomeSourcesCount: 0,
    averageIncomePerSource: 0,
    recurringIncomeCount: 0,
    nextExpectedIncome: null,
    categoryBreakdown: {},
    totalEntries: 0
  });

  useEffect(() => {
    fetchIncomes();
    fetchSummary();
  }, [filter, searchTerm]);

  const fetchIncomes = async () => {
    try {
      setError('');
      
      const params = {};
      if (filter !== 'All Categories') {
        params.category = filter.toLowerCase();
      }
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      
      const response = await fetch('/api/income?' + new URLSearchParams(params), {
        headers: {
          'authorization': `Bearer ${localStorage.getItem('fintrackr_token')}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setIncomes(data.incomes || []);
      } else {
        throw new Error(data.error || 'Failed to fetch incomes');
      }
    } catch (err) {
      console.error('Error fetching incomes:', err);
      setError(err.message);
      setIncomes([]);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await fetch('/api/income/summary', {
        headers: {
          'authorization': `Bearer ${localStorage.getItem('fintrackr_token')}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSummary(data.summary);
      }
    } catch (err) {
      console.error('Error fetching summary:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (incomeId) => {
    if (!window.confirm('Are you sure you want to delete this income entry?')) {
      return;
    }

    try {
      const response = await fetch(`/api/income/${incomeId}`, {
        method: 'DELETE',
        headers: {
          'authorization': `Bearer ${localStorage.getItem('fintrackr_token')}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        // Refresh data
        fetchIncomes();
        fetchSummary();
      } else {
        throw new Error(data.error || 'Failed to delete income');
      }
    } catch (err) {
      console.error('Error deleting income:', err);
      alert('Failed to delete income: ' + err.message);
    }
  };

  const handleEdit = (incomeId) => {
    // Navigate to edit page - we'll create this later
    window.location.href = `/income/edit/${incomeId}`;
  };

  const categories = [
    'All Categories',
    'Salary',
    'Allowance',
    'Freelance',
    'Bonus',
    'Gift',
    'Rental',
    'Other'
  ];

  const getCategoryIcon = (category) => {
    const icons = {
      'salary': '💼',
      'allowance': '💳',
      'freelance': '💻',
      'bonus': '🎁',
      'gift': '🎀',
      'rental': '🏠',
      'other': '💵'
    };
    return icons[category?.toLowerCase()] || icons['other'];
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };

  const getCategoryColor = (category) => {
    const colors = {
      'salary': 'from-blue-400 to-blue-600',
      'allowance': 'from-indigo-400 to-indigo-600',
      'freelance': 'from-purple-400 to-purple-600',
      'bonus': 'from-yellow-400 to-orange-600',
      'gift': 'from-pink-400 to-pink-600',
      'rental': 'from-green-400 to-green-600',
      'other': 'from-gray-400 to-gray-600'
    };
    return colors[category?.toLowerCase()] || colors['other'];
  };

  const getFrequencyBadge = (frequency, isRecurring) => {
    if (!isRecurring) {
      return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">One-time</span>;
    }

    const colors = {
      'weekly': 'bg-blue-100 text-blue-700',
      'monthly': 'bg-purple-100 text-purple-700',
      'one-time': 'bg-gray-100 text-gray-600'
    };

    const displayText = {
      'weekly': 'Weekly',
      'monthly': 'Monthly',
      'one-time': 'One-time'
    };

    return (
      <span className={`px-2 py-1 text-xs rounded-full ${colors[frequency?.toLowerCase()] || 'bg-gray-100 text-gray-600'}`}>
        {displayText[frequency?.toLowerCase()] || 'One-time'}
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {/* Total Income Card */}
          <div className="bg-white/80 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-white/20">
            <div className="flex items-center justify-center mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">💰</span>
              </div>
            </div>
            <h3 className="font-medium text-gray-900 mb-1 text-sm text-center">Total Income</h3>
            <p className="text-lg font-bold text-gray-900 text-center">₹{summary.totalIncome.toLocaleString()}</p>
            <p className="text-xs text-green-600 text-center">All time earnings</p>
          </div>

          {/* This Month Card */}
          <div className="bg-white/80 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-white/20">
            <div className="flex items-center justify-center mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">📅</span>
              </div>
            </div>
            <h3 className="font-medium text-gray-900 mb-1 text-sm text-center">This Month</h3>
            <p className="text-lg font-bold text-gray-900 text-center">₹{summary.monthlyIncome.toLocaleString()}</p>
            <p className="text-xs text-blue-600 text-center">Monthly earnings</p>
          </div>

          {/* Income Sources Card - Conditionally Hide if No Sources */}
          {summary.incomeSourcesCount > 0 && (
            <div className="bg-white/80 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-white/20">
              <div className="flex items-center justify-center mb-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">📊</span>
                </div>
              </div>
              <h3 className="font-medium text-gray-900 mb-1 text-sm text-center">Income Sources</h3>
              <p className="text-lg font-bold text-gray-900 text-center">{summary.incomeSourcesCount}</p>
              <p className="text-xs text-purple-600 text-center">Active sources</p>
            </div>
          )}

          {/* Average Income Card - Conditionally Hide if No Sources */}
          {summary.incomeSourcesCount > 0 && (
            <div className="bg-white/80 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-white/20">
              <div className="flex items-center justify-center mb-2">
                <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">📈</span>
                </div>
              </div>
              <h3 className="font-medium text-gray-900 mb-1 text-sm text-center">Average Per Source</h3>
              <p className="text-lg font-bold text-gray-900 text-center">₹{Math.round(summary.averageIncomePerSource).toLocaleString()}</p>
              <p className="text-xs text-orange-600 text-center">Per source</p>
            </div>
          )}
        </div>

        {/* Expected Income Section - Only Show if Recurring Income Exists */}
        {summary.recurringIncomeCount > 0 && summary.nextExpectedIncome && (
          <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border border-white/20 p-3 mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg">⏰</span>
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900 mb-1">Next Expected Income</h3>
                <p className="text-gray-600">
                  <span className="font-medium">{summary.nextExpectedIncome.title}</span> - 
                  <span className="text-green-600 font-bold"> ₹{summary.nextExpectedIncome.amount.toLocaleString()}</span>
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Expected on {formatDate(summary.nextExpectedIncome.date)} • {summary.nextExpectedIncome.frequency} • {summary.nextExpectedIncome.source}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Income List */}
        <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border border-white/20 p-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 space-y-3 lg:space-y-0">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Your Income Sources</h2>
              <p className="text-sm text-gray-600">Manage and track all your earnings</p>
            </div>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search income..."
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 w-full sm:w-64"
                />
                <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              
              {/* Category Filter */}
              <select 
                value={filter} 
                onChange={(e) => setFilter(e.target.value)}
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
                <div key={income._id} className="relative bg-white p-3 rounded-lg border border-gray-100 hover:shadow-md transition-shadow">
                  <div className={`absolute left-0 top-0 w-1 h-full bg-gradient-to-b ${getCategoryColor(income.category)} rounded-l-lg`}></div>
                  
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="text-2xl">
                        {getCategoryIcon(income.category)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-1">
                          <h3 className="text-base font-semibold text-gray-900">{income.title}</h3>
                          {getFrequencyBadge(income.frequency, income.isRecurring)}
                        </div>
                        <p className="text-sm text-gray-600 mb-1 capitalize">{income.category} • {income.source}</p>
                        {income.description && (
                          <p className="text-sm text-gray-500">{income.description}</p>
                        )}
                        <div className="flex items-center space-x-4 mt-2">
                          {income.paymentMethod && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded capitalize">
                              {income.paymentMethod.replace('-', ' ')}
                            </span>
                          )}
                          {income.time && (
                            <span className="text-xs text-gray-500">
                              {income.time}
                            </span>
                          )}
                          {income.tags && income.tags.length > 0 && (
                            <div className="flex space-x-1">
                              {income.tags.slice(0, 2).map((tag, index) => (
                                <span key={index} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                  {tag}
                                </span>
                              ))}
                              {income.tags.length > 2 && (
                                <span className="text-xs text-gray-500">+{income.tags.length - 2} more</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right ml-4">
                      <p className="text-2xl font-bold text-green-600 mb-1">
                        +₹{income.amount.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(income.date)}
                      </p>
                      {income.isRecurring && income.nextOccurrence && (
                        <p className="text-xs text-blue-600 mt-1">
                          Next: {formatDate(income.nextOccurrence)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end mt-4 space-x-2">
                    <button 
                      onClick={() => handleEdit(income._id)}
                      className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(income._id)}
                      className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {summary.totalIncome === 0 ? 'No income recorded yet' : 'No results found'}
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {summary.totalIncome === 0 
                  ? 'Start tracking your earnings by adding your first income source'
                  : 'Try adjusting your search or filter criteria to find income entries'
                }
              </p>
              {summary.totalIncome === 0 ? (
                <Link 
                  href="/income/new" 
                  className="inline-flex items-center px-8 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium text-lg shadow-lg hover:shadow-xl"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Add Your First Income
                </Link>
              ) : (
                <div className="space-x-4">
                  <button 
                    onClick={() => {setFilter('All Categories'); setSearchTerm('');}}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    Clear Filters
                  </button>
                  <Link 
                    href="/income/new" 
                    className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    Add Income
                  </Link>
                </div>
              )}
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