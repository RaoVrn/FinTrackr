// Utility functions for API calls with authentication

export const apiCall = async (url, options = {}) => {
  const token = localStorage.getItem('fintrackr_token');
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

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

  const response = await fetch(url, config);
  
  if (response.status === 401) {
    // Token expired or invalid - redirect to login
    localStorage.removeItem('fintrackr_user');
    localStorage.removeItem('fintrackr_token');
    window.location.href = '/login';
    return null;
  }
  
  return response;
};

export const expenseAPI = {
  // Get all expenses for authenticated user
  getAll: async () => {
    const response = await apiCall('/api/expenses');
    if (response && response.ok) {
      return await response.json();
    }
    throw new Error('Failed to fetch expenses');
  },

  // Get single expense
  getById: async (id) => {
    const response = await apiCall(`/api/${id}`);
    if (response && response.ok) {
      return await response.json();
    }
    throw new Error('Failed to fetch expense');
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
    const error = await response.json();
    throw new Error(error.error || 'Failed to create expense');
  },

  // Update expense
  update: async (id, expenseData) => {
    const response = await apiCall(`/api/${id}`, {
      method: 'PUT',
      body: JSON.stringify(expenseData),
    });
    if (response && response.ok) {
      return await response.json();
    }
    const error = await response.json();
    throw new Error(error.error || 'Failed to update expense');
  },

  // Delete expense
  delete: async (id) => {
    const response = await apiCall(`/api/${id}`, {
      method: 'DELETE',
    });
    if (response && response.ok) {
      return await response.json();
    }
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete expense');
  },
};