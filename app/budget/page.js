'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '../components/ProtectedRoute';
import { budgetAPI, expenseAPI } from '../lib/api';

export default function BudgetPage() {
  const [budgets, setBudgets] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [budgetResponse, expenseResponse] = await Promise.allSettled([
        budgetAPI.getAll(),
        expenseAPI.getAll()
      ]);
      
      setBudgets(budgetResponse.status === 'fulfilled' && Array.isArray(budgetResponse.value) ? budgetResponse.value : []);
      setExpenses(expenseResponse.status === 'fulfilled' && Array.isArray(expenseResponse.value) ? expenseResponse.value : []);
      
      const failedAPIs = [];
      if (budgetResponse.status === 'rejected') failedAPIs.push('Budgets');
      if (expenseResponse.status === 'rejected') failedAPIs.push('Expenses');
      
      if (failedAPIs.length > 0) {
        setError(`Some data could not be loaded: ${failedAPIs.join(', ')}`);
      } else {
        setError('');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch budget data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      try {
        await budgetAPI.delete(id);
        setBudgets(budgets.filter(budget => budget._id !== id));
      } catch (error) {
        console.error('Error deleting budget:', error);
        setError('Failed to delete budget');
      }
    }
  };

  const getBudgetProgress = (budget) => {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const monthlyExpenses = Array.isArray(expenses) ? expenses.filter(expense => 
      expense.category === budget.category && 
      expense.date && expense.date.startsWith(currentMonth)
    ) : [];
    const spent = monthlyExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
    return { spent, percentage };
  };

  const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);
  const totalSpent = budgets.reduce((sum, budget) => {
    const { spent } = getBudgetProgress(budget);
    return sum + spent;
  }, 0);
  const remainingBudget = totalBudget - totalSpent;

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
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Budget Management</h1>
                <p className="text-gray-600">Set and track spending limits for different categories</p>
              </div>
              <button
                onClick={() => router.push('/budget/new')}
                className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                + Create Budget
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
                  <p className="text-gray-500 text-sm font-medium">Total Budget</p>
                  <p className="text-2xl font-bold text-blue-600">₹{totalBudget.toLocaleString()}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Total Spent</p>
                  <p className="text-2xl font-bold text-red-600">₹{totalSpent.toLocaleString()}</p>
                </div>
                <div className="bg-red-100 p-3 rounded-full">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Remaining</p>
                  <p className={`text-2xl font-bold ${remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{Math.abs(remainingBudget).toLocaleString()}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${remainingBudget >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  <svg className={`w-6 h-6 ${remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Categories</p>
                  <p className="text-2xl font-bold text-purple-600">{budgets.length}</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Budget List */}
          <div className="space-y-6">
            {budgets.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 shadow-lg border border-gray-100 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Budgets Created</h3>
                <p className="text-gray-600 mb-6">Create your first budget to start tracking your spending by category.</p>
                <button
                  onClick={() => router.push('/budget/new')}
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  + Create Your First Budget
                </button>
              </div>
            ) : (
              budgets.map((budget) => {
                const { spent, percentage } = getBudgetProgress(budget);
                const isOverBudget = percentage > 100;
                const isWarning = percentage > 80;
                
                return (
                  <div key={budget._id} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-gray-800">{budget.category}</h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            isOverBudget ? 'bg-red-100 text-red-800' :
                            isWarning ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {isOverBudget ? 'Over Budget' : isWarning ? 'Near Limit' : 'On Track'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-500">Budget Amount</p>
                            <p className="text-lg font-semibold text-gray-800">₹{budget.amount.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Spent This Month</p>
                            <p className="text-lg font-semibold text-red-600">₹{spent.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Remaining</p>
                            <p className={`text-lg font-semibold ${
                              (budget.amount - spent) >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              ₹{Math.abs(budget.amount - spent).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Usage</p>
                            <p className={`text-lg font-semibold ${
                              isOverBudget ? 'text-red-600' : isWarning ? 'text-yellow-600' : 'text-green-600'
                            }`}>
                              {percentage.toFixed(1)}%
                            </p>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-2">
                          <div className="w-full bg-gray-200 rounded-full h-4">
                            <div 
                              className={`h-4 rounded-full transition-all duration-300 ${
                                isOverBudget ? 'bg-gradient-to-r from-red-500 to-red-600' :
                                isWarning ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                                'bg-gradient-to-r from-green-400 to-green-500'
                              }`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={() => router.push(`/budget/edit/${budget._id}`)}
                          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(budget._id)}
                          className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-xl font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}