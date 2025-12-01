// Utility functions for API calls with token-based authentication

export const apiCall = async (url, options = {}) => {
  // Get token from localStorage (your existing auth system)
  const token = typeof window !== 'undefined' ? localStorage.getItem('fintrackr_token') : null;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  // Add authorization header if token exists
  if (token) {
    defaultHeaders['authorization'] = `Bearer ${token}`;
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

// Generic API creator for consistent API patterns
const createAPI = (endpoint) => ({
  // Get all items with filtering
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined) {
        queryParams.set(key, params[key].toString());
      }
    });

    const url = `/api/${endpoint}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await apiCall(url);
    if (response && response.ok) {
      const data = await response.json();
      // Handle different response formats
      if (data.expenses) return data.expenses; // For expenses API
      if (data.incomes) return data.incomes; // For income API  
      if (data.debts) return data.debts; // For debts API
      if (data.investments && Array.isArray(data.investments)) return data.investments; // For investments API
      if (data.budgets) return data.budgets; // For budgets API
      if (Array.isArray(data)) return data; // Direct array format
      return []; // Fallback to empty array
    }
    
    const error = await response?.json();
    throw new Error(error?.error || `Failed to fetch ${endpoint}`);
  },

  // Get single item by ID
  getById: async (id) => {
    const response = await apiCall(`/api/${endpoint}/${id}`);
    if (response && response.ok) {
      return await response.json();
    }
    
    const error = await response?.json();
    throw new Error(error?.error || `Failed to fetch ${endpoint}`);
  },

  // Create new item
  create: async (data) => {
    const response = await apiCall(`/api/${endpoint}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    if (response && response.ok) {
      return await response.json();
    }
    
    const error = await response?.json();
    if (error?.details) {
      throw new Error(error.details.join(', '));
    }
    throw new Error(error?.error || `Failed to create ${endpoint}`);
  },

  // Update item
  update: async (id, data) => {
    const response = await apiCall(`/api/${endpoint}`, {
      method: 'PUT',
      body: JSON.stringify({ id, ...data }),
    });
    
    if (response && response.ok) {
      return await response.json();
    }
    
    const error = await response?.json();
    if (error?.details) {
      throw new Error(error.details.join(', '));
    }
    throw new Error(error?.error || `Failed to update ${endpoint}`);
  },

  // Delete item
  delete: async (id) => {
    const response = await apiCall(`/api/${endpoint}?id=${id}`, {
      method: 'DELETE',
    });
    
    if (response && response.ok) {
      return await response.json();
    }
    
    const error = await response?.json();
    throw new Error(error?.error || `Failed to delete ${endpoint}`);
  },
});

// Enhanced Income API with additional endpoints
export const incomeAPI = {
  // Get all incomes with advanced filtering
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined) {
        queryParams.set(key, params[key].toString());
      }
    });

    const url = `/api/income${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await apiCall(url);
    if (response && response.ok) {
      const data = await response.json();
      return data.success ? data : { success: false, error: data.error };
    }
    
    const error = await response?.json();
    throw new Error(error?.error || 'Failed to fetch incomes');
  },

  // Get income summary statistics
  getSummary: async () => {
    const response = await apiCall('/api/income/summary');
    if (response && response.ok) {
      const data = await response.json();
      return data.success ? data.summary : null;
    }
    
    const error = await response?.json();
    throw new Error(error?.error || 'Failed to fetch income summary');
  },

  // Get single income by ID
  getById: async (id) => {
    const response = await apiCall(`/api/income/${id}`);
    if (response && response.ok) {
      const data = await response.json();
      return data.success ? data.income : null;
    }
    
    const error = await response?.json();
    throw new Error(error?.error || 'Failed to fetch income');
  },

  // Create new income
  create: async (incomeData) => {
    const response = await apiCall('/api/income', {
      method: 'POST',
      body: JSON.stringify(incomeData),
    });
    
    if (response && response.ok) {
      const data = await response.json();
      return data;
    }
    
    const error = await response?.json();
    if (error?.details) {
      throw new Error(error.details.join(', '));
    }
    throw new Error(error?.error || 'Failed to create income');
  },

  // Update income
  update: async (id, incomeData) => {
    const response = await apiCall(`/api/income/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(incomeData),
    });
    
    if (response && response.ok) {
      const data = await response.json();
      return data;
    }
    
    const error = await response?.json();
    if (error?.details) {
      throw new Error(error.details.join(', '));
    }
    throw new Error(error?.error || 'Failed to update income');
  },

  // Delete income
  delete: async (id) => {
    const response = await apiCall(`/api/income/${id}`, {
      method: 'DELETE',
    });
    
    if (response && response.ok) {
      const data = await response.json();
      return data;
    }
    
    const error = await response?.json();
    throw new Error(error?.error || 'Failed to delete income');
  },
};

