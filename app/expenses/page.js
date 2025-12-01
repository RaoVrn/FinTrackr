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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Expenses</p>
                <p className="text-2xl font-bold text-gray-900">{filteredData.length}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">This Month</p>
                <p className="text-2xl font-bold text-red-600">₹{totalAmount.toLocaleString()}</p>
              </div>
              <div className="bg-rose-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Categories</p>
                <p className="text-2xl font-bold text-orange-600">{categories.length - 1}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Avg Per Day</p>
                <p className="text-2xl font-bold text-purple-600">₹{Math.round(totalAmount / 30).toLocaleString()}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
