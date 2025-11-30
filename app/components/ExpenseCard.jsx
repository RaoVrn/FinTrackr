"use client";

import { useState } from 'react';

export default function ExpenseCard({ expense, index, onDelete }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/${expense._id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onDelete(expense._id);
      } else {
        console.error('Failed to delete expense');
        setIsDeleting(false);
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'Food': '🍽️',
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
      'Food': 'from-orange-400 to-red-400',
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

  return (
    <div 
      className={`expense-card animate-fade-in group ${isDeleting ? 'opacity-50' : ''}`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Category Icon & Color Bar */}
      <div className={`absolute left-0 top-0 w-1 h-full bg-gradient-to-b ${getCategoryColor(expense.category)}`}></div>
      
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">
            {getCategoryIcon(expense.category)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-lg group-hover:text-blue-600 transition-colors duration-200">
              {expense.title}
            </h3>
            <p className="text-sm text-gray-500">
              {expense.category || 'Uncategorized'}
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">
            ₹{expense.amount?.toLocaleString() || 0}
          </p>
          <p className="text-sm text-gray-500">
            {formatDate(expense.date || expense.createdAt)}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-red-600 hover:text-red-700 text-sm font-medium hover:bg-red-50 px-3 py-1 rounded-md transition-colors duration-200 disabled:opacity-50"
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  );
}