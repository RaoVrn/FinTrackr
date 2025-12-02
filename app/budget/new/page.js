'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '../../components/ProtectedRoute';
import { BUDGET_CATEGORIES, PRIORITY_LEVELS, validateBudgetData } from '../../lib/budgetUtils';

function CreateBudgetContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    // Section 1 - Basic Info
    name: '',
    category: '',
    amount: '',
    
    // Section 2 - Time Period
    startDate: '',
    endDate: '',
    isRecurring: false,
    rolloverEnabled: false,
    
    // Section 3 - Priority & Notes
    priority: 'essential',
    notes: '',
    
    // Section 4 - Alerts
    alert50: true,
    alert75: true,
    alert100: true,
    alertExceeded: true
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear specific field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setFormData(prev => ({
      ...prev,
      amount: value
    }));

    if (errors.amount) {
      setErrors(prev => ({
        ...prev,
        amount: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    // Client-side validation
    const validation = validateBudgetData({
      ...formData,
      amount: parseFloat(formData.amount)
    });

    if (!validation.isValid) {
      const fieldErrors = {};
      validation.errors.forEach(error => {
        if (error.includes('name')) fieldErrors.name = error;
        else if (error.includes('category')) fieldErrors.category = error;
        else if (error.includes('amount')) fieldErrors.amount = error;
        else if (error.includes('Start date')) fieldErrors.startDate = error;
        else if (error.includes('End date')) fieldErrors.endDate = error;
        else if (error.includes('after')) fieldErrors.endDate = error;
      });
      setErrors(fieldErrors);
      setLoading(false);
      return;
    }

    try {
      const budgetData = {
        ...formData,
        amount: parseFloat(formData.amount)
      };

      const response = await fetch('/api/budgets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authorization': `Bearer ${localStorage.getItem('fintrackr_token')}`
        },
        body: JSON.stringify(budgetData)
      });

      const data = await response.json();
      
      if (data.success) {
        router.push('/budget');
      } else {
        setErrors({ submit: data.error || 'Failed to create budget' });
      }
    } catch (err) {
      console.error('Error creating budget:', err);
      setErrors({ submit: 'Failed to create budget. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/budget');
  };

  // Auto-set end date when start date changes (for monthly budget)
  const handleStartDateChange = (e) => {
    const startDate = e.target.value;
    setFormData(prev => {
      const newFormData = { ...prev, startDate };
      
      // Auto-calculate end date for the same month
      if (startDate) {
        const start = new Date(startDate);
        const endOfMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0);
        newFormData.endDate = endOfMonth.toISOString().split('T')[0];
      }
      
      return newFormData;
    });

    if (errors.startDate) {
      setErrors(prev => ({
        ...prev,
        startDate: ''
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent mb-2">
                Create Budget
              </h1>
              <p className="text-gray-600 text-lg">Set up a new budget to track your spending</p>
            </div>
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              ← Back to Budgets
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Global Error */}
          {errors.submit && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl">
              {errors.submit}
            </div>
          )}

          {/* Section 1 - Basic Info */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Basic Information</h2>
              <p className="text-gray-600">Enter the fundamental details for your budget</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Budget Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Budget Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Monthly Groceries, Entertainment Fund"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
              </div>

              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.category ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a category</option>
                  {Object.entries(BUDGET_CATEGORIES).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
                {errors.category && <p className="text-red-600 text-sm mt-1">{errors.category}</p>}
              </div>

              {/* Budget Amount */}
              <div className="md:col-span-2">
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                  Budget Amount *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500">₹</span>
                  <input
                    type="text"
                    id="amount"
                    name="amount"
                    value={formData.amount}
                    onChange={handleAmountChange}
                    placeholder="0.00"
                    className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.amount ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.amount && <p className="text-red-600 text-sm mt-1">{errors.amount}</p>}
              </div>
            </div>
          </div>

          {/* Section 2 - Time Period */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Time Period</h2>
              <p className="text-gray-600">Define when this budget is active</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Start Date */}
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleStartDateChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.startDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.startDate && <p className="text-red-600 text-sm mt-1">{errors.startDate}</p>}
              </div>

              {/* End Date */}
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.endDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.endDate && <p className="text-red-600 text-sm mt-1">{errors.endDate}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Recurring Monthly Budget */}
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="isRecurring"
                  name="isRecurring"
                  checked={formData.isRecurring}
                  onChange={handleInputChange}
                  className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <label htmlFor="isRecurring" className="text-sm font-medium text-gray-700">
                    Recurring Monthly Budget
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Automatically create this budget for next month
                  </p>
                </div>
              </div>

              {/* Rollover Budget */}
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="rolloverEnabled"
                  name="rolloverEnabled"
                  checked={formData.rolloverEnabled}
                  onChange={handleInputChange}
                  className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <label htmlFor="rolloverEnabled" className="text-sm font-medium text-gray-700">
                    Rollover Budget
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Carry unused budget to next period
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3 - Priority & Notes */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Priority & Notes</h2>
              <p className="text-gray-600">Set priority level and add optional notes</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Priority */}
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                  Priority Level
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {Object.entries(PRIORITY_LEVELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Add any additional notes about this budget..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 4 - Alerts */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Alert Settings</h2>
              <p className="text-gray-600">Configure when you want to receive spending alerts</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Alert at 50% */}
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="alert50"
                  name="alert50"
                  checked={formData.alert50}
                  onChange={handleInputChange}
                  className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <label htmlFor="alert50" className="text-sm font-medium text-gray-700">
                    Alert at 50% spent
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Get notified when half of your budget is used
                  </p>
                </div>
              </div>

              {/* Alert at 75% */}
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="alert75"
                  name="alert75"
                  checked={formData.alert75}
                  onChange={handleInputChange}
                  className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <label htmlFor="alert75" className="text-sm font-medium text-gray-700">
                    Alert at 75% spent
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Get notified when 75% of your budget is used
                  </p>
                </div>
              </div>

              {/* Alert at 100% */}
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="alert100"
                  name="alert100"
                  checked={formData.alert100}
                  onChange={handleInputChange}
                  className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <label htmlFor="alert100" className="text-sm font-medium text-gray-700">
                    Alert at 100% spent
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Get notified when budget is fully used
                  </p>
                </div>
              </div>

              {/* Alert when exceeded */}
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="alertExceeded"
                  name="alertExceeded"
                  checked={formData.alertExceeded}
                  onChange={handleInputChange}
                  className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <label htmlFor="alertExceeded" className="text-sm font-medium text-gray-700">
                    Alert when exceeded
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Get notified when budget limit is exceeded
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <button
              type="button"
              onClick={handleCancel}
              className="px-8 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Budget...' : 'Create Budget'}
            </button>
          </div>
        </form>
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