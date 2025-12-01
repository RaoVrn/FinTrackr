'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '../components/ProtectedRoute';
import { debtAPI } from '../lib/api';

export default function DebtsPage() {
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchDebts();
  }, []);

  const fetchDebts = async () => {
    try {
      setLoading(true);
      const data = await debtAPI.getAll();
      setDebts(data);
      setError('');
    } catch (error) {
      console.error('Error fetching debts:', error);
      setError('Failed to fetch debts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this debt?')) {
      try {
        await debtAPI.delete(id);
        setDebts(debts.filter(debt => debt._id !== id));
      } catch (error) {
        console.error('Error deleting debt:', error);
        setError('Failed to delete debt');
      }
    }
  };

  const handleAddPayment = async (debtId, paymentAmount) => {
    try {
      const updatedDebt = await debtAPI.update(debtId, {
        action: 'addPayment',
        amount: paymentAmount
      });
      setDebts(debts.map(debt => 
        debt._id === debtId ? updatedDebt : debt
      ));
    } catch (error) {
      console.error('Error adding payment:', error);
      setError('Failed to add payment');
    }
  };

  const filteredDebts = debts.filter(debt => {
    const matchesFilter = filter === 'all' || debt.type === filter;
    const matchesSearch = debt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         debt.creditor.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalDebt = debts.reduce((sum, debt) => sum + debt.currentBalance, 0);
  const totalOriginal = debts.reduce((sum, debt) => sum + debt.originalAmount, 0);
  const totalPaid = totalOriginal - totalDebt;
  const avgProgress = debts.length > 0 ? 
    debts.reduce((sum, debt) => sum + ((debt.originalAmount - debt.currentBalance) / debt.originalAmount * 100), 0) / debts.length : 0;

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
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Debt Management</h1>
                <p className="text-gray-600">Track and manage your debts and payments</p>
              </div>
              <button
                onClick={() => router.push('/debts/new')}
                className="bg-gradient-to-r from-red-500 to-pink-600 text-white px-6 py-3 rounded-xl font-medium hover:from-red-600 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                + Add New Debt
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-6">
              {error}
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Total Debt</p>
                  <p className="text-2xl font-bold text-red-600">₹{totalDebt.toLocaleString()}</p>
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
                  <p className="text-2xl font-bold text-green-600">₹{totalPaid.toLocaleString()}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Active Debts</p>
                  <p className="text-2xl font-bold text-blue-600">{debts.filter(d => d.status === 'active').length}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Avg Progress</p>
                  <p className="text-2xl font-bold text-purple-600">{avgProgress.toFixed(1)}%</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search debts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                {['all', 'credit-card', 'personal-loan', 'home-loan', 'car-loan', 'other'].map((filterType) => (
                  <button
                    key={filterType}
                    onClick={() => setFilter(filterType)}
                    className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                      filter === filterType
                        ? 'bg-blue-500 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {filterType === 'all' ? 'All' : filterType.split('-').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Debts List */}
          <div className="space-y-6">
            {filteredDebts.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 shadow-lg border border-gray-100 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0 2.08-.402 2.599-1" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Debts Found</h3>
                <p className="text-gray-600 mb-6">Start by adding your first debt to track payments and progress.</p>
                <button
                  onClick={() => router.push('/debts/new')}
                  className="bg-gradient-to-r from-red-500 to-pink-600 text-white px-6 py-3 rounded-xl font-medium hover:from-red-600 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  + Add Your First Debt
                </button>
              </div>
            ) : (
              filteredDebts.map((debt) => (
                <DebtCard
                  key={debt._id}
                  debt={debt}
                  onDelete={() => handleDelete(debt._id)}
                  onAddPayment={(amount) => handleAddPayment(debt._id, amount)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

function DebtCard({ debt, onDelete, onAddPayment }) {
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const router = useRouter();

  const progress = ((debt.originalAmount - debt.currentBalance) / debt.originalAmount) * 100;

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    if (paymentAmount && parseFloat(paymentAmount) > 0) {
      onAddPayment(parseFloat(paymentAmount));
      setPaymentAmount('');
      setShowPaymentForm(false);
    }
  };

  const getTypeColor = (type) => {
    const colors = {
      'credit-card': 'bg-red-100 text-red-800',
      'personal-loan': 'bg-orange-100 text-orange-800',
      'home-loan': 'bg-green-100 text-green-800',
      'car-loan': 'bg-blue-100 text-blue-800',
      'other': 'bg-gray-100 text-gray-800'
    };
    return colors[type] || colors['other'];
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-xl font-semibold text-gray-800">{debt.name}</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(debt.type)}`}>
              {debt.type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              debt.status === 'active' ? 'bg-green-100 text-green-800' : 
              debt.status === 'paid-off' ? 'bg-blue-100 text-blue-800' : 
              'bg-gray-100 text-gray-800'
            }`}>
              {debt.status.charAt(0).toUpperCase() + debt.status.slice(1)}
            </span>
          </div>
          
          <p className="text-gray-600 mb-3">{debt.creditor}</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-500">Current Balance</p>
              <p className="text-lg font-semibold text-red-600">₹{debt.currentBalance.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Original Amount</p>
              <p className="text-lg font-semibold text-gray-800">₹{debt.originalAmount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Interest Rate</p>
              <p className="text-lg font-semibold text-gray-800">{debt.interestRate}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Min Payment</p>
              <p className="text-lg font-semibold text-gray-800">₹{debt.minimumPayment.toLocaleString()}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Repayment Progress</span>
              <span className="text-sm font-semibold text-gray-800">{progress.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(progress, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setShowPaymentForm(!showPaymentForm)}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-xl font-medium hover:from-green-600 hover:to-green-700 transition-all duration-200"
          >
            Add Payment
          </button>
          <button
            onClick={() => router.push(`/debts/edit/${debt._id}`)}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-xl font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Payment Form */}
      {showPaymentForm && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <form onSubmit={handlePaymentSubmit} className="flex gap-3">
            <input
              type="number"
              step="0.01"
              placeholder="Payment amount"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
            <button
              type="submit"
              className="bg-green-500 text-white px-6 py-2 rounded-xl font-medium hover:bg-green-600 transition-all duration-200"
            >
              Add Payment
            </button>
            <button
              type="button"
              onClick={() => setShowPaymentForm(false)}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-xl font-medium hover:bg-gray-400 transition-all duration-200"
            >
              Cancel
            </button>
          </form>
        </div>
      )}
    </div>
  );
}