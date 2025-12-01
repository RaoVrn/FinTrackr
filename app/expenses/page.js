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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Expenses</h1>
          <p className="text-gray-600">
            {filteredData.length} expense{filteredData.length !== 1 ? 's' : ''} • 
            Total: <span className="font-semibold text-blue-600">₹{totalAmount.toLocaleString()}</span>
          </p>
        </div>
        <Link 
          href="/expenses/new"
          className="btn-primary mt-4 sm:mt-0"
        >
          Add New Expense
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-8 animate-slide-up">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Filter by category</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setFilter(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                filter === category
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category === 'all' ? 'All Categories' : category}
            </button>
          ))}
        </div>
      </div>

      {/* Expenses Grid */}
      {filteredData.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
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
        <div className="text-center py-16 animate-fade-in">
          <div className="text-6xl mb-4">💸</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {filter === 'all' ? 'No expenses yet' : `No expenses in "${filter}"`}
          </h3>
          <p className="text-gray-600 mb-6">
            {filter === 'all' 
              ? 'Start tracking your expenses to see them here.' 
              : 'Try selecting a different category or add a new expense.'
            }
          </p>
          <Link 
            href="/expenses/new"
            className="btn-primary"
          >
            Add Your First Expense
          </Link>
        </div>
      )}
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
