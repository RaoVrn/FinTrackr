"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { expenseAPI } from '../lib/api';

export default function ExpenseCard({ expense, index, onDelete }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState({
    title: expense.title || '',
    amount: expense.amount || '',
    category: expense.category || '',
    description: expense.description || '',
    needOrWant: expense.needOrWant || 'unsure'
  });

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    setIsDeleting(true);
    try {
      await expenseAPI.delete(expense._id);
      onDelete(expense._id);
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Failed to delete expense. Please try again.');
      setIsDeleting(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditData({
      title: expense.title || '',
      amount: expense.amount || '',
      category: expense.category || '',
      description: expense.description || '',
      needOrWant: expense.needOrWant || 'unsure'
    });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await expenseAPI.update(expense._id, {
        title: editData.title.trim(),
        amount: parseFloat(editData.amount),
        category: editData.category,
        description: editData.description.trim(),
        needOrWant: editData.needOrWant
      });
      setIsEditing(false);
      window.location.reload(); // Refresh to show updated data
    } catch (error) {
      console.error('Error updating expense:', error);
      alert('Failed to update expense. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({
      title: expense.title || '',
      amount: expense.amount || '',
      category: expense.category || '',
      description: expense.description || '',
      needOrWant: expense.needOrWant || 'unsure'
    });
  };

  const handleInputChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
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
      'Food & Dining': 'from-orange-400 to-red-400',
      'Groceries': 'from-green-400 to-emerald-400',
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

  const categories = [
    'Food & Dining',
    'Groceries', 
    'Transport',
    'Entertainment',
    'Shopping',
    'Bills & Utilities',
    'Health & Medical',
    'Education',
    'Travel',
    'Other'
  ];

  return (
    <div 
      className={`expense-card animate-fade-in group ${isDeleting || isSaving ? 'opacity-50' : ''} relative`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Category Icon & Color Bar */}
      <div className={`absolute left-0 top-0 w-1 h-full bg-gradient-to-b ${getCategoryColor(isEditing ? editData.category : expense.category)}`}></div>
      
      {isEditing ? (
        // Edit Form
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="text-2xl">
              {getCategoryIcon(editData.category)}
            </div>
            <div className="flex-1 space-y-3">
              <input
                type="text"
                value={editData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Expense title"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  value={editData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Amount"
                  min="0"
                  step="0.01"
                />
                <select
                  value={editData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <select
                value={editData.needOrWant}
                onChange={(e) => handleInputChange('needOrWant', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="need">🔴 Need</option>
                <option value="want">🟡 Want</option>
                <option value="unsure">⚪ Unsure</option>
              </select>
            </div>
          </div>
        </div>
      ) : (
        // View Mode
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
      )}

      {/* Action Buttons */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between">
          {/* Quick Info */}
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            {expense.needOrWant && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                expense.needOrWant === 'need' ? 'bg-green-100 text-green-700' :
                expense.needOrWant === 'want' ? 'bg-orange-100 text-orange-700' :
                'bg-gray-100 text-gray-600'
              }`}>
                {expense.needOrWant === 'need' ? '🔴 Need' : 
                 expense.needOrWant === 'want' ? '🟡 Want' : '⚪ Unsure'}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={isSaving || !editData.title.trim() || !editData.amount}
                  className="text-green-600 hover:text-green-700 p-2 rounded-lg hover:bg-green-50 transition-colors duration-200 flex items-center space-x-1 disabled:opacity-50"
                  title="Save Changes"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-medium">{isSaving ? 'Saving...' : 'Save'}</span>
                </button>
                
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="text-gray-600 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-1 disabled:opacity-50"
                  title="Cancel Edit"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="text-sm font-medium">Cancel</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleEdit}
                  className="text-blue-600 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 transition-colors duration-200 flex items-center space-x-1"
                  title="Edit Expense"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span className="text-sm font-medium">Edit</span>
                </button>
                
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors duration-200 flex items-center space-x-1 disabled:opacity-50"
                  title="Delete Expense"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span className="text-sm font-medium">{isDeleting ? 'Deleting...' : 'Delete'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}