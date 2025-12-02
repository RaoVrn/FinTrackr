"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import ExpenseCard from "../components/ExpenseCard";
import ProtectedRoute from "../components/ProtectedRoute";
import { expenseAPI } from "../lib/api";

function ExpensesContent() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [budgetUpdateInfo, setBudgetUpdateInfo] = useState(null);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const result = await expenseAPI.getAll();
        // Handle new API response format
        const expenses = result.expenses || result || [];
        setData(expenses);
      } catch (error) {
        console.error('Error fetching expenses:', error);
        setData([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };

    // Check for success messages and budget updates from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'expense-added') {
      setShowSuccessMessage(true);
      
      // Check for budget update info
      if (urlParams.get('budget-updated') === 'true') {
        setBudgetUpdateInfo({
          category: urlParams.get('budget-category'),
          spent: parseFloat(urlParams.get('budget-spent')) || 0,
          remaining: parseFloat(urlParams.get('budget-remaining')) || 0,
          progress: parseFloat(urlParams.get('budget-progress')) || 0
        });
      }
      
      // Check for alerts
      const alertsParam = urlParams.get('alerts');
      if (alertsParam) {
        try {
          const parsedAlerts = JSON.parse(decodeURIComponent(alertsParam));
          setAlerts(parsedAlerts);
        } catch (e) {
          console.error('Error parsing alerts:', e);
        }
      }
      
      // Clear URL parameters after processing
      setTimeout(() => {
        window.history.replaceState({}, '', window.location.pathname);
        setShowSuccessMessage(false);
        setBudgetUpdateInfo(null);
        setAlerts([]);
      }, 8000); // Show for 8 seconds
    }

    fetchExpenses();
  }, []);

  // Ensure data is always an array
  const expensesArray = Array.isArray(data) ? data : [];
  const categories = ['all', ...new Set(expensesArray.map(exp => exp.category).filter(Boolean))];
  
  const filteredData = filter === 'all' 
    ? expensesArray 
    : expensesArray.filter(exp => exp.category === filter);

  const totalAmount = filteredData.reduce((sum, exp) => sum + (exp.amount || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your expense data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-pink-50">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Messages */}
        {showSuccessMessage && (
          <div className="mb-6 space-y-4">
            {/* Main Success Message */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Expense Added Successfully!
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>Your expense has been recorded and is now tracking in your financial overview.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Budget Update Message */}
            {budgetUpdateInfo && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Budget Updated
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        Your <strong>{budgetUpdateInfo.category}</strong> budget has been updated:
                      </p>
                      <div className="mt-1 grid grid-cols-3 gap-4 text-xs">
                        <div>Spent: ₹{budgetUpdateInfo.spent.toLocaleString()}</div>
                        <div>Remaining: ₹{budgetUpdateInfo.remaining.toLocaleString()}</div>
                        <div>Progress: {budgetUpdateInfo.progress}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Budget Alerts */}
            {alerts.length > 0 && (
              <div className="space-y-2">
                {alerts.map((alert, index) => (
                  <div 
                    key={index}
                    className={`border rounded-lg p-4 ${
                      alert.type === 'exceeded' 
                        ? 'bg-red-50 border-red-200' 
                        : alert.percentage >= 75
                        ? 'bg-orange-50 border-orange-200'
                        : 'bg-yellow-50 border-yellow-200'
                    }`}
                  >
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg 
                          className={`h-5 w-5 ${
                            alert.type === 'exceeded' 
                              ? 'text-red-400' 
                              : alert.percentage >= 75
                              ? 'text-orange-400'
                              : 'text-yellow-400'
                          }`} 
                          fill="currentColor" 
                          viewBox="0 0 20 20"
                        >
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className={`text-sm font-medium ${
                          alert.type === 'exceeded' 
                            ? 'text-red-800' 
                            : alert.percentage >= 75
                            ? 'text-orange-800'
                            : 'text-yellow-800'
                        }`}>
                          Budget Alert
                        </h3>
                        <div className={`mt-1 text-sm ${
                          alert.type === 'exceeded' 
                            ? 'text-red-700' 
                            : alert.percentage >= 75
                            ? 'text-orange-700'
                            : 'text-yellow-700'
                        }`}>
                          <p>{alert.message}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-red-700 to-rose-700 bg-clip-text text-transparent mb-2">
                Expense Management
              </h1>
              <p className="text-gray-600 text-lg">Track all your expense sources and spending</p>
            </div>
            <Link 
              href="/expenses/new" 
              className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium shadow-lg hover:shadow-xl"
            >
              Add Expense
            </Link>
          </div>
        </div>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">₹{totalAmount.toLocaleString()}</p>
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
                <p className="text-gray-500 text-sm font-medium">This Month</p>
                <p className="text-2xl font-bold text-orange-600">₹{totalAmount.toLocaleString()}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Categories</p>
                <p className="text-2xl font-bold text-purple-600">{categories.length - 1}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Expense Entries</p>
                <p className="text-2xl font-bold text-pink-600">{filteredData.length}</p>
              </div>
              <div className="bg-pink-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>


        {/* Expense List */}
        <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border border-white/20 p-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 space-y-3 lg:space-y-0">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Your Expense Sources</h2>
              <p className="text-sm text-gray-600">Manage and track all your expenses</p>
            </div>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search expenses..."
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 w-full sm:w-64"
                />
                <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              
              {/* Category Filter */}
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredData.length > 0 ? (
            <div className="space-y-4">
              {filteredData.map((expense, index) => (
                <ExpenseCard 
                  key={expense._id} 
                  expense={expense} 
                  index={index}
                  onDelete={() => {
                    setData(expensesArray.filter(exp => exp._id !== expense._id));
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No expenses recorded yet</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Start tracking your spending by adding your first expense entry
              </p>
              <Link 
                href="/expenses/new" 
                className="inline-flex items-center px-8 py-4 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium text-lg shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Add Your First Expense
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Expenses() {
  return (
    <ProtectedRoute>
      <ExpensesContent />
    </ProtectedRoute>
  );
}
