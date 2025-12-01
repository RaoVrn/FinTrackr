"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "../../components/ProtectedRoute";
import { expenseAPI } from "../../lib/api";

function ExpenseDetailsContent() {
  const router = useRouter();
  const params = useParams();
  const expenseId = params.id;

  const [expense, setExpense] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchExpense = async () => {
      if (!expenseId) return;
      
      try {
        setIsLoading(true);
        const expenseData = await expenseAPI.getById(expenseId);
        setExpense(expenseData);
      } catch (error) {
        console.error('Error fetching expense:', error);
        setError('Failed to load expense details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchExpense();
  }, [expenseId]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    setIsDeleting(true);
    try {
      await expenseAPI.delete(expenseId);
      router.push('/expenses');
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Failed to delete expense. Please try again.');
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'Groceries': '🛒',
      'Food & Dining': '🍽️',
      'Transport': '🚗',
      'Entertainment': '🎬',
      'Shopping': '🛍️',
      'Bills': '📄',
      'Health': '🏥',
      'Education': '📚',
      'Travel': '✈️',
      'Default': '💰'
    };
    return icons[category] || icons['Default'];
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Groceries': 'from-green-400 to-emerald-500',
      'Food & Dining': 'from-orange-400 to-red-400',
      'Transport': 'from-blue-400 to-indigo-400',
      'Entertainment': 'from-purple-400 to-pink-400',
      'Shopping': 'from-green-400 to-teal-400',
      'Bills': 'from-gray-400 to-slate-400',
      'Health': 'from-red-400 to-pink-400',
      'Education': 'from-indigo-400 to-purple-400',
      'Travel': 'from-cyan-400 to-blue-400',
      'Default': 'from-blue-400 to-purple-400'
    };
    return colors[category] || colors['Default'];
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="bg-white rounded-2xl p-8">
            <div className="space-y-4">
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-6 bg-gray-200 rounded w-2/3"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Expense</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/expenses" className="btn-primary">
            Back to Expenses
          </Link>
        </div>
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Expense Not Found</h2>
          <p className="text-gray-600 mb-6">The expense you're looking for doesn't exist.</p>
          <Link href="/expenses" className="btn-primary">
            Back to Expenses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
          <Link href="/expenses" className="hover:text-blue-600">Expenses</Link>
          <span>›</span>
          <span>Expense Details</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{expense.title}</h1>
            <p className="text-gray-600">Added on {formatDate(expense.createdAt || expense.date)}</p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <Link
              href={`/expenses/edit/${expense._id}`}
              className="btn-secondary"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </Link>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="btn-danger disabled:opacity-50"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Expense Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Amount Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-2">Amount Spent</p>
                <p className="text-5xl font-bold text-gray-900">₹{expense.amount?.toLocaleString() || 0}</p>
              </div>
              <div className={`text-6xl p-4 rounded-2xl bg-gradient-to-br ${getCategoryColor(expense.category)}`}>
                <div className="text-white drop-shadow-lg">
                  {getCategoryIcon(expense.category)}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {expense.description && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
              <p className="text-gray-700 leading-relaxed">{expense.description}</p>
            </div>
          )}
        </div>

        {/* Info Sidebar */}
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Details</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-600">Category</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-lg">{getCategoryIcon(expense.category)}</span>
                  <span className="text-gray-900">{expense.category || 'Uncategorized'}</span>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-semibold text-gray-600">Date</p>
                <p className="text-gray-900 mt-1">{formatDate(expense.date || expense.createdAt)}</p>
              </div>
              
              {expense.needOrWant && (
                <div>
                  <p className="text-sm font-semibold text-gray-600">Priority</p>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      expense.needOrWant === 'need' ? 'bg-green-100 text-green-700' :
                      expense.needOrWant === 'want' ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {expense.needOrWant === 'need' ? '🔴 Need' : 
                       expense.needOrWant === 'want' ? '🟡 Want' : '⚪ Unsure'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Days ago</span>
                <span className="text-sm font-semibold text-gray-900">
                  {Math.floor((new Date() - new Date(expense.date || expense.createdAt)) / (1000 * 60 * 60 * 24))}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Per day avg</span>
                <span className="text-sm font-semibold text-gray-900">
                  ₹{(() => {
                    const daysAgo = Math.floor((new Date() - new Date(expense.date || expense.createdAt)) / (1000 * 60 * 60 * 24));
                    return daysAgo > 0 ? (expense.amount / Math.max(daysAgo, 1)).toFixed(0) : expense.amount;
                  })()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ExpenseDetails() {
  return (
    <ProtectedRoute>
      <ExpenseDetailsContent />
    </ProtectedRoute>
  );
}