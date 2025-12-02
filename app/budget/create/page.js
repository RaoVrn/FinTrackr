'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '../../components/ProtectedRoute';

const BUDGET_CATEGORIES = [
  // Most Essential Daily Categories
  { value: 'Food & Dining', icon: '🍽️', color: 'from-orange-400 to-red-400' },
  { value: 'Groceries', icon: '🛒', color: 'from-green-400 to-emerald-400' },
  { value: 'Transport', icon: '🚗', color: 'from-blue-400 to-indigo-400' },
  { value: 'Bills & Utilities', icon: '📄', color: 'from-gray-400 to-slate-400' },
  { value: 'Health & Medical', icon: '🏥', color: 'from-red-400 to-pink-400' },
  { value: 'Housing & Rent', icon: '🏠', color: 'from-yellow-400 to-orange-400' },
  
  // Common Lifestyle
  { value: 'Entertainment', icon: '🎬', color: 'from-purple-400 to-pink-400' },
  { value: 'Shopping', icon: '🛍️', color: 'from-pink-400 to-rose-400' },
  { value: 'Education', icon: '📚', color: 'from-indigo-400 to-purple-400' },
  
  // Financial Essentials
  { value: 'Insurance', icon: '🛡️', color: 'from-blue-400 to-cyan-400' },
  { value: 'Investments', icon: '📈', color: 'from-emerald-400 to-green-400' },
  { value: 'Loans & EMI', icon: '🏦', color: 'from-red-400 to-orange-400' },
  
  // Other Important
  { value: 'Travel', icon: '✈️', color: 'from-cyan-400 to-blue-400' },
  { value: 'Gifts', icon: '🎁', color: 'from-rose-400 to-pink-400' },
  { value: 'Other', icon: '📦', color: 'from-gray-400 to-gray-500' }
];

const PRIORITY_LEVELS = [
  { value: 'essential', label: 'Essential', color: 'text-red-600', description: 'Must-have expenses' },
  { value: 'important', label: 'Important', color: 'text-orange-600', description: 'Should-have expenses' },
  { value: 'nice-to-have', label: 'Nice to Have', color: 'text-green-600', description: 'Could-have expenses' }
];

const getCategoryIcon = (categoryValue) => {
  const category = BUDGET_CATEGORIES.find(cat => cat.value === categoryValue);
  return category ? category.icon : '📝';
};

const getCategoryColor = (categoryValue) => {
  const category = BUDGET_CATEGORIES.find(cat => cat.value === categoryValue);
  return category ? category.color : 'from-gray-400 to-gray-500';
};

function CreateBudgetContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'Food & Dining',
    amount: '',
    startDate: '',
    endDate: '',
    priority: 'essential',
    notes: '',
    isRecurring: false,
    rolloverEnabled: false,
    alert50: true,
    alert75: true,
    alert100: true,
    alertExceeded: true
  });

  // Set default dates (current month)
  useState(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    setFormData(prev => ({
      ...prev,
      startDate: firstDay.toISOString().split('T')[0],
      endDate: lastDay.toISOString().split('T')[0]
    }));
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Budget name is required');
      return false;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid budget amount');
      return false;
    }
    if (!formData.startDate || !formData.endDate) {
      setError('Start and end dates are required');
      return false;
    }
    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      setError('End date must be after start date');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/budgets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authorization': `Bearer ${localStorage.getItem('fintrackr_token')}`
        },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount)
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage('Budget created successfully!');
        setTimeout(() => {
          router.push('/budget');
        }, 1500);
      } else {
        setError(data.error || 'Failed to create budget');
      }
    } catch (err) {
      console.error('Error creating budget:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.push('/budget')}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-white rounded-xl transition-colors shadow-sm"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent mb-2">Create New Budget</h1>
              <p className="text-gray-600 text-lg">Set spending limits and track your financial goals</p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {successMessage}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        )}

        {/* Budget Form */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Monthly Food Budget"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/70 backdrop-blur-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <div className="relative">
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none bg-white/70 backdrop-blur-sm"
                    required
                  >
                    {BUDGET_CATEGORIES.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.icon} {category.value}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Selected category will sync with your expense tracking
                </div>
              </div>
            </div>

            {/* Amount and Priority */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget Amount (₹) *
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="5000"
                  min="1"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/70 backdrop-blur-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority Level *
                </label>
                <div className="relative">
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none bg-white/70 backdrop-blur-sm"
                    required
                  >
                    {PRIORITY_LEVELS.map(priority => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label} - {priority.description}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/70 backdrop-blur-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/70 backdrop-blur-sm"
                  required
                />
              </div>
            </div>

            {/* Category Preview */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100 shadow-sm">
              <h3 className="text-sm font-medium text-blue-700 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Budget Preview
              </h3>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${getCategoryColor(formData.category)} flex items-center justify-center text-white text-xl`}>
                  {getCategoryIcon(formData.category)}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{formData.name || 'Budget Name'}</h4>
                  <p className="text-sm text-gray-600">{formData.category} • {PRIORITY_LEVELS.find(p => p.value === formData.priority)?.label}</p>
                  <p className="text-lg font-bold text-blue-600">{formData.amount ? `₹${parseFloat(formData.amount).toLocaleString()}` : '₹0'}</p>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Add any additional notes about this budget..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/70 backdrop-blur-sm resize-none"
              />
            </div>

            {/* Options */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Budget Options</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isRecurring"
                    checked={formData.isRecurring}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label className="ml-3 text-sm text-gray-700">
                    Recurring Budget
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="rolloverEnabled"
                    checked={formData.rolloverEnabled}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label className="ml-3 text-sm text-gray-700">
                    Enable Rollover
                  </label>
                </div>
              </div>
            </div>

            {/* Alert Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Alert Settings</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="alert50"
                    checked={formData.alert50}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label className="ml-3 text-sm text-gray-700">
                    50% Alert
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="alert75"
                    checked={formData.alert75}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label className="ml-3 text-sm text-gray-700">
                    75% Alert
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="alert100"
                    checked={formData.alert100}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label className="ml-3 text-sm text-gray-700">
                    100% Alert
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="alertExceeded"
                    checked={formData.alertExceeded}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label className="ml-3 text-sm text-gray-700">
                    Exceeded Alert
                  </label>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-blue-100">
              <button
                type="button"
                onClick={() => router.push('/budget')}
                className="px-6 py-3 text-gray-700 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl hover:bg-gray-100 transition-all duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 sm:flex-initial px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating Budget...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Create Budget
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function CreateBudgetPage() {
  return (
    <ProtectedRoute>
      <CreateBudgetContent />
    </ProtectedRoute>
  );
}