// Utility functions for API calls with token-based authentication

export const apiCall = async (url, options = {}) => {
  // Get token from localStorage (your existing auth system)
  const token = typeof window !== 'undefined' ? localStorage.getItem('fintrackr_token') : null;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  // Add authorization header if token exists
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
    if (response.status === 401) {
      // Token expired or invalid - clear storage and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('fintrackr_user');
        localStorage.removeItem('fintrackr_token');
        window.location.href = '/login?error=session-expired';
      }
      return null;
    }
    
    return response;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

export const expenseAPI = {
  // Get all expenses for authenticated user with pagination and filtering
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    // Add pagination parameters
    if (params.page) queryParams.set('page', params.page.toString());
    if (params.limit) queryParams.set('limit', params.limit.toString());
    
    // Add filter parameters
    if (params.category) queryParams.set('category', params.category);
    if (params.startDate) queryParams.set('startDate', params.startDate);
    if (params.endDate) queryParams.set('endDate', params.endDate);
    
    const url = `/api/expenses${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await apiCall(url);
    if (response && response.ok) {
      return await response.json();
    }
    
    const error = await response?.json();
    throw new Error(error?.error || 'Failed to fetch expenses');
  },

  // Get single expense by ID
  getById: async (id) => {
    const response = await apiCall(`/api/expenses/${id}`);
    if (response && response.ok) {
      return await response.json();
    }
    
    const error = await response?.json();
    throw new Error(error?.error || 'Failed to fetch expense');
  },

  // Create new expense
  create: async (expenseData) => {
    const response = await apiCall('/api/expenses', {
      method: 'POST',
      body: JSON.stringify(expenseData),
    });
    
    if (response && response.ok) {
      return await response.json();
    }
    
    const error = await response?.json();
    
    // Handle validation errors specifically
    if (error?.details) {
      const errorMessage = Object.values(error.details).join(', ');
      throw new Error(errorMessage);
    }
    
    throw new Error(error?.error || 'Failed to create expense');
  },

  // Update expense
  update: async (id, expenseData) => {
    const response = await apiCall(`/api/expenses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(expenseData),
    });
    
    if (response && response.ok) {
      return await response.json();
    }
    
    const error = await response?.json();
    
    // Handle validation errors specifically
    if (error?.details) {
      const errorMessage = Object.values(error.details).join(', ');
      throw new Error(errorMessage);
    }
    
    throw new Error(error?.error || 'Failed to update expense');
  },

  // Delete expense
  delete: async (id) => {
    const response = await apiCall(`/api/expenses/${id}`, {
      method: 'DELETE',
    });
    
    if (response && response.ok) {
      return await response.json();
    }
    
    const error = await response?.json();
    throw new Error(error?.error || 'Failed to delete expense');
  },

  // Get expense statistics
  getStats: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.startDate) queryParams.set('startDate', params.startDate);
    if (params.endDate) queryParams.set('endDate', params.endDate);
    if (params.category) queryParams.set('category', params.category);
    
    const url = `/api/expenses/stats${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await apiCall(url);
    if (response && response.ok) {
      return await response.json();
    }
    
    const error = await response?.json();
    throw new Error(error?.error || 'Failed to fetch expense statistics');
  },
};

// Helper functions for expense management
export const expenseHelpers = {
  // Format currency amount
  formatCurrency: (amount, currency = 'INR') => {
    const currencySymbols = {
      'INR': '₹',
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'AUD': 'A$',
      'CAD': 'C$'
    };
    
    const symbol = currencySymbols[currency] || currency;
    return `${symbol}${amount.toFixed(2)}`;
  },

  // Format date for display
  formatDate: (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },

  // Format time for display
  formatTime: (time) => {
    if (!time) return '';
    return time;
  },

  // Get category icon
  getCategoryIcon: (category) => {
    const icons = {
      // Essential Categories
      'Food & Dining': '🍽️',
      'Groceries': '🛒',
      'Transport': '🚗',
      'Bills & Utilities': '📄',
      'Health & Medical': '🏥',
      'Housing & Rent': '🏠',
      // Lifestyle Categories
      'Entertainment': '🎬',
      'Shopping': '🛍️',
      'Travel & Vacation': '✈️',
      'Education': '📚',
      'Sports & Fitness': '⚽',
      'Beauty & Personal Care': '💄',
      // Financial Categories
      'Insurance': '🛡️',
      'Investments': '📈',
      'Loans & EMI': '🏦',
      'Taxes': '📊',
      // Work & Business
      'Business Expenses': '💼',
      'Office Supplies': '📋',
      // Technology
      'Electronics': '📱',
      'Software & Subscriptions': '💻',
      'Internet & Phone': '📶',
      // Family & Social
      'Childcare': '👶',
      'Pet Care': '🐕',
      'Gifts & Donations': '🎁',
      // Special Categories
      'Emergency': '🚨',
      'Cash Withdrawal': '💰',
      'Refund': '↩️',
      'Transfer': '🔄',
      'Other': '📦'
    };
    
    return icons[category] || '📦';
  },

  // Get payment method icon
  getPaymentMethodIcon: (method) => {
    const icons = {
      'cash': '💵',
      'upi': '📱',
      'debit-card': '💳',
      'credit-card': '💳',
      'netbanking': '🏦',
      'wallet': '📲'
    };
    
    return icons[method] || '💳';
  },

  // Calculate total from expenses array
  calculateTotal: (expenses, currency = 'INR') => {
    const total = expenses
      .filter(expense => expense.currency === currency)
      .reduce((sum, expense) => sum + expense.amount, 0);
    
    return total;
  },

  // Group expenses by category
  groupByCategory: (expenses) => {
    return expenses.reduce((groups, expense) => {
      const category = expense.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(expense);
      return groups;
    }, {});
  },

  // Group expenses by date
  groupByDate: (expenses) => {
    return expenses.reduce((groups, expense) => {
      const date = new Date(expense.date).toISOString().split('T')[0];
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(expense);
      return groups;
    }, {});
  }
};