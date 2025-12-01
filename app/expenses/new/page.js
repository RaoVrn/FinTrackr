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
    date: new Date().toISOString().split('T')[0],
    time: "",
    paymentMethod: "",
    account: "",
    merchant: "",
    notes: "",
    isRecurring: false,
    recurringInterval: "",
    needOrWant: "need",
    hasReceipt: false,
    receiptUrl: "",
    currency: "INR"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState({ name: '', icon: '📦' });
  const [customCategories, setCustomCategories] = useState([]);
  const [categoryTab, setCategoryTab] = useState('default'); // 'default' or 'custom'

  const categories = [
    // Most Essential Daily Categories
    { value: 'Food & Dining', icon: '🍽️', color: 'from-orange-400 to-red-400' },
    { value: 'Groceries', icon: '🛒', color: 'from-green-400 to-emerald-400' },
    { value: 'Transport', icon: '🚗', color: 'from-blue-400 to-indigo-400' },
    { value: 'Bills & Utilities', icon: '📄', color: 'from-gray-400 to-slate-400' },
    { value: 'Health & Medical', icon: '🏥', color: 'from-red-400 to-pink-400' },
    { value: 'Housing & Rent', icon: '🏠', color: 'from-yellow-400 to-orange-400' },
    
    // Common Lifestyle
    { value: 'Entertainment', icon: '🎬', color: 'from-purple-400 to-pink-400' },
    { value: 'Shopping', icon: '🛍️', color: 'from-pink-400 to-rose-400' },
    { value: 'Education', icon: '📚', color: 'from-indigo-400 to-purple-400' },
    
    // Financial Essentials
    { value: 'Insurance', icon: '🛡️', color: 'from-blue-400 to-cyan-400' },
    { value: 'Investments', icon: '📈', color: 'from-emerald-400 to-green-400' },
    { value: 'Loans & EMI', icon: '🏦', color: 'from-red-400 to-orange-400' },
    
    // Other Important
    { value: 'Travel', icon: '✈️', color: 'from-cyan-400 to-blue-400' },
    { value: 'Gifts', icon: '🎁', color: 'from-rose-400 to-pink-400' },
    { value: 'Other', icon: '📦', color: 'from-gray-400 to-gray-500' }
  ];

  // Available icons for custom categories
  const availableIcons = [
    '📦', '🎯', '💡', '🔧', '🎨', '🏃', '🎪', '🎭', '🎸', '🎲', 
    '🏀', '⚽', '🎾', '🏈', '🏐', '🏓', '🏸', '🥊', '🎳', '🎯',
    '🚀', '🔥', '⭐', '💫', '✨', '🌟', '⚡', '💎', '🌈', '🎊',
    '📚', '📖', '📝', '📊', '📈', '📉', '📋', '📌', '📍', '📎',
    '💼', '🏢', '🏭', '🏪', '🏬', '🏫', '🏦', '🏛️', '🏗️', '🏘️',
    '🍎', '🍌', '🍊', '🍇', '🥕', '🥬', '🍞', '🧀', '🥛', '☕',
    '🚗', '🚕', '🚌', '🚐', '🏍️', '🚲', '🛴', '🚁', '✈️', '🚢',
    '💻', '📱', '⌨️', '🖥️', '📺', '📻', '🎮', '📷', '📹', '🔊',
    '👕', '👖', '👗', '👠', '👟', '👑', '💍', '👜', '🎩', '🧢',
    '🏠', '🏡', '🏢', '🏰', '🏯', '🗼', '🌉', '🎡', '🎢', '🎠'
  ];

  // Handle custom category creation
  const handleCreateCustomCategory = () => {
    if (!customCategory.name.trim()) {
      setErrors({ ...errors, customCategory: 'Category name is required' });
      return;
    }
    
    const newCategory = {
      value: customCategory.name.trim(),
      icon: customCategory.icon,
      color: 'from-indigo-400 to-purple-400',
      isCustom: true
    };
    
    setCustomCategories([...customCategories, newCategory]);
    handleInputChange('category', newCategory.value);
    setCustomCategory({ name: '', icon: '📦' });
    setShowCustomCategory(false);
    setErrors({ ...errors, customCategory: '' });
  };

  const paymentMethods = [
    { value: 'cash', label: 'Cash', icon: '💵' },
    { value: 'upi', label: 'UPI', icon: '📱' },
    { value: 'debit-card', label: 'Debit Card', icon: '💳' },
    { value: 'credit-card', label: 'Credit Card', icon: '💳' },
    { value: 'netbanking', label: 'Net Banking', icon: '🏦' },
    { value: 'wallet', label: 'Digital Wallet', icon: '📲' }
  ];

  const recurringIntervals = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' }
  ];

  const validateForm = () => {
    const newErrors = {};
    
    // Required field validation
    if (!form.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (form.title.length > 100) {
      newErrors.title = 'Title cannot exceed 100 characters';
    }
    
    if (!form.amount || parseFloat(form.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    
    if (!form.category) {
      newErrors.category = 'Category is required';
    }

    if (!form.paymentMethod) {
      newErrors.paymentMethod = 'Payment method is required';
    }

    // Time validation (optional)
    if (form.time && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(form.time)) {
      newErrors.time = 'Time must be in HH:MM format';
    }

    // Recurring validation
    if (form.isRecurring && !form.recurringInterval) {
      newErrors.recurringInterval = 'Recurring interval is required when expense is recurring';
    }

    // Date validation
    const expenseDate = new Date(form.date);
    if (isNaN(expenseDate.getTime())) {
      newErrors.date = 'Invalid date format';
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
      // Find the selected category to get its icon
      const selectedCategory = [...categories, ...customCategories].find(cat => cat.value === form.category);
      const categoryIcon = selectedCategory ? selectedCategory.icon : '📦';

      // Use the expenseAPI helper which handles authentication
      const result = await expenseAPI.create({
        ...form,
        amount: parseFloat(form.amount),
        categoryIcon: categoryIcon,
      });
      
      // Success - redirect to expenses page
      router.push('/expenses?success=expense-added');
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

  const clearErrors = () => {
    setErrors({});
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Link 
            href="/expenses"
            className="text-gray-500 hover:text-gray-700 transition-colors duration-200 flex items-center"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Expenses
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Add New Expense</h1>
        <p className="text-gray-600">Track your spending with detailed expense information.</p>
      </div>

      {/* Form */}
      <div className="bg-white shadow-lg rounded-xl p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              <div className="flex">
                <svg className="w-5 h-5 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {errors.submit}
              </div>
            </div>
          )}
          
          {/* Basic Information Section */}
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
              <p className="text-sm text-gray-600">Enter the essential details of your expense</p>
            </div>

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Expense Title *
              </label>
              <input
                id="title"
                type="text"
                placeholder="e.g., Groceries from Walmart, Uber ride, Coffee"
                value={form.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  errors.title ? 'border-red-300' : 'border-gray-300'
                }`}
                maxLength="100"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">{form.title.length}/100 characters</p>
            </div>

            {/* Amount and Currency */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-3">
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                  Amount *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">₹</span>
                  <input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.amount ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                )}
              </div>
              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  id="currency"
                  value={form.currency}
                  onChange={(e) => handleInputChange('currency', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Category *
              </label>
              
              {/* Tab Navigation */}
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setCategoryTab('default');
                    setShowCustomCategory(false);
                  }}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    categoryTab === 'default'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span className="flex items-center justify-center">
                    <span className="mr-2">📋</span>
                    Default Categories
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCategoryTab('custom');
                    setShowCustomCategory(false);
                  }}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    categoryTab === 'custom'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span className="flex items-center justify-center">
                    <span className="mr-2">✨</span>
                    Custom Categories
                    {customCategories.length > 0 && (
                      <span className="ml-2 bg-purple-100 text-purple-600 text-xs px-2 py-1 rounded-full">
                        {customCategories.length}
                      </span>
                    )}
                  </span>
                </button>
              </div>

              {/* Tab Content */}
              {categoryTab === 'default' && (
                <div>
                  {/* Default Categories Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 min-h-[200px]">
                    {categories.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => handleInputChange('category', cat.value)}
                        className={`p-3 rounded-lg border-2 transition-all duration-200 flex flex-col items-center space-y-2 hover:shadow-md min-h-[80px] ${
                          form.category === cat.value
                            ? 'border-blue-500 bg-blue-50 shadow-md transform scale-105'
                            : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-xl">{cat.icon}</span>
                        <span className="text-xs font-medium text-gray-700 text-center leading-tight">{cat.value}</span>
                      </button>
                    ))}
                  </div>
                  <p className="mt-3 text-sm text-gray-500">
                    📋 Choose from our curated list of common expense categories
                  </p>
                </div>
              )}

              {categoryTab === 'custom' && (
                <div>
                  {/* Custom Category Creator Button */}
                  {!showCustomCategory && (
                    <div className="text-center py-8">
                      <button
                        type="button"
                        onClick={() => setShowCustomCategory(true)}
                        className="inline-flex items-center px-6 py-3 border-2 border-dashed border-purple-300 rounded-lg text-purple-600 hover:border-purple-400 hover:text-purple-700 transition-colors"
                      >
                        <span className="text-xl mr-2">+</span>
                        Create New Custom Category
                      </button>
                      <p className="mt-2 text-sm text-gray-500">
                        Create categories that fit your specific needs
                      </p>
                    </div>
                  )}

                  {/* Custom Category Creator */}
                  {showCustomCategory && (
                    <div className="mb-4 p-4 border-2 border-dashed border-purple-300 rounded-lg bg-purple-50">
                      <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                        <span className="mr-2">✨</span>
                        Create Your Own Category
                      </h4>
                      <div className="space-y-3">
                        {/* Category Name Input */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Category Name
                          </label>
                          <input
                            type="text"
                            placeholder="e.g., Hobbies, Side Projects, Coffee Addiction"
                            value={customCategory.name}
                            onChange={(e) => setCustomCategory({ ...customCategory, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            maxLength="50"
                          />
                        </div>
                        
                        {/* Icon Selector */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Choose an Icon
                          </label>
                          <div className="grid grid-cols-10 gap-2 max-h-32 overflow-y-auto border border-gray-200 rounded p-2 bg-white">
                            {availableIcons.map((icon) => (
                              <button
                                key={icon}
                                type="button"
                                onClick={() => setCustomCategory({ ...customCategory, icon })}
                                className={`p-2 rounded hover:bg-gray-100 transition-colors ${
                                  customCategory.icon === icon ? 'bg-purple-100 ring-2 ring-purple-500' : ''
                                }`}
                              >
                                <span className="text-lg">{icon}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        {/* Preview */}
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-700">Preview:</span>
                          <div className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-200 rounded-lg">
                            <span className="text-xl">{customCategory.icon}</span>
                            <span className="text-sm font-medium text-gray-700">
                              {customCategory.name || 'Category Name'}
                            </span>
                          </div>
                        </div>
                        
                        {/* Create Button */}
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={handleCreateCustomCategory}
                            disabled={!customCategory.name.trim()}
                            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                          >
                            Create & Use Category
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowCustomCategory(false);
                              setCustomCategory({ name: '', icon: '📦' });
                            }}
                            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                        
                        {errors.customCategory && (
                          <p className="text-sm text-red-600">{errors.customCategory}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Custom Categories Grid */}
                  {customCategories.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                        <span className="mr-2">⭐</span>
                        Your Custom Categories ({customCategories.length})
                      </h5>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-4">
                        {customCategories.map((cat) => (
                          <button
                            key={cat.value}
                            type="button"
                            onClick={() => handleInputChange('category', cat.value)}
                            className={`p-3 rounded-lg border-2 transition-all duration-200 flex flex-col items-center space-y-2 hover:shadow-md min-h-[80px] relative ${
                              form.category === cat.value
                                ? 'border-blue-500 bg-blue-50 shadow-md transform scale-105'
                                : 'border-purple-200 hover:border-purple-300 bg-purple-50 hover:bg-purple-100'
                            }`}
                          >
                            <span className="absolute top-1 right-1 text-xs text-purple-600">★</span>
                            <span className="text-xl">{cat.icon}</span>
                            <span className="text-xs font-medium text-gray-700 text-center leading-tight">{cat.value}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {customCategories.length === 0 && !showCustomCategory && (
                    <div className="text-center py-8 text-gray-500">
                      <span className="text-4xl block mb-2">📦</span>
                      <p>No custom categories yet</p>
                      <p className="text-sm">Create your first custom category above</p>
                    </div>
                  )}
                </div>
              )}
              
              {errors.category && (
                <p className="mt-3 text-sm text-red-600">{errors.category}</p>
              )}
            </div>

            {/* Payment Method */}
            <div>
              <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method *
              </label>
              <select
                id="paymentMethod"
                value={form.paymentMethod}
                onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.paymentMethod ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select payment method</option>
                {paymentMethods.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.icon} {method.label}
                  </option>
                ))}
              </select>
              {errors.paymentMethod && (
                <p className="mt-1 text-sm text-red-600">{errors.paymentMethod}</p>
              )}
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.date && (
                  <p className="mt-1 text-sm text-red-600">{errors.date}</p>
                )}
              </div>
              <div>
                <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
                  Time (Optional)
                </label>
                <input
                  id="time"
                  type="time"
                  value={form.time}
                  onChange={(e) => handleInputChange('time', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.time ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.time && (
                  <p className="mt-1 text-sm text-red-600">{errors.time}</p>
                )}
              </div>
            </div>

            {/* Expense Type - Need vs Want vs Unsure */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Expense Type
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => handleInputChange('needOrWant', 'need')}
                  className={`py-3 px-4 rounded-lg border-2 transition-all ${
                    form.needOrWant === 'need'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-lg">✅</div>
                    <div className="font-medium">Need</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleInputChange('needOrWant', 'want')}
                  className={`py-3 px-4 rounded-lg border-2 transition-all ${
                    form.needOrWant === 'want'
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-lg">✨</div>
                    <div className="font-medium">Want</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleInputChange('needOrWant', 'unsure')}
                  className={`py-3 px-4 rounded-lg border-2 transition-all ${
                    form.needOrWant === 'unsure'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-lg">🤷</div>
                    <div className="font-medium">Unsure</div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Toggle Optional Fields */}
          <div className="border-t border-gray-200 pt-6">
            <button
              type="button"
              onClick={() => setShowOptionalFields(!showOptionalFields)}
              className="flex items-center text-blue-600 hover:text-blue-700 font-medium"
            >
              <svg 
                className={`w-5 h-5 mr-2 transition-transform ${showOptionalFields ? 'rotate-90' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              {showOptionalFields ? 'Hide' : 'Show'} Additional Details
            </button>
          </div>

          {/* Optional Fields Section */}
          {showOptionalFields && (
            <div className="space-y-6 bg-gray-50 p-6 rounded-lg">
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold text-gray-900">Additional Details</h3>
                <p className="text-sm text-gray-600">Add more context to your expense</p>
              </div>

              {/* Merchant and Account */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="merchant" className="block text-sm font-medium text-gray-700 mb-2">
                    Merchant/Store Name
                  </label>
                  <input
                    id="merchant"
                    type="text"
                    placeholder="e.g., Walmart, Starbucks, Amazon"
                    value={form.merchant}
                    onChange={(e) => handleInputChange('merchant', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    maxLength="100"
                  />
                </div>
                <div>
                  <label htmlFor="account" className="block text-sm font-medium text-gray-700 mb-2">
                    Account/Wallet Name
                  </label>
                  <input
                    id="account"
                    type="text"
                    placeholder="e.g., SBI Savings, Paytm, PhonePe"
                    value={form.account}
                    onChange={(e) => handleInputChange('account', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    maxLength="50"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  id="notes"
                  placeholder="Add any additional notes or details about this expense..."
                  value={form.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength="500"
                />
                <p className="mt-1 text-xs text-gray-500">{form.notes.length}/500 characters</p>
              </div>

              {/* Receipt Toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Receipt Available
                </label>
                <button
                  type="button"
                  onClick={() => handleInputChange('hasReceipt', !form.hasReceipt)}
                  className={`w-full py-3 px-4 rounded-lg border-2 transition-all ${
                    form.hasReceipt
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-center">
                    <div className="text-lg mr-2">📄</div>
                    <div className="font-medium">
                      {form.hasReceipt ? 'Receipt Available' : 'No Receipt'}
                    </div>
                  </div>
                </button>
              </div>

              {/* Recurring Expense */}
              <div>
                <div className="flex items-center mb-3">
                  <input
                    id="recurring"
                    type="checkbox"
                    checked={form.isRecurring}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      handleInputChange('isRecurring', isChecked);
                      if (!isChecked) {
                        handleInputChange('recurringInterval', '');
                      }
                    }}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label 
                    htmlFor="recurring" 
                    className="ml-2 text-sm font-medium text-gray-700 cursor-pointer"
                  >
                    This is a recurring expense
                  </label>
                </div>
                
                {form.isRecurring && (
                  <div>
                    <label htmlFor="recurringInterval" className="block text-sm font-medium text-gray-700 mb-2">
                      Recurring Interval *
                    </label>
                    <select
                      id="recurringInterval"
                      value={form.recurringInterval}
                      onChange={(e) => handleInputChange('recurringInterval', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.recurringInterval ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select frequency</option>
                      {recurringIntervals.map((interval) => (
                        <option key={interval.value} value={interval.value}>
                          {interval.label}
                        </option>
                      ))}
                    </select>
                    {errors.recurringInterval && (
                      <p className="mt-1 text-sm text-red-600">{errors.recurringInterval}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Receipt Upload Placeholder */}
              {form.hasReceipt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Receipt Upload (Coming Soon)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-600">Receipt upload feature will be available soon</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-gray-200">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding Expense...
                </span>
              ) : (
                'Add Expense'
              )}
            </button>
            <Link 
              href="/expenses"
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 focus:ring-4 focus:ring-gray-500/20 transition-all text-center font-medium"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>

      {/* Help Section */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Tips for Better Expense Tracking
        </h3>
        <ul className="text-sm text-blue-800 space-y-2">
          <li className="flex items-start">
            <span className="font-medium mr-2">•</span>
            <span>Use descriptive titles that will help you remember the purchase later</span>
          </li>
          <li className="flex items-start">
            <span className="font-medium mr-2">•</span>
            <span>Choose the most appropriate category for better expense analysis</span>
          </li>
          <li className="flex items-start">
            <span className="font-medium mr-2">•</span>
            <span>Mark recurring expenses to automatically track subscriptions and bills</span>
          </li>
          <li className="flex items-start">
            <span className="font-medium mr-2">•</span>
            <span>Distinguish between "needs" and "wants" to better understand spending patterns</span>
          </li>
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
