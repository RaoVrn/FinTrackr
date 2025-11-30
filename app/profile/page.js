"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user, isAuthenticated, updateProfile, logout } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
      });
    }
  }, [user, isAuthenticated, router]);

  const handleSave = async () => {
    const result = await updateProfile(formData);
    if (result.success) {
      setIsEditing(false);
    } else {
      // Handle error - you could add error state here
      alert(result.error || 'Failed to update profile');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleContinue = () => {
    router.push('/dashboard');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Welcome Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to FinTrackr! 👋
          </h1>
          <p className="text-lg text-gray-600">
            Complete your profile to get started with managing your finances
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6">
            <div className="flex items-center space-x-4">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-20 h-20 rounded-full border-4 border-white shadow-lg"
              />
              <div className="text-white">
                <h2 className="text-2xl font-bold">{user.name}</h2>
                <p className="text-blue-100">{user.email}</p>
                <p className="text-sm text-blue-200 mt-1">
                  Member since {new Date(user.joinedDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-8">
            <div className="space-y-6">
              {/* Profile Information */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">Profile Information</h3>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {isEditing ? 'Cancel' : 'Edit'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{user.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{user.email}</p>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="mt-4 flex space-x-3">
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="border-t pt-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <div className="text-2xl text-blue-600 mb-2">📊</div>
                    <p className="text-sm text-gray-600">Ready to track</p>
                    <p className="font-semibold text-gray-900">Your Expenses</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <div className="text-2xl text-green-600 mb-2">💰</div>
                    <p className="text-sm text-gray-600">Set up your</p>
                    <p className="font-semibold text-gray-900">Budget Goals</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <div className="text-2xl text-purple-600 mb-2">📱</div>
                    <p className="text-sm text-gray-600">Access from</p>
                    <p className="font-semibold text-gray-900">Anywhere</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handleContinue}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Continue to Dashboard →
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}