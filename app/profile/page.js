"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastProvider';
import ProfileOverviewCard from '../components/ProfileOverviewCard';
import ProfileCompletionTracker from '../components/ProfileCompletionTracker';
import QuickActionsPanel from '../components/QuickActionsPanel';
import ChangePasswordModal from '../components/ChangePasswordModal';

export default function ProfilePage() {
  const { user, isAuthenticated, getAuthHeaders } = useAuth();
  const router = useRouter();
  const toast = useToast();
  
  const [profileData, setProfileData] = useState(null);
  const [overview, setOverview] = useState(null);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Fetch profile data on load
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    fetchProfileData();
  }, [isAuthenticated, router]);

  const fetchProfileData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/profile', {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setProfileData(data.user);
        setOverview(data.overview);
        setCompletionPercentage(data.completionPercentage);
      } else {
        toast.error('Failed to load profile data');
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
      toast.error('Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChangeSuccess = (message) => {
    toast.success(message);
    setShowPasswordModal(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  {profileData?.profileImage || profileData?.avatar ? (
                    <img
                      src={profileData.profileImage || profileData.avatar}
                      alt={profileData?.name || 'Profile'}
                      className="w-16 h-16 rounded-full border-3 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full border-3 border-white shadow-lg bg-blue-500 flex items-center justify-center text-white text-xl font-bold">
                      {profileData?.initials || user?.initials || 'U'}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 border-2 border-white rounded-full"></div>
                </div>
                
                <div className="text-white">
                  <h1 className="text-xl font-bold mb-1">
                    {profileData?.name || user?.name || 'User'}
                  </h1>
                  <p className="text-blue-100 text-sm">{profileData?.email || user?.email}</p>
                  {profileData?.occupation && (
                    <p className="text-xs text-blue-200 mt-1">{profileData.occupation}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="text-right text-white">
                  <p className="text-xs text-blue-200">Profile Complete</p>
                  <p className="text-lg font-bold">{Math.round(completionPercentage)}%</p>
                </div>
                <button
                  onClick={() => router.push('/profile/edit')}
                  className="px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors text-sm"
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Profile Completion */}
            <ProfileCompletionTracker 
              user={profileData} 
              completionPercentage={completionPercentage}
              isLoading={isLoading}
            />
            
            {/* Account Settings */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Settings</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Status</span>
                  <span className="text-sm font-medium text-green-600 flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Active
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Currency</span>
                  <span className="text-sm font-medium text-gray-900">
                    {profileData?.currency || 'INR'} ({profileData?.currency === 'INR' ? '₹' : '$'})
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-600">Member Since</span>
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(user?.joinedDate || Date.now()).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-center"
                >
                  <div className="text-2xl mb-1">📊</div>
                  <p className="text-sm font-medium text-gray-900">Dashboard</p>
                </button>
                <button
                  onClick={() => router.push('/expenses/new')}
                  className="p-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-center"
                >
                  <div className="text-2xl mb-1">💸</div>
                  <p className="text-sm font-medium text-gray-900">Add Expense</p>
                </button>
                <button
                  onClick={() => router.push('/budget/create')}
                  className="p-3 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors text-center"
                >
                  <div className="text-2xl mb-1">🎯</div>
                  <p className="text-sm font-medium text-gray-900">Create Budget</p>
                </button>
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-center"
                >
                  <div className="text-2xl mb-1">🔒</div>
                  <p className="text-sm font-medium text-gray-900">Security</p>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Financial Overview */}
            <ProfileOverviewCard 
              overview={overview}
              isLoading={isLoading}
            />

            {/* Navigation Links */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Navigate</h3>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/expenses')}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">📋</span>
                    <span className="text-sm font-medium text-gray-900">View Expenses</span>
                  </div>
                  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  onClick={() => router.push('/budget')}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">💳</span>
                    <span className="text-sm font-medium text-gray-900">Manage Budgets</span>
                  </div>
                  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  onClick={() => router.push('/investments')}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">📈</span>
                    <span className="text-sm font-medium text-gray-900">Investments</span>
                  </div>
                  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Completion Prompt - Only show if incomplete */}
        {completionPercentage < 100 && (
          <div className="mt-6 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-yellow-600 text-xl">⚡</span>
                <div>
                  <h3 className="font-semibold text-yellow-800 text-sm">Complete Your Profile</h3>
                  <p className="text-xs text-yellow-700">
                    Unlock personalized insights and recommendations
                  </p>
                </div>
              </div>
              <button
                onClick={() => router.push('/profile/edit')}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition-colors text-sm"
              >
                Complete
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={handlePasswordChangeSuccess}
      />
    </div>
  );
}