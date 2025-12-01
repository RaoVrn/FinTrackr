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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50/30 to-rose-50/50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="w-20 h-20 border-4 border-gray-200 rounded-full"></div>
            <div className="w-20 h-20 border-4 border-red-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <div className="space-y-2">
            <p className="text-xl font-semibold text-gray-800">Loading Expenses</p>
            <p className="text-gray-600">Fetching your financial data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50/40 to-rose-50/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-red-600 mb-2">
                Expense Management
              </h1>
              <p className="text-gray-600 text-lg">
                Track all your expense sources and spending
              </p>
            </div>
            <Link 
              href="/expenses/new" 
              className="bg-gradient-to-r from-red-500 to-rose-500 text-white px-6 py-3 rounded-xl hover:from-red-600 hover:to-rose-600 transition-all duration-200 flex items-center space-x-2 shadow-lg font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Expense</span>
            </Link>
          </div>
        </div>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white/80 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-white/20">
            <div className="flex items-center justify-center mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-rose-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">📄</span>
              </div>
            </div>
            <h3 className="font-medium text-gray-900 mb-1 text-sm text-center">Total Expenses</h3>
            <p className="text-lg font-bold text-gray-900 text-center">{filteredData.length}</p>
            <p className="text-xs text-red-600 text-center">All time expenses</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-white/20">
            <div className="flex items-center justify-center mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-rose-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">💰</span>
              </div>
            </div>
            <h3 className="font-medium text-gray-900 mb-1 text-sm text-center">This Month</h3>
            <p className="text-lg font-bold text-gray-900 text-center">₹{totalAmount.toLocaleString()}</p>
            <p className="text-xs text-rose-600 text-center">Monthly spending</p>
          </div>
        </div>


        {/* Main Content Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Section Header */}
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Your Expense Sources</h2>
                <p className="text-sm text-gray-600 mt-1">Manage and track all your expenses</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-4">
                  <input
                    type="text"
                    placeholder="Search expenses..."
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category === 'all' ? 'All Categories' : category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Expenses List */}
          <div className="px-6 py-4">
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
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">💰</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No expenses recorded yet</h3>
                <p className="text-gray-600 mb-4">Start tracking your spending by adding your first expense entry</p>
                <Link 
                  href="/expenses/new" 
                  className="bg-gradient-to-r from-red-500 to-rose-500 text-white px-6 py-2 rounded-lg hover:from-red-600 hover:to-rose-600 transition-all duration-200 inline-flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add Your First Expense</span>
                </Link>
              </div>
            )}
          </div>
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
