"use client";

import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in (from localStorage)
    const savedUser = localStorage.getItem('fintrackr_user');
    const savedToken = localStorage.getItem('fintrackr_token');
    
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
    }
    setIsLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (data.success) {
        const userData = {
          ...data.user,
          id: data.user._id,
          joinedDate: data.user.createdAt,
        };
        
        localStorage.setItem('fintrackr_user', JSON.stringify(userData));
        localStorage.setItem('fintrackr_token', data.token);
        setUser(userData);
        setToken(data.token);
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const signup = async (name, email, password) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();
      
      if (data.success) {
        const userData = {
          ...data.user,
          id: data.user._id,
          joinedDate: data.user.createdAt,
        };
        
        localStorage.setItem('fintrackr_user', JSON.stringify(userData));
        localStorage.setItem('fintrackr_token', data.token);
        setUser(userData);
        setToken(data.token);
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('fintrackr_user');
    localStorage.removeItem('fintrackr_token');
    setUser(null);
    setToken(null);
  };

  const updateProfile = async (updatedData) => {
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updatedData),
      });

      const data = await response.json();
      
      if (response.ok) {
        const userData = {
          ...data.user,
          id: data.user._id,
          joinedDate: user.joinedDate,
        };
        
        localStorage.setItem('fintrackr_user', JSON.stringify(userData));
        setUser(userData);
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  // Helper function to get auth headers for API calls
  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  });

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoading,
      login,
      signup,
      logout,
      updateProfile,
      getAuthHeaders,
      isAuthenticated: !!user && !!token
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};