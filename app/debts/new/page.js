'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import { debtAPI } from '../../lib/api';

export default function NewDebtPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    creditor: '',
    type: 'credit-card',
    category: '',
    status: 'active',
    originalAmount: '',
    currentBalance: '',
    interestRate: '',
    minimumPayment: '',
    startDate: new Date().toISOString().split('T')[0],
    expectedPayoffDate: '',
    dueDay: '',
    repaymentFrequency: 'monthly',
    remindersEnabled: false,
    collateral: '',
    description: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-set current balance to original amount if not set
    if (name === 'originalAmount' && !formData.currentBalance) {
      setFormData(prev => ({
        ...prev,
        currentBalance: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate required fields
      if (!formData.name || !formData.creditor || !formData.originalAmount || 
          !formData.currentBalance || !formData.interestRate || !formData.minimumPayment || 
          !formData.startDate || !formData.dueDay) {
        throw new Error('Please fill in all required fields');
      }

      // Additional validation
      if (parseFloat(formData.currentBalance) > parseFloat(formData.originalAmount)) {
        throw new Error('Current balance cannot exceed original amount');
      }

      const debtData = {
        ...formData,
        originalAmount: parseFloat(formData.originalAmount),
        currentBalance: parseFloat(formData.currentBalance),
        interestRate: parseFloat(formData.interestRate),
        minimumPayment: parseFloat(formData.minimumPayment),
        dueDay: parseInt(formData.dueDay)
      };

      const response = await debtAPI.create(debtData);
      if (response.success) {
        router.push('/debts');
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('Error creating debt:', error);
      setError(error.message || 'Failed to create debt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-800 mb-4 transition-colors duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Debts
            </button>
            <h1 className="text-3xl font-bold text-orange-600 mb-2">Add New Debt</h1>
            <p className="text-gray-600">Track a new debt or loan for better financial management</p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-6">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="space-y-8">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Debt Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g., HDFC Credit Card, Home Loan"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Creditor/Lender *
                    </label>
                    <input
                      type="text"
                      name="creditor"
                      value={formData.creditor}
                      onChange={handleChange}
                      placeholder="e.g., HDFC Bank, SBI, ICICI Bank"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Debt Type *
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      required
                    >
                      <option value="credit-card">Credit Card</option>
                      <option value="personal-loan">Personal Loan</option>
                      <option value="education-loan">Education Loan</option>
                      <option value="auto-loan">Auto Loan</option>
                      <option value="home-loan">Home Loan</option>
                      <option value="business-loan">Business Loan</option>
                      <option value="medical-debt">Medical Debt</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <input
                      type="text"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      placeholder="e.g., High Priority, Emergency"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status *
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      required
                    >
                      <option value="active">Active</option>
                      <option value="paid-off">Paid Off</option>
                      <option value="defaulted">Defaulted</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Financial Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                  Financial Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Original Amount *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        name="originalAmount"
                        value={formData.originalAmount}
                        onChange={handleChange}
                        placeholder="0.00"
                        className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Balance *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        name="currentBalance"
                        value={formData.currentBalance}
                        onChange={handleChange}
                        placeholder="0.00"
                        className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Interest Rate *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        name="interestRate"
                        value={formData.interestRate}
                        onChange={handleChange}
                        placeholder="12.50"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        required
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">% APR</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Payment *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        name="minimumPayment"
                        value={formData.minimumPayment}
                        onChange={handleChange}
                        placeholder="0.00"
                        className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expected Payoff Date
                    </label>
                    <input
                      type="date"
                      name="expectedPayoffDate"
                      value={formData.expectedPayoffDate}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Schedule */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                  Payment Schedule
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Due Day (1-31) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      name="dueDay"
                      value={formData.dueDay}
                      onChange={handleChange}
                      placeholder="15"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Day of the month payment is due</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Frequency *
                    </label>
                    <select
                      name="repaymentFrequency"
                      value={formData.repaymentFrequency}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      required
                    >
                      <option value="weekly">Weekly</option>
                      <option value="bi-weekly">Bi-weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center mt-8">
                      <input
                        type="checkbox"
                        id="remindersEnabled"
                        name="remindersEnabled"
                        checked={formData.remindersEnabled}
                        onChange={(e) => setFormData(prev => ({ ...prev, remindersEnabled: e.target.checked }))}
                        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                      />
                      <label htmlFor="remindersEnabled" className="ml-2 block text-sm font-medium text-gray-700">
                        Enable payment reminders
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                  Additional Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Collateral (if any)
                    </label>
                    <input
                      type="text"
                      name="collateral"
                      value={formData.collateral}
                      onChange={handleChange}
                      placeholder="e.g., House, Car, Jewelry"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows="3"
                      placeholder="Add any additional notes about this debt..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Summary Preview */}
              {formData.originalAmount && formData.currentBalance && (
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-6 border border-orange-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Debt Summary Preview</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-1">Original Amount</p>
                      <p className="text-lg font-bold text-gray-800">
                        ₹{parseFloat(formData.originalAmount || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-1">Current Balance</p>
                      <p className="text-lg font-bold text-red-600">
                        ₹{parseFloat(formData.currentBalance || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-1">Amount Paid</p>
                      <p className="text-lg font-bold text-green-600">
                        ₹{(parseFloat(formData.originalAmount || 0) - parseFloat(formData.currentBalance || 0)).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-1">Progress</p>
                      <p className="text-lg font-bold text-orange-600">
                        {formData.originalAmount && formData.currentBalance 
                          ? (((parseFloat(formData.originalAmount) - parseFloat(formData.currentBalance)) / parseFloat(formData.originalAmount)) * 100).toFixed(1)
                          : 0}%
                      </p>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Payoff Progress</span>
                      <span className="text-sm font-medium text-gray-800">
                        {formData.originalAmount && formData.currentBalance 
                          ? (((parseFloat(formData.originalAmount) - parseFloat(formData.currentBalance)) / parseFloat(formData.originalAmount)) * 100).toFixed(1)
                          : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-orange-400 to-orange-600 h-3 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${formData.originalAmount && formData.currentBalance 
                            ? Math.min(((parseFloat(formData.originalAmount) - parseFloat(formData.currentBalance)) / parseFloat(formData.originalAmount)) * 100, 100)
                            : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white py-3 px-6 rounded-lg font-medium hover:from-orange-600 hover:to-amber-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Adding Debt...
                  </div>
                ) : (
                  'Add Debt'
                )}
              </button>
              
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-medium hover:bg-gray-300 transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}