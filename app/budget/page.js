'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '../components/ProtectedRoute';

// Utility functions
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

function BudgetContent() {
  const [budgets, setBudgets] = useState([]);
  const [summary, setSummary] = useState({
    totalBudget: 0,
    totalSpent: 0,
    totalRemaining: 0,
    categoriesCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [filters, setFilters] = useState({
    month: '',
    category: 'all',
    priority: 'all'
  });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const router = useRouter();
  const { user } = useAuth();

  // Force refresh function using guaranteed fresh data endpoint
  const forceRefreshBudgets = async () => {
    try {
      const response = await fetch('/api/budgets/refresh', {
        method: 'POST',
        headers: {
          'authorization': `Bearer ${localStorage.getItem('fintrackr_token')}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setBudgets(data.budgets);
        setSummary(data.summary);
        console.log('Force refresh completed:', data.budgets.length, 'budgets loaded');
      }
    } catch (err) {
      console.error('Force refresh failed:', err);
    }
  };

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams();
      if (filters.month) params.append('month', filters.month);
      if (filters.category !== 'all') params.append('category', filters.category);
      if (filters.priority !== 'all') params.append('priority', filters.priority);
      params.append('_t', Date.now().toString());
      
      const response = await fetch(`/api/budgets?${params.toString()}`, {
        headers: {
          'authorization': `Bearer ${localStorage.getItem('fintrackr_token')}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setBudgets(data.budgets || []);
        setSummary(data.summary || {
          totalBudget: 0,
          totalSpent: 0,
          totalRemaining: 0,
          categoriesCount: 0
        });
      } else {
        throw new Error(data.error || 'Failed to fetch budgets');
      }
    } catch (err) {
      console.error('Error fetching budgets:', err);
      try {
        await forceRefreshBudgets();
        setError('');
      } catch (fallbackErr) {
        setError(`Failed to fetch budgets: ${err.message}`);
        setBudgets([]);
        setSummary({
          totalBudget: 0,
          totalSpent: 0,
          totalRemaining: 0,
          categoriesCount: 0
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const syncExpenses = async () => {
    try {
      setSyncing(true);
      setSyncMessage('');
      
      const response = await fetch('/api/budgets/sync-expenses', {
        method: 'POST',
        headers: {
          'authorization': `Bearer ${localStorage.getItem('fintrackr_token')}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSyncMessage(`✅ Synced ${data.summary.totalExpensesSynced} expenses with ${data.summary.budgetsUpdated} budgets`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        await forceRefreshBudgets();
        setTimeout(() => forceRefreshBudgets(), 1000);
        setTimeout(() => forceRefreshBudgets(), 2000);
      } else {
        throw new Error(data.error || 'Failed to sync expenses');
      }
    } catch (err) {
      console.error('Error syncing expenses:', err);
      setSyncMessage(`❌ Sync failed: ${err.message}`);
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMessage(''), 5000);
    }
  };

  const handleEdit = (budget) => {
    setEditingId(budget._id);
    setEditForm({
      name: budget.name,
      amount: budget.amount,
      category: budget.category,
      priority: budget.priority
    });
  };

  const handleSaveEdit = async (budgetId) => {
    try {
      const response = await fetch(`/api/budgets/${budgetId}`, {
        method: 'PUT',
        headers: {
          'authorization': `Bearer ${localStorage.getItem('fintrackr_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        const updatedBudget = await response.json();
        setBudgets(budgets.map(b => b._id === budgetId ? updatedBudget.budget : b));
        setEditingId(null);
        setEditForm({});
        await fetchBudgets(); // Refresh to get updated summary
      } else {
        throw new Error('Failed to update budget');
      }
    } catch (err) {
      console.error('Error updating budget:', err);
      alert('Failed to update budget. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleDelete = async (budgetId, budgetName) => {
    if (window.confirm(`Are you sure you want to delete "${budgetName}"? This action cannot be undone.`)) {
      try {
        const response = await fetch(`/api/budgets/${budgetId}`, {
          method: 'DELETE',
          headers: {
            'authorization': `Bearer ${localStorage.getItem('fintrackr_token')}`
          }
        });

        if (response.ok) {
          setBudgets(budgets.filter(budget => budget._id !== budgetId));
          // Recalculate summary
          const remainingBudgets = budgets.filter(budget => budget._id !== budgetId);
          const newSummary = {
            totalBudget: remainingBudgets.reduce((sum, budget) => sum + budget.amount, 0),
            totalSpent: remainingBudgets.reduce((sum, budget) => sum + (budget.spent || 0), 0),
            totalRemaining: remainingBudgets.reduce((sum, budget) => sum + (budget.amount - (budget.spent || 0)), 0),
            categoriesCount: new Set(remainingBudgets.map(budget => budget.category)).size
          };
          setSummary(newSummary);
        } else {
          throw new Error('Failed to delete budget');
        }
      } catch (err) {
        console.error('Error deleting budget:', err);
        alert('Failed to delete budget. Please try again.');
      }
    }
  };

  useEffect(() => {
    if (user) {
      fetchBudgets();
    }
  }, [user, filters]);

  // Filter budgets based on selected priority
  const filteredBudgets = filters.priority === 'all' 
    ? budgets 
    : budgets.filter(budget => budget.priority === filters.priority);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading budget data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent mb-2">Budget Management</h1>
              <p className="text-gray-600 text-lg">Set and track spending limits for different categories</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={syncExpenses}
                disabled={syncing}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-2 rounded-xl font-medium hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
              >
                {syncing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Syncing...
                  </>
                ) : (
                  '🔄 Sync Expenses'
                )}
              </button>
              <button
                onClick={() => router.push('/budget/create')}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2 rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Add Budget
              </button>
            </div>
          </div>

          {/* Sync Message */}
          {syncMessage && (
            <div className={`mt-4 p-4 rounded-xl ${
              syncMessage.includes('✅') 
                ? 'bg-green-50 border border-green-200 text-green-700' 
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {syncMessage}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
              {error}
            </div>
          )}
        </div>

        {/* Category Filter Tabs */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {['all', 'essential', 'important', 'nice-to-have'].map((priority) => {
              const count = priority === 'all' 
                ? budgets.length 
                : budgets.filter(b => b.priority === priority).length;
              
              return (
                <button
                  key={priority}
                  onClick={() => setFilters({...filters, priority})}
                  className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                    filters.priority === priority
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'bg-white/70 text-gray-600 hover:bg-blue-50 border border-gray-200'
                  }`}
                >
                  <span className="capitalize">{priority === 'all' ? 'All Budgets' : priority.replace('-', ' ')}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    filters.priority === priority
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Budget</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(summary.totalBudget)}</p>
              </div>
              <div className="text-3xl">💰</div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Spent</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalSpent)}</p>
              </div>
              <div className="text-3xl">💸</div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Remaining</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalRemaining)}</p>
              </div>
              <div className="text-3xl">💳</div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Categories</p>
                <p className="text-2xl font-bold text-purple-600">{summary.categoriesCount}</p>
              </div>
              <div className="text-3xl">📊</div>
            </div>
          </div>
        </div>

        {/* Budget Grid */}
        <div className="space-y-6">
          {filteredBudgets.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl shadow-lg border border-gray-100">
              <div className="text-6xl mb-4">💰</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {filters.priority === 'all' ? 'No Budgets Created' : `No ${filters.priority.replace('-', ' ')} Budgets`}
              </h3>
              <p className="text-gray-600 mb-6">
                {filters.priority === 'all' 
                  ? 'Create your first budget to start tracking your spending by category.' 
                  : `Create a budget with ${filters.priority.replace('-', ' ')} priority or switch to "All Budgets" to see other categories.`
                }
              </p>
              <button
                onClick={() => router.push('/budget/create')}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center gap-2 mx-auto"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Create Budget
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBudgets.map((budget) => {
                const spent = budget.spent || 0;
                const progressPercentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
                const remaining = budget.amount - spent;
                const isOverBudget = spent > budget.amount;
                
                return (
                  <div key={budget._id} className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200 group">
                    {/* Header with Actions */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="text-2xl flex-shrink-0">{getCategoryIcon(budget.category)}</div>
                        <div className="min-w-0 flex-1">
                          {editingId === budget._id ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={editForm.name}
                                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm font-semibold bg-white focus:border-blue-500 focus:outline-none"
                                placeholder="Budget name"
                              />
                              <select
                                value={editForm.category}
                                onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 shadow-sm appearance-none cursor-pointer"
                                style={{
                                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                                  backgroundPosition: 'right 0.5rem center',
                                  backgroundRepeat: 'no-repeat',
                                  backgroundSize: '1.5em 1.5em',
                                  paddingRight: '2.5rem'
                                }}
                              >
                                <option value="food">🍽️ Food</option>
                                <option value="transport">🚗 Transport</option>
                                <option value="entertainment">🎬 Entertainment</option>
                                <option value="shopping">🛍️ Shopping</option>
                                <option value="healthcare">🏥 Healthcare</option>
                                <option value="utilities">💡 Utilities</option>
                                <option value="groceries">🛒 Groceries</option>
                                <option value="education">📚 Education</option>
                                <option value="other">📝 Other</option>
                              </select>
                            </div>
                          ) : (
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 truncate" title={budget.name}>
                                {budget.name}
                              </h3>
                              <p className="text-sm text-gray-500 capitalize truncate">
                                {budget.category}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        {editingId === budget._id ? (
                          <>
                            <button
                              onClick={() => handleSaveEdit(budget._id)}
                              className="px-3 py-1.5 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition-colors font-medium"
                              title="Save Changes"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="px-3 py-1.5 bg-gray-500 text-white text-xs rounded-lg hover:bg-gray-600 transition-colors font-medium"
                              title="Cancel Edit"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEdit(budget)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit Budget"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(budget._id, budget.name)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Budget"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Priority Badge */}
                    <div className="mb-4">
                      {editingId === budget._id ? (
                        <select
                          value={editForm.priority}
                          onChange={(e) => setEditForm({...editForm, priority: e.target.value})}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 shadow-sm appearance-none cursor-pointer"
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                            backgroundPosition: 'right 0.5rem center',
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: '1.5em 1.5em',
                            paddingRight: '2.5rem'
                          }}
                        >
                          <option value="essential">🔴 Essential</option>
                          <option value="important">🟡 Important</option>
                          <option value="nice-to-have">🟢 Nice to Have</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          budget.priority === 'essential' 
                            ? 'bg-red-100 text-red-700' 
                            : budget.priority === 'important'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {budget.priority === 'nice-to-have' ? 'Nice to Have' : budget.priority.charAt(0).toUpperCase() + budget.priority.slice(1)}
                        </span>
                      )}
                    </div>
                    
                    {/* Budget Amount */}
                    <div className="mb-4">
                      <p className="text-sm text-gray-500 mb-1">Budget Amount</p>
                      {editingId === budget._id ? (
                        <input
                          type="number"
                          value={editForm.amount}
                          onChange={(e) => setEditForm({...editForm, amount: Number(e.target.value)})}
                          className="text-2xl font-bold text-gray-900 bg-transparent border-b-2 border-gray-300 focus:border-blue-500 outline-none w-full"
                          min="0"
                          step="100"
                        />
                      ) : (
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(budget.amount)}</p>
                      )}
                    </div>

                    {/* Progress Section */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Spent</span>
                        <span className="font-medium text-red-600">{formatCurrency(spent)}</span>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                        <div 
                          className={`h-2.5 rounded-full transition-all duration-300 ${
                            isOverBudget 
                              ? 'bg-gradient-to-r from-red-500 to-red-600' 
                              : progressPercentage >= 75 
                                ? 'bg-gradient-to-r from-yellow-400 to-orange-500' 
                                : 'bg-gradient-to-r from-green-400 to-green-600'
                          }`}
                          style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Progress</span>
                        <span className={`font-medium ${
                          isOverBudget ? 'text-red-600' : progressPercentage >= 75 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {progressPercentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Remaining Amount */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Remaining</span>
                        <span className={`font-bold text-lg ${
                          remaining >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {remaining >= 0 ? formatCurrency(remaining) : `-${formatCurrency(Math.abs(remaining))}`}
                        </span>
                      </div>
                      <div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium w-full justify-center ${
                          isOverBudget 
                            ? 'bg-red-100 text-red-700' 
                            : progressPercentage >= 75 
                              ? 'bg-yellow-100 text-yellow-700' 
                              : 'bg-green-100 text-green-700'
                        }`}>
                          {isOverBudget ? '⚠️ Over Budget' : progressPercentage >= 75 ? '🔸 Almost Exceeded' : '✅ On Track'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BudgetPage() {
  return (
    <ProtectedRoute>
      <BudgetContent />
    </ProtectedRoute>
  );
}