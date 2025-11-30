"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "../../components/ProtectedRoute";
import { expenseAPI } from "../../lib/api";

function AddExpenseContent() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "",
    date: new Date().toISOString().split('T')[0], // Today's date
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const categories = [
    { value: 'Food', icon: '🍽️', color: 'from-orange-400 to-red-400' },
    { value: 'Transport', icon: '🚗', color: 'from-blue-400 to-indigo-400' },
    { value: 'Entertainment', icon: '🎬', color: 'from-purple-400 to-pink-400' },
    { value: 'Shopping', icon: '🛍️', color: 'from-green-400 to-teal-400' },
    { value: 'Bills', icon: '📄', color: 'from-gray-400 to-slate-400' },
    { value: 'Health', icon: '🏥', color: 'from-red-400 to-pink-400' },
    { value: 'Education', icon: '📚', color: 'from-indigo-400 to-purple-400' },
    { value: 'Travel', icon: '✈️', color: 'from-cyan-400 to-blue-400' },
  ];

  const validateForm = () => {
    const newErrors = {};
    
    if (!form.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!form.amount || parseFloat(form.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    
    if (!form.category) {
      newErrors.category = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await expenseAPI.create({
        ...form,
        amount: parseFloat(form.amount),
      });
      
      router.push('/expenses');
    } catch (error) {
      console.error('Error adding expense:', error);
      setErrors({ submit: error.message });
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setForm({ ...form, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center space-x-4 mb-4">
          <Link 
            href="/expenses"
            className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            ← Back
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Add New Expense</h1>
        <p className="text-gray-600">Track a new expense to keep your finances organized.</p>
      </div>

      {/* Form */}
      <div className="card animate-slide-up">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {errors.submit}
            </div>
          )}
          
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Expense Title *
            </label>
            <input
              id="title"
              type="text"
              placeholder="e.g., Groceries, Gas, Movie tickets"
              value={form.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={`input-field ${errors.title ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : ''}`}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Amount *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">₹</span>
              <input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                className={`input-field pl-8 ${errors.amount ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : ''}`}
              />
            </div>
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Category *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => handleInputChange('category', cat.value)}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 flex flex-col items-center space-y-2 hover:shadow-md ${
                    form.category === cat.value
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <span className="text-sm font-medium text-gray-700">{cat.value}</span>
                </button>
              ))}
            </div>
            {errors.category && (
              <p className="mt-2 text-sm text-red-600">{errors.category}</p>
            )}
          </div>

          {/* Date */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              id="date"
              type="date"
              value={form.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              className="input-field"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Adding Expense...' : 'Add Expense'}
            </button>
            <Link 
              href="/expenses"
              className="btn-secondary flex-1 text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>

      {/* Quick Tips */}
      <div className="mt-8 p-6 bg-blue-50 rounded-xl animate-fade-in">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Quick Tips</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use descriptive titles to easily identify expenses later</li>
          <li>• Choose the most relevant category for better expense tracking</li>
          <li>• Set the correct date to maintain accurate records</li>
        </ul>
      </div>
    </div>
  );
}

export default function AddExpense() {
  return (
    <ProtectedRoute>
      <AddExpenseContent />
    </ProtectedRoute>
  );
}
