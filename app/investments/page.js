'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '../components/ProtectedRoute';
import { 
  formatCurrency, 
  formatPercent, 
  getInvestmentTypeDisplayName,
  getRiskLevelColor,
  getPnLColor,
  filterInvestments,
  sortInvestments,
  calculatePortfolioSummary
} from '../lib/investmentUtils';

export default function InvestmentsPage() {
  const [portfolioData, setPortfolioData] = useState({
    totalInvested: 0,
    currentValue: 0,
    totalPnL: 0,
    portfolioCount: 0,
    pnlPercent: 0,
    investments: [],
    assetAllocation: []
  });
  const [totalInvestments, setTotalInvestments] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    type: 'all',
    riskLevel: 'all',
    search: ''
  });
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const { user, token, isAuthenticated, getAuthHeaders } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      fetchTotalInvestments();
      fetchInvestments();
    }
  }, [filters, isAuthenticated]);

  const fetchTotalInvestments = async () => {
    try {
      if (!token) return;
      const response = await fetch('/api/investments', {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setTotalInvestments(data.portfolioCount || 0);
      }
    } catch (error) {
      console.error('Error fetching total investments:', error);
    }
  };

  const fetchInvestments = async () => {
    try {
      setLoading(true);
      if (!token) {
        setError('Authentication required');
        return;
      }

      // Build query parameters
      const params = new URLSearchParams();
      if (filters.type !== 'all') params.append('type', filters.type);
      if (filters.riskLevel !== 'all') params.append('riskLevel', filters.riskLevel);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`/api/investments?${params.toString()}`, {
        headers: getAuthHeaders(),
      });

      if (response.status === 401) {
        setError('Session expired. Please login again.');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch investments');
      }

      const data = await response.json();
      setPortfolioData(data);
      setError('');
    } catch (error) {
      console.error('Error fetching investments:', error);
      setError('Failed to fetch investments');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this investment?')) {
      try {
        const response = await fetch(`/api/investments/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });

        if (!response.ok) {
          throw new Error('Failed to delete investment');
        }

        // Refresh the data
        fetchInvestments();
      } catch (error) {
        console.error('Error deleting investment:', error);
        setError('Failed to delete investment');
      }
    }
  };

  const handleEdit = (investment) => {
    setEditingId(investment._id);
    setEditFormData({
      name: investment.name,
      type: investment.type,
      category: investment.category || '',
      sector: investment.sector || '',
      riskLevel: investment.riskLevel,
      investedAmount: investment.investedAmount,
      currentValue: investment.currentValue,
      quantity: investment.quantity || '',
      pricePerUnit: investment.pricePerUnit || '',
      fees: investment.fees || 0,
      tickerSymbol: investment.tickerSymbol || '',
      isin: investment.isin || '',
      notes: investment.notes || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({});
  };

  const handleSaveEdit = async () => {
    try {
      setEditLoading(true);
      const response = await fetch(`/api/investments/${editingId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...editFormData,
          investedAmount: parseFloat(editFormData.investedAmount),
          currentValue: parseFloat(editFormData.currentValue),
          quantity: editFormData.quantity ? parseFloat(editFormData.quantity) : undefined,
          pricePerUnit: editFormData.pricePerUnit ? parseFloat(editFormData.pricePerUnit) : undefined,
          fees: parseFloat(editFormData.fees) || 0
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update investment');
      }

      setEditingId(null);
      setEditFormData({});
      fetchInvestments();
    } catch (error) {
      console.error('Error updating investment:', error);
      setError('Failed to update investment');
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditInputChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Apply sorting to investments
  const sortedInvestments = sortInvestments(portfolioData.investments, sortBy, sortOrder);

  // Investment type options for filtering
  const investmentTypes = [
    { value: 'all', label: 'All' },
    { value: 'stocks', label: 'Stocks' },
    { value: 'mutual-fund', label: 'Mutual Funds' },
    { value: 'crypto', label: 'Crypto' },
    { value: 'bonds', label: 'Bonds' },
    { value: 'real-estate', label: 'Real Estate' },
    { value: 'etf', label: 'ETF' },
    { value: 'gold', label: 'Gold' },
    { value: 'ppf', label: 'PPF' },
    { value: 'nps', label: 'NPS' }
  ];

  const riskLevels = [
    { value: 'all', label: 'All Risk Levels' },
    { value: 'low', label: 'Low Risk' },
    { value: 'moderate', label: 'Moderate Risk' },
    { value: 'high', label: 'High Risk' }
  ];

  if (loading) {
    return (
      <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="relative mb-6">
              <div className="w-20 h-20 border-4 border-gray-200 rounded-full"></div>
              <div className="w-20 h-20 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            </div>
            <div className="space-y-2">
              <p className="text-xl font-semibold text-gray-800">Loading Investments</p>
              <p className="text-gray-600">Fetching your portfolio data...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-purple-600 mb-2">
                Investment Management
              </h1>
              <p className="text-gray-600">Track and manage your investment portfolio</p>
            </div>
            <button
              onClick={() => router.push('/investments/new')}
              className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              + Add Investment
            </button>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-6">
              {error}
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">Total Invested</p>
                    <p className="text-xl font-bold text-indigo-600">
                      {formatCurrency(portfolioData.totalInvested)}
                    </p>
                  </div>
                  <div className="bg-indigo-100 p-3 rounded-full">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">Current Value</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(portfolioData.currentValue)}
                    </p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">Total P&L</p>
                    <p className={`text-xl font-bold ${getPnLColor(portfolioData.totalPnL)}`}>
                      {portfolioData.totalPnL >= 0 ? '+' : ''}{formatCurrency(portfolioData.totalPnL)}
                    </p>
                    <p className={`text-sm ${getPnLColor(portfolioData.totalPnL)}`}>
                      ({portfolioData.totalPnL >= 0 ? '+' : ''}{formatPercent(portfolioData.pnlPercent)})
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${portfolioData.totalPnL >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                    <svg className={`w-6 h-6 ${getPnLColor(portfolioData.totalPnL)}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={portfolioData.totalPnL >= 0 ? "M7 11l5-5m0 0l5 5m-5-5v12" : "M17 13l-5 5m0 0l-5-5m5 5V6"} />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">Portfolio Count</p>
                    <p className="text-xl font-bold text-purple-600">{portfolioData.portfolioCount}</p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-full">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

          {/* Investments List */}
          <div className="space-y-6">

              <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <h3 className="text-xl font-semibold text-gray-800">Your Investments</h3>
                    <div className="flex gap-3">
                      <select
                        value={`${sortBy}-${sortOrder}`}
                        onChange={(e) => {
                          const [field, order] = e.target.value.split('-');
                          setSortBy(field);
                          setSortOrder(order);
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="createdAt-desc">Latest First</option>
                        <option value="createdAt-asc">Oldest First</option>
                        <option value="name-asc">Name A-Z</option>
                        <option value="name-desc">Name Z-A</option>
                        <option value="currentValue-desc">Highest Value</option>
                        <option value="currentValue-asc">Lowest Value</option>
                        <option value="pnlPercent-desc">Best Performance</option>
                        <option value="pnlPercent-asc">Worst Performance</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1 max-w-sm">
                      <input
                        type="text"
                        placeholder="Search investments..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {investmentTypes.map((type) => (
                        <button
                          key={type.value}
                          onClick={() => handleFilterChange('type', type.value)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            filters.type === type.value
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                    <div>
                      <select
                        value={filters.riskLevel}
                        onChange={(e) => handleFilterChange('riskLevel', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        {riskLevels.map((level) => (
                          <option key={level.value} value={level.value}>
                            {level.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="px-6 pb-6">
                  {portfolioData.investments.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {totalInvestments === 0 ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          )}
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {totalInvestments === 0 ? 'Start building your portfolio' : 'No investments match your filters'}
                      </h3>
                      <p className="text-gray-500 mb-4">
                        {totalInvestments === 0 
                          ? 'Add your first investment to start tracking your portfolio performance.'
                          : 'Try adjusting your search criteria or clearing filters to see more results.'
                        }
                      </p>
                      {totalInvestments === 0 ? (
                        <button
                          onClick={() => router.push('/investments/new')}
                          className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                        >
                          + Add Your First Investment
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setFilters({ type: 'all', riskLevel: 'all', search: '' });
                          }}
                          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  ) : (
                  <div className="space-y-4">
                    {sortedInvestments.map((investment) => (
                      <div key={investment._id} className="border border-gray-200 rounded-xl p-6 hover:bg-gray-50 transition-colors duration-200">
                        {editingId === investment._id ? (
                          // Edit Mode
                          <div className="space-y-6">
                            <div className="flex items-center justify-between">
                              <h4 className="text-lg font-semibold text-gray-800">Edit Investment</h4>
                              <div className="flex gap-2">
                                <button
                                  onClick={handleSaveEdit}
                                  disabled={editLoading}
                                  className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-2xl font-semibold hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 transition-all duration-300 shadow-lg hover:shadow-xl"
                                >
                                  {editLoading ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-3 rounded-2xl font-semibold hover:from-gray-600 hover:to-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input
                                  type="text"
                                  value={editFormData.name || ''}
                                  onChange={(e) => handleEditInputChange('name', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                <select
                                  value={editFormData.type || ''}
                                  onChange={(e) => handleEditInputChange('type', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                >
                                  <option value="stocks">Stocks</option>
                                  <option value="mutual-fund">Mutual Funds</option>
                                  <option value="crypto">Cryptocurrency</option>
                                  <option value="bonds">Bonds</option>
                                  <option value="real-estate">Real Estate</option>
                                  <option value="etf">ETF</option>
                                  <option value="gold">Gold</option>
                                  <option value="ppf">PPF</option>
                                  <option value="nps">NPS</option>
                                </select>
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <input
                                  type="text"
                                  value={editFormData.category || ''}
                                  onChange={(e) => handleEditInputChange('category', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  placeholder="e.g., Large Cap"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Sector</label>
                                <input
                                  type="text"
                                  value={editFormData.sector || ''}
                                  onChange={(e) => handleEditInputChange('sector', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  placeholder="e.g., Technology"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Risk Level</label>
                                <select
                                  value={editFormData.riskLevel || ''}
                                  onChange={(e) => handleEditInputChange('riskLevel', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                >
                                  <option value="low">Low Risk</option>
                                  <option value="moderate">Moderate Risk</option>
                                  <option value="high">High Risk</option>
                                </select>
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Invested Amount</label>
                                <input
                                  type="number"
                                  value={editFormData.investedAmount || ''}
                                  onChange={(e) => handleEditInputChange('investedAmount', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                  step="0.01"
                                  min="0"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Current Value</label>
                                <input
                                  type="number"
                                  value={editFormData.currentValue || ''}
                                  onChange={(e) => handleEditInputChange('currentValue', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                  step="0.01"
                                  min="0"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                                <input
                                  type="number"
                                  value={editFormData.quantity || ''}
                                  onChange={(e) => handleEditInputChange('quantity', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                  step="0.001"
                                  min="0"
                                  placeholder="Optional"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Price Per Unit</label>
                                <input
                                  type="number"
                                  value={editFormData.pricePerUnit || ''}
                                  onChange={(e) => handleEditInputChange('pricePerUnit', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                  step="0.01"
                                  min="0"
                                  placeholder="Optional"
                                />
                              </div>
                            </div>
                            
                            {/* Real-time P&L preview during edit */}
                            {editFormData.investedAmount && editFormData.currentValue && (
                              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-200/50">
                                <h5 className="font-medium text-gray-800 mb-2">Preview</h5>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-600">Invested: </span>
                                    <span className="font-semibold">{formatCurrency(parseFloat(editFormData.investedAmount))}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Current: </span>
                                    <span className="font-semibold">{formatCurrency(parseFloat(editFormData.currentValue))}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">P&L: </span>
                                    {(() => {
                                      const pnl = parseFloat(editFormData.currentValue) - parseFloat(editFormData.investedAmount);
                                      const pnlPercent = (pnl / parseFloat(editFormData.investedAmount)) * 100;
                                      return (
                                        <span className={`font-semibold ${getPnLColor(pnl)}`}>
                                          {pnl >= 0 ? '+' : ''}{formatCurrency(Math.abs(pnl))} ({pnl >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)
                                        </span>
                                      );
                                    })()}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          // Display Mode
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <h4 className="text-lg font-semibold text-gray-800">{investment.name}</h4>
                                {investment.tickerSymbol && (
                                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-lg text-sm font-medium">
                                    {investment.tickerSymbol}
                                  </span>
                                )}
                                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-lg text-sm font-medium">
                                  {getInvestmentTypeDisplayName(investment.type)}
                                </span>
                                <span className={`px-2 py-1 rounded-lg text-sm font-medium ${getRiskLevelColor(investment.riskLevel)}`}>
                                  {investment.riskLevel} risk
                                </span>
                                {investment.isSIP && (
                                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-lg text-sm font-medium">
                                    SIP
                                  </span>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                  <p className="text-sm text-gray-500">Invested</p>
                                  <p className="font-semibold text-gray-800">
                                    {formatCurrency(investment.investedAmount)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Current Value</p>
                                  <p className="font-semibold text-gray-800">
                                    {formatCurrency(investment.currentValue)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">P&L</p>
                                  <p className={`font-semibold ${getPnLColor(investment.pnl)}`}>
                                    {investment.pnl >= 0 ? '+' : ''}{formatCurrency(investment.pnl)}
                                    <span className="text-sm ml-1">
                                      ({investment.pnl >= 0 ? '+' : ''}{formatPercent(investment.pnlPercent)})
                                    </span>
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">CAGR</p>
                                  <p className={`font-semibold ${getPnLColor(investment.cagr)}`}>
                                    {investment.cagr >= 0 ? '+' : ''}{formatPercent(investment.cagr)}
                                  </p>
                                </div>
                              </div>
                              
                              {investment.category && (
                                <div className="mt-2">
                                  <span className="text-sm text-gray-500">Category: </span>
                                  <span className="text-sm font-medium text-gray-700">{investment.category}</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-3">
                              <button
                                onClick={() => handleEdit(investment)}
                                className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-2xl font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(investment._id)}
                                className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-xl font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  )}
                </div>
              </div>
          </div>

          {/* Asset Allocation */}
          {portfolioData.assetAllocation && portfolioData.assetAllocation.length > 0 && (
            <div className="mt-8 bg-white rounded-2xl shadow-lg border border-gray-100">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-6">Asset Allocation</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {portfolioData.assetAllocation.map((asset) => (
                    <div key={asset.type} className="border border-gray-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-800">
                          {getInvestmentTypeDisplayName(asset.type)}
                        </h4>
                        <span className="text-lg font-bold text-blue-600">
                          {((asset.currentValue / portfolioData.currentValue) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Value:</span>
                          <span className="font-medium">{formatCurrency(asset.currentValue)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Count:</span>
                          <span className="font-medium">{asset.count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}