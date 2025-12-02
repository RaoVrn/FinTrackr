'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import ProtectedRoute from '../../../components/ProtectedRoute';

// Utility function
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const getCategoryIcon = (category) => {
  const icons = {
    food: '🍽️',
    transport: '🚗',
    entertainment: '🎬',
    shopping: '🛍️',
    healthcare: '🏥',
    utilities: '💡',
    groceries: '🛒',
    education: '📚',
    other: '📝'
  };
  return icons[category] || '📝';
};

function EditBudgetContent() {
  const [budget, setBudget] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'food',
    amount: '',
    priority: 'important',
    description: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const budgetId = params.id;

  const categories = [
    { value: 'food', label: 'Food & Dining', icon: '🍽️' },
    { value: 'transport', label: 'Transport', icon: '🚗' },
    { value: 'entertainment', label: 'Entertainment', icon: '🎬' },
    { value: 'shopping', label: 'Shopping', icon: '🛍️' },
    { value: 'healthcare', label: 'Healthcare', icon: '🏥' },
    { value: 'utilities', label: 'Utilities', icon: '💡' },
    { value: 'groceries', label: 'Groceries', icon: '🛒' },
    { value: 'education', label: 'Education', icon: '📚' },
    { value: 'other', label: 'Other', icon: '📝' }
  ];

  const priorities = [
    { value: 'essential', label: 'Essential', color: 'bg-red-100 text-red-700', description: 'Must-have expenses' },
    { value: 'important', label: 'Important', color: 'bg-orange-100 text-orange-700', description: 'Important but not critical' },
    { value: 'nice-to-have', label: 'Nice to Have', color: 'bg-green-100 text-green-700', description: 'Optional expenses' }
  ];

  useEffect(() => {
    if (user && budgetId) {
      fetchBudget();
    }
  }, [user, budgetId]);

  const fetchBudget = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/budgets/${budgetId}`, {
        headers: {
          'authorization': `Bearer ${localStorage.getItem('fintrackr_token')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setBudget(data.budget);
        setFormData({
          name: data.budget.name,
          category: data.budget.category,
          amount: data.budget.amount.toString(),
          priority: data.budget.priority,
          description: data.budget.description || ''
        });
      } else {
        throw new Error(data.error || 'Failed to fetch budget');
      }
    } catch (err) {
      console.error('Error fetching budget:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.amount || formData.amount <= 0) {
      setError('Please fill in all required fields with valid values');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const response = await fetch(`/api/budgets/${budgetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'authorization': `Bearer ${localStorage.getItem('fintrackr_token')}`
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          category: formData.category,
          amount: parseFloat(formData.amount),
          priority: formData.priority,
          description: formData.description.trim()
        })
      });

      const data = await response.json();

      if (data.success) {
        router.push('/budget');
      } else {
        throw new Error(data.error || 'Failed to update budget');
      }
    } catch (err) {
      console.error('Error updating budget:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading budget...</p>
        </div>
      </div>
    );
  }

  if (error && !budget) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Budget Not Found</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/budget')}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2 rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
          >
            Back to Budgets
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.push('/budget')}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-white/50 rounded-xl transition-all duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                Edit Budget
              </h1>
              <p className="text-gray-600 text-lg">Update your budget details</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
              {error}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
              <div className="space-y-6">
                {/* Budget Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="e.g., Monthly Groceries"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget Amount (₹) *
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    required
                    min="1"
                    step="0.01"
                    className="w-full px-4 py-3 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="0"
                  />
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority *
                  </label>
                  <div className="space-y-2">
                    {priorities.map(priority => (
                      <label key={priority.value} className="flex items-center p-3 bg-white/50 rounded-xl border border-gray-100 cursor-pointer hover:bg-white/70 transition-all duration-200">
                        <input
                          type="radio"
                          name="priority"
                          value={priority.value}
                          checked={formData.priority === priority.value}
                          onChange={handleInputChange}
                          className="mr-3"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${priority.color}`}>
                              {priority.label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{priority.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-4 py-3 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Optional description for this budget..."
                  />
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => router.push('/budget')}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Updating...
                      </>
                    ) : (
                      'Update Budget'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Preview */}
          <div className="lg:col-span-1">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget Preview</h3>
              
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-2xl">{getCategoryIcon(formData.category)}</div>
                  <div>
                    <h4 className="font-semibold">{formData.name || 'Budget Name'}</h4>
                    <p className="text-blue-100 text-sm capitalize">{formData.category}</p>
                  </div>
                </div>
                
                <div className="text-2xl font-bold">
                  {formatCurrency(parseFloat(formData.amount) || 0)}
                </div>
                
                <div className="mt-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/20 text-white">
                    {priorities.find(p => p.value === formData.priority)?.label || 'Priority'}
                  </span>
                </div>
              </div>

              {/* Current Status */}
              {budget && (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Currently Spent:</span>
                    <span className="font-semibold text-red-600">{formatCurrency(budget.spent || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Current Remaining:</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency((parseFloat(formData.amount) || 0) - (budget.spent || 0))}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min(((budget.spent || 0) / (parseFloat(formData.amount) || 1)) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EditBudgetPage() {
  return (
    <ProtectedRoute>
      <EditBudgetContent />
    </ProtectedRoute>
  );
}