// Other API endpoints
export const debtAPI = createAPI('debts');
export const investmentAPI = createAPI('investments');
export const budgetAPI = createAPI('budgets');

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
      // Current simplified categories
      'Food & Dining': '🍽️',
      'Groceries': '🛒',
      'Transport': '🚗',
      'Bills & Utilities': '📄',
      'Health & Medical': '🏥',
      'Housing & Rent': '🏠',
      'Entertainment': '🎬',
      'Shopping': '🛍️',
      'Education': '📚',
      'Insurance': '🛡️',
      'Investments': '📈',
      'Loans & EMI': '🏦',
      'Travel': '✈️',
      'Gifts': '🎁',
      'Other': '📦',
      
      // Legacy mappings for backward compatibility
      'Food': '🍽️',
      'Bills': '📄',
      'Health': '🏥',
      'Travel & Vacation': '✈️',
      'Gifts & Donations': '🎁',
      'Sports & Fitness': '⚽',
      'Beauty & Personal Care': '💄',
      'Taxes': '📊',
      'Business Expenses': '💼',
      'Office Supplies': '📋',
      'Electronics': '📱',
      'Software & Subscriptions': '💻',
      'Internet & Phone': '📶',
      'Childcare': '👶',
      'Pet Care': '🐕',
      'Emergency': '🚨',
      'Cash Withdrawal': '💰',
      'Refund': '↩️',
      'Transfer': '🔄'
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
  },

  // Get available categories
  getCategories: () => {
    return [
      'Food & Dining',
      'Groceries',
      'Transport',
      'Bills & Utilities',
      'Health & Medical',
      'Housing & Rent',
      'Entertainment',
      'Shopping',
      'Education',
      'Insurance',
      'Investments',
      'Loans & EMI',
      'Travel',
      'Gifts',
      'Other'
    ];
  }
};

// Income helper functions
export const incomeHelpers = {
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
    return `${symbol}${amount.toLocaleString()}`;
  },

  // Format date for display
  formatDate: (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },

  // Get category icon
  getCategoryIcon: (category) => {
    const icons = {
      'salary': '💼',
      'allowance': '💳',
      'freelance': '💻',
      'bonus': '🎁',
      'gift': '🎀',
      'rental': '🏠',
      'other': '💵'
    };
    
    return icons[category?.toLowerCase()] || '💵';
  },

  // Get payment method icon
  getPaymentMethodIcon: (method) => {
    const icons = {
      'bank-transfer': '🏦',
      'cash': '💵',
      'upi': '📱',
      'paypal': '💳',
      'cheque': '📄',
      'other': '💰'
    };
    
    return icons[method?.toLowerCase()] || '💰';
  },

  // Get frequency badge info
  getFrequencyInfo: (frequency) => {
    const info = {
      'one-time': { label: 'One-time', color: 'gray' },
      'weekly': { label: 'Weekly', color: 'blue' },
      'monthly': { label: 'Monthly', color: 'purple' }
    };
    
    return info[frequency?.toLowerCase()] || info['one-time'];
  },

  // Calculate total from incomes array
  calculateTotal: (incomes) => {
    return incomes.reduce((sum, income) => sum + (income.amount || 0), 0);
  },

  // Group incomes by category
  groupByCategory: (incomes) => {
    return incomes.reduce((groups, income) => {
      const category = income.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(income);
      return groups;
    }, {});
  },

  // Group incomes by date
  groupByDate: (incomes) => {
    return incomes.reduce((groups, income) => {
      const date = new Date(income.date || income.createdAt).toISOString().split('T')[0];
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(income);
      return groups;
    }, {});
  },

  // Get available income categories
  getIncomeCategories: () => {
    return [
      { value: 'salary', label: 'Salary', icon: '💼' },
      { value: 'allowance', label: 'Allowance', icon: '💳' },
      { value: 'freelance', label: 'Freelance', icon: '💻' },
      { value: 'bonus', label: 'Bonus', icon: '🎁' },
      { value: 'gift', label: 'Gift', icon: '🎀' },
      { value: 'rental', label: 'Rental', icon: '🏠' },
      { value: 'other', label: 'Other', icon: '💵' }
    ];
  },

  // Get available frequencies
  getFrequencies: () => {
    return [
      { value: 'one-time', label: 'One-time' },
      { value: 'weekly', label: 'Weekly' },
      { value: 'monthly', label: 'Monthly' }
    ];
  },

  // Get available payment methods
  getPaymentMethods: () => {
    return [
      { value: 'bank-transfer', label: 'Bank Transfer', icon: '🏦' },
      { value: 'cash', label: 'Cash', icon: '💵' },
      { value: 'upi', label: 'UPI', icon: '📱' },
      { value: 'paypal', label: 'PayPal', icon: '💳' },
      { value: 'cheque', label: 'Cheque', icon: '📄' },
      { value: 'other', label: 'Other', icon: '💰' }
    ];
  }
};