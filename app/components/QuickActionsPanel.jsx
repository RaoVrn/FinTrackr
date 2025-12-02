"use client";

import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function QuickActionsPanel() {
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const quickActions = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'View your financial overview',
      icon: '📊',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200',
      hoverColor: 'hover:bg-blue-100',
      action: () => router.push('/dashboard')
    },
    {
      id: 'add-expense',
      title: 'Add Expense',
      description: 'Record a new expense',
      icon: '💸',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      borderColor: 'border-red-200',
      hoverColor: 'hover:bg-red-100',
      action: () => router.push('/expenses/new')
    },
    {
      id: 'add-income',
      title: 'Add Income',
      description: 'Record new income',
      icon: '💰',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      borderColor: 'border-green-200',
      hoverColor: 'hover:bg-green-100',
      action: () => router.push('/income/new')
    },
    {
      id: 'create-budget',
      title: 'Create Budget',
      description: 'Set up a new budget',
      icon: '🎯',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      borderColor: 'border-purple-200',
      hoverColor: 'hover:bg-purple-100',
      action: () => router.push('/budget/create')
    },
    {
      id: 'view-expenses',
      title: 'View Expenses',
      description: 'Browse your expenses',
      icon: '📋',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      borderColor: 'border-orange-200',
      hoverColor: 'hover:bg-orange-100',
      action: () => router.push('/expenses')
    },
    {
      id: 'investments',
      title: 'Investments',
      description: 'Manage investments',
      icon: '📈',
      bgColor: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      borderColor: 'border-indigo-200',
      hoverColor: 'hover:bg-indigo-100',
      action: () => router.push('/investments')
    },
    {
      id: 'budgets',
      title: 'View Budgets',
      description: 'Manage your budgets',
      icon: '💳',
      bgColor: 'bg-teal-50',
      iconColor: 'text-teal-600',
      borderColor: 'border-teal-200',
      hoverColor: 'hover:bg-teal-100',
      action: () => router.push('/budget')
    },
    {
      id: 'logout',
      title: 'Logout',
      description: 'Sign out of your account',
      icon: '🚪',
      bgColor: 'bg-gray-50',
      iconColor: 'text-gray-600',
      borderColor: 'border-gray-200',
      hoverColor: 'hover:bg-gray-100',
      action: handleLogout
    }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 space-y-1 sm:space-y-0">
        <h3 className="text-lg md:text-xl font-semibold text-gray-900">Quick Actions</h3>
        <span className="text-xs md:text-sm text-gray-500">Shortcuts to common tasks</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {quickActions.map((action) => (
          <button
            key={action.id}
            onClick={action.action}
            className={`
              ${action.bgColor} ${action.borderColor} ${action.hoverColor}
              border rounded-xl p-3 md:p-4 text-center transition-all duration-200 
              hover:shadow-md hover:scale-105 focus:outline-none 
              focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              group min-h-[90px] md:min-h-[110px]
            `}
          >
            <div className={`text-xl md:text-2xl mb-1 md:mb-2 ${action.iconColor} group-hover:scale-110 transition-transform duration-200`}>
              {action.icon}
            </div>
            <h4 className="font-semibold text-gray-900 text-xs md:text-sm mb-1 group-hover:text-gray-800 leading-tight">
              {action.title}
            </h4>
            <p className="text-xs text-gray-600 group-hover:text-gray-700 leading-tight">
              {action.description}
            </p>
          </button>
        ))}
      </div>

      {/* Additional Actions Row */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-base md:text-lg font-medium text-gray-900 mb-4">More Actions</h4>
        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={() => router.push('/profile/edit')}
            className="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 hover:from-blue-100 hover:to-purple-100 transition-all duration-200"
          >
            <div className="text-blue-600 flex-shrink-0">
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </div>
            <div className="text-left flex-grow">
              <p className="font-medium text-gray-900 text-sm md:text-base">Edit Profile</p>
              <p className="text-xs md:text-sm text-gray-600">Update your information</p>
            </div>
          </button>

          <button
            onClick={() => router.push('/analytics')}
            className="flex items-center space-x-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 hover:from-green-100 hover:to-emerald-100 transition-all duration-200"
          >
            <div className="text-green-600 flex-shrink-0">
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <div className="text-left flex-grow">
              <p className="font-medium text-gray-900 text-sm md:text-base">Analytics</p>
              <p className="text-xs md:text-sm text-gray-600">View detailed reports</p>
            </div>
          </button>
        </div>
      </div>

      {/* Help Section */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Need Help?</h4>
            <p className="text-xs text-gray-600">Access support and resources</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => window.open('mailto:support@fintrackr.com', '_blank')}
              className="px-3 py-1.5 text-xs md:text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-200 flex items-center space-x-1"
            >
              <span>📧</span>
              <span>Support</span>
            </button>
            <button
              onClick={() => window.open('/help', '_blank')}
              className="px-3 py-1.5 text-xs md:text-sm text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors duration-200 flex items-center space-x-1"
            >
              <span>❓</span>
              <span>Help</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}