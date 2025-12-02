'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '../components/ProtectedRoute';
import { debtAPI, debtHelpers } from '../lib/api';

function DebtsContent() {
  const [debts, setDebts] = useState([]);
  const [summary, setSummary] = useState({
    totalDebt: 0,
    totalPaid: 0,
    activeDebts: 0,
    avgProgress: 0,
    count: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    category: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchDebts();
  }, [filters, searchTerm]);

  const fetchDebts = async () => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        search: searchTerm || undefined
      };
      
      const response = await debtAPI.getAll(params);
      if (response.success) {
        setDebts(response.debts || []);
        setSummary(response.summary || {
          totalDebt: 0,
          totalPaid: 0,
          activeDebts: 0,
          avgProgress: 0,
          count: 0
        });
      } else {
        throw new Error(response.error);
      }
      setError('');
    } catch (error) {
      console.error('Error fetching debts:', error);
      setError('Failed to fetch debts');
      setDebts([]);
      setSummary({
        totalDebt: 0,
        totalPaid: 0,
        activeDebts: 0,
        avgProgress: 0,
        count: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this debt?')) {
      try {
        await debtAPI.delete(id);
        fetchDebts(); // Refresh the list
      } catch (error) {
        console.error('Error deleting debt:', error);
        setError('Failed to delete debt');
      }
    }
  };

  const handleAddPayment = async (debtId, paymentData) => {
    try {
      await debtAPI.addPayment(debtId, paymentData);
      fetchDebts(); // Refresh the list
    } catch (error) {
      console.error('Error adding payment:', error);
      setError('Failed to add payment');
    }
  };

  const handleUpdate = async (debtId, updateData) => {
    try {
      console.log('Updating debt:', { debtId, updateData });
      const result = await debtAPI.update(debtId, updateData);
      console.log('Update result:', result);
      fetchDebts(); // Refresh the list
    } catch (error) {
      console.error('Error updating debt:', error);
      throw error;
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      type: 'all',
      status: 'all',
      category: 'all'
    });
    setSearchTerm('');
  };

  // Get filter options
  const debtTypes = debtHelpers.getDebtTypes();
  const statuses = debtHelpers.getStatuses();

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your debt data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-orange-600 mb-2">
                Debt Management
              </h1>
              <p className="text-gray-600 text-lg">
                Track and manage your debts and payments
              </p>
            </div>
            <Link 
              href="/debts/new" 
              className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-3 rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all duration-200 flex items-center space-x-2 shadow-lg font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Debt</span>
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Debt</p>
                <p className="text-2xl font-bold text-gray-900">₹{summary.totalDebt.toLocaleString()}</p>
                <p className="text-xs text-gray-400">Outstanding balance</p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Paid</p>
                <p className="text-2xl font-bold text-orange-600">₹{summary.totalPaid.toLocaleString()}</p>
                <p className="text-xs text-gray-400">Amount repaid</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Active Debts</p>
                <p className="text-2xl font-bold text-purple-600">{summary.activeDebts}</p>
                <p className="text-xs text-gray-400">Currently active</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Avg Progress</p>
                <p className="text-2xl font-bold text-green-600">{summary.avgProgress || 0}%</p>
                <p className="text-xs text-gray-400">Payoff progress</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Section Header */}
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Your Debt Sources</h2>
                <p className="text-sm text-gray-600 mt-1">Manage and track all your debts</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-4">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search debts..."
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="all">All Statuses</option>
                    {statuses.map(status => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Debts List */}
          <div className="px-6 py-4">
            {debts.length > 0 ? (
              <div className="space-y-4">
                {debts.map((debt) => (
                  <DebtCard
                    key={debt._id}
                    debt={debt}
                    onDelete={() => handleDelete(debt._id)}
                    onAddPayment={(paymentData) => handleAddPayment(debt._id, paymentData)}
                    onUpdate={handleUpdate}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">💳</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {summary.count === 0 ? 'No debts recorded yet' : 'No results found'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {summary.count === 0 
                    ? 'Start managing your debts by adding your first debt entry'
                    : 'Try adjusting your search or filter criteria to find debt entries'
                  }
                </p>
                <Link 
                  href="/debts/new" 
                  className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-2 rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all duration-200 inline-flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>{summary.count === 0 ? 'Add Your First Debt' : 'Add New Debt'}</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DebtsPage() {
  return (
    <ProtectedRoute>
      <DebtsContent />
    </ProtectedRoute>
  );
}

function DebtCard({ debt, onDelete, onAddPayment, onUpdate }) {
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: debt.name,
    creditor: debt.creditor,
    type: debt.type,
    originalAmount: debt.originalAmount,
    currentBalance: debt.currentBalance,
    interestRate: debt.interestRate,
    minimumPayment: debt.minimumPayment,
    dueDay: debt.dueDay,
    description: debt.description
  });
  const router = useRouter();

  const progress = debtHelpers.calculateProgress(debt.originalAmount, debt.currentBalance);
  const typeInfo = debtHelpers.getDebtTypeInfo(debt.type);
  const statusInfo = debtHelpers.getStatusInfo(debt.status);

  const getDebtIcon = (type) => {
    const icons = {
      'credit-card': '💳',
      'loan': '🏦',
      'mortgage': '🏠',
      'student-loan': '🎓',
      'medical': '🏥',
      'other': '💰'
    };
    return icons[type?.toLowerCase()] || icons['other'];
  };

  const getCategoryColor = (type) => {
    const colors = {
      'credit-card': 'from-red-400 to-red-600',
      'loan': 'from-blue-400 to-blue-600',
      'mortgage': 'from-green-400 to-green-600',
      'student-loan': 'from-purple-400 to-purple-600',
      'medical': 'from-pink-400 to-pink-600',
      'other': 'from-orange-400 to-orange-600'
    };
    return colors[type?.toLowerCase()] || colors['other'];
  };

  const getStatusBadge = (status) => {
    const colors = {
      'active': 'bg-green-100 text-green-700',
      'paid-off': 'bg-gray-100 text-gray-600',
      'defaulted': 'bg-red-100 text-red-700'
    };

    const displayText = {
      'active': 'Active',
      'paid-off': 'Paid Off',
      'defaulted': 'Defaulted'
    };

    return (
      <span className={`px-2 py-1 text-xs rounded-full ${colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-600'}`}>
        {displayText[status?.toLowerCase()] || status}
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

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    if (paymentAmount && parseFloat(paymentAmount) > 0) {
      onAddPayment({
        amount: parseFloat(paymentAmount),
        type: 'regular'
      });
      setPaymentAmount('');
      setShowPaymentForm(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate required fields
      if (!editForm.name || !editForm.creditor || !editForm.type) {
        alert('Please fill in all required fields (Name, Creditor, Type)');
        return;
      }

      // Validate numeric fields
      const originalAmount = parseFloat(editForm.originalAmount);
      const currentBalance = parseFloat(editForm.currentBalance);
      const interestRate = parseFloat(editForm.interestRate);
      const minimumPayment = parseFloat(editForm.minimumPayment);
      const dueDay = parseInt(editForm.dueDay);

      if (isNaN(originalAmount) || originalAmount <= 0) {
        alert('Original amount must be a positive number');
        return;
      }

      if (isNaN(currentBalance) || currentBalance < 0) {
        alert('Current balance must be a non-negative number');
        return;
      }

      if (isNaN(interestRate) || interestRate < 0) {
        alert('Interest rate must be a non-negative number');
        return;
      }

      if (isNaN(minimumPayment) || minimumPayment < 0) {
        alert('Minimum payment must be a non-negative number');
        return;
      }

      if (isNaN(dueDay) || dueDay < 1 || dueDay > 31) {
        alert('Due day must be between 1 and 31');
        return;
      }

      if (currentBalance > originalAmount) {
        alert('Current balance cannot exceed original amount');
        return;
      }

      await onUpdate(debt._id, {
        name: editForm.name.trim(),
        creditor: editForm.creditor.trim(),
        type: editForm.type,
        originalAmount,
        currentBalance,
        interestRate,
        minimumPayment,
        dueDay,
        description: editForm.description?.trim() || ''
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating debt:', error);
      alert(`Failed to update debt: ${error.message}`);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="relative bg-white p-3 rounded-lg border border-gray-100 hover:shadow-md transition-shadow">
      <div className={`absolute left-0 top-0 w-1 h-full bg-gradient-to-b ${getCategoryColor(debt.type)} rounded-l-lg`}></div>
      
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3 flex-1">
          <div className="text-2xl">
            {getDebtIcon(debt.type)}
          </div>
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-2">
                <input
                  type="text"
                  name="name"
                  value={editForm.name}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base font-semibold focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Debt name"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="creditor"
                    value={editForm.creditor}
                    onChange={handleEditChange}
                    className="flex-1 px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Creditor"
                  />
                  <select
                    name="type"
                    value={editForm.type}
                    onChange={handleEditChange}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="credit-card">Credit Card</option>
                    <option value="personal-loan">Personal Loan</option>
                    <option value="education-loan">Education Loan</option>
                    <option value="auto-loan">Auto Loan</option>
                    <option value="home-loan">Home Loan</option>
                    <option value="family-borrowing">Family Borrowing</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <textarea
                  name="description"
                  value={editForm.description}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Description (optional)"
                  rows="2"
                />
              </div>
            ) : (
              <>
                <div className="flex items-center space-x-3 mb-1">
                  <h3 className="text-base font-semibold text-gray-900">{debt.name}</h3>
                  {getStatusBadge(debt.status)}
                </div>
                <p className="text-sm text-gray-600 mb-1 capitalize">{debt.type?.replace('-', ' ')} • {debt.creditor}</p>
                {debt.description && (
                  <p className="text-sm text-gray-500">{debt.description}</p>
                )}
              </>
            )}
            <div className="flex items-center space-x-4 mt-2">
              {debt.interestRate && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  {debt.interestRate}% APR
                </span>
              )}
              {debt.minimumPayment && (
                <span className="text-xs text-gray-500">
                  Min: {debtHelpers.formatCurrency(debt.minimumPayment)}
                </span>
              )}
              <div className="flex items-center">
                <span className="text-xs text-gray-500 mr-2">Progress:</span>
                <div className="w-20 bg-gray-200 rounded-full h-1.5 mr-2">
                  <div 
                    className="bg-gradient-to-r from-orange-400 to-orange-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-600">{progress}%</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-right ml-4">
          {isEditing ? (
            <div className="space-y-2 min-w-[200px]">
              <div>
                <label className="text-xs text-gray-500 block">Current Balance</label>
                <input
                  type="number"
                  name="currentBalance"
                  value={editForm.currentBalance}
                  onChange={handleEditChange}
                  className="w-full px-3 py-1 border border-gray-300 rounded-lg text-lg font-bold text-red-600 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  step="0.01"
                  min="0"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block">Original Amount</label>
                <input
                  type="number"
                  name="originalAmount"
                  value={editForm.originalAmount}
                  onChange={handleEditChange}
                  className="w-full px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  step="0.01"
                  min="0"
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 block">Interest %</label>
                  <input
                    type="number"
                    name="interestRate"
                    value={editForm.interestRate}
                    onChange={handleEditChange}
                    className="w-full px-2 py-1 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    step="0.01"
                    min="0"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-500 block">Min Payment</label>
                  <input
                    type="number"
                    name="minimumPayment"
                    value={editForm.minimumPayment}
                    onChange={handleEditChange}
                    className="w-full px-2 py-1 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 block">Due Day</label>
                <input
                  type="number"
                  name="dueDay"
                  value={editForm.dueDay}
                  onChange={handleEditChange}
                  className="w-full px-3 py-1 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  min="1"
                  max="31"
                />
              </div>
            </div>
          ) : (
            <>
              <p className="text-2xl font-bold text-red-600 mb-1">
                {debtHelpers.formatCurrency(debt.currentBalance)}
              </p>
              <p className="text-sm text-gray-500">
                of {debtHelpers.formatCurrency(debt.originalAmount)}
              </p>
              {debt.dueDay && (
                <p className="text-xs text-orange-600 mt-1">
                  Due day: {debt.dueDay}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      <div className="flex justify-end mt-4 space-x-2">
        {isEditing ? (
          <>
            <button 
              onClick={handleEditSubmit}
              className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors font-medium"
            >
              Save Changes
            </button>
            <button 
              onClick={() => {
                setIsEditing(false);
                setEditForm({
                  name: debt.name,
                  creditor: debt.creditor,
                  type: debt.type,
                  originalAmount: debt.originalAmount,
                  currentBalance: debt.currentBalance,
                  interestRate: debt.interestRate,
                  minimumPayment: debt.minimumPayment,
                  dueDay: debt.dueDay,
                  description: debt.description
                });
              }}
              className="px-4 py-2 bg-gray-500 text-white hover:bg-gray-600 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            {debt.status === 'active' && (
              <button 
                onClick={() => setShowPaymentForm(!showPaymentForm)}
                className="px-4 py-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors font-medium"
              >
                Add Payment
              </button>
            )}
            <button 
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
            >
              Edit
            </button>
            <button 
              onClick={onDelete}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
            >
              Delete
            </button>
          </>
        )}
      </div>

      {/* Simplified Payment Form */}
      {showPaymentForm && debt.status === 'active' && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Add Payment</h4>
          <form onSubmit={handlePaymentSubmit} className="space-y-3">
            <input
              type="number"
              step="0.01"
              placeholder="Payment amount"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            />
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setShowPaymentForm(false);
                  setPaymentAmount('');
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-all duration-200"
              >
                Add Payment
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}