"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout, isAuthenticated } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const publicNavItems = [
    { href: '/', label: 'Home', icon: '🏠' },
  ];

  const privateNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊', color: 'blue' },
    { href: '/income', label: 'Income', icon: '💰', color: 'green' },
    { href: '/expenses', label: 'Expenses', icon: '💸', color: 'red' },
    { href: '/debts', label: 'Debts', icon: '💳', color: 'orange' },
    { href: '/investments', label: 'Investments', icon: '📈', color: 'purple' },
    { href: '/budget', label: 'Budget', icon: '🎯', color: 'indigo' },
    { href: '/reports', label: 'Reports', icon: '📄', color: 'teal' },
  ];

  const navItems = isAuthenticated ? privateNavItems : publicNavItems;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center space-x-3 hover:scale-105 transition-transform duration-200 group"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <span className="text-white text-lg font-bold">F</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">FinTrackr</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-2">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href) || (item.href === '/dashboard' && pathname === '/dashboard');
              const colorClasses = {
                blue: { active: 'bg-blue-600 shadow-blue-600/25', hover: 'hover:text-blue-600 hover:bg-blue-50' },
                green: { active: 'bg-green-600 shadow-green-600/25', hover: 'hover:text-green-600 hover:bg-green-50' },
                red: { active: 'bg-red-600 shadow-red-600/25', hover: 'hover:text-red-600 hover:bg-red-50' },
                orange: { active: 'bg-orange-600 shadow-orange-600/25', hover: 'hover:text-orange-600 hover:bg-orange-50' },
                purple: { active: 'bg-purple-600 shadow-purple-600/25', hover: 'hover:text-purple-600 hover:bg-purple-50' },
                indigo: { active: 'bg-indigo-600 shadow-indigo-600/25', hover: 'hover:text-indigo-600 hover:bg-indigo-50' },
                teal: { active: 'bg-teal-600 shadow-teal-600/25', hover: 'hover:text-teal-600 hover:bg-teal-50' }
              };
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                    isActive
                      ? `${colorClasses[item.color]?.active || colorClasses.blue.active} text-white shadow-md`
                      : `text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 ${colorClasses[item.color]?.hover || ''}`
                  }`}
                >
                  <span className={`text-base transition-transform group-hover:scale-110 ${isActive ? 'filter brightness-0 invert' : ''}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
            
            {/* Auth Buttons */}
            {!isAuthenticated ? (
              <div className="flex items-center space-x-3 ml-6">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg hover:shadow-blue-600/25"
                >
                  Get Started
                </Link>
              </div>
            ) : (
              <div className="flex items-center space-x-4 ml-6">
                <Link
                  href="/expenses/new"
                  className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-sm font-medium rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 shadow-md hover:shadow-lg hover:shadow-emerald-600/25"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add</span>
                </Link>
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-3 px-3 py-2 rounded-xl hover:bg-gray-100/80 transition-all duration-200 group"
                  >
                    <img
                      src={user?.avatar}
                      alt={user?.name}
                      className="w-9 h-9 rounded-full border-2 border-gray-200 group-hover:border-gray-300 transition-colors"
                    />
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-500">Account</p>
                    </div>
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {showUserMenu && (
                    <div className="absolute right-0 mt-3 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 py-2 z-50">
                      <div className="px-4 py-4 border-b border-gray-100">
                        <div className="flex items-center space-x-3">
                          <img
                            src={user?.avatar}
                            alt={user?.name}
                            className="w-12 h-12 rounded-full"
                          />
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                            <p className="text-xs text-gray-500">{user?.email}</p>
                          </div>
                        </div>
                      </div>
                      <div className="py-2">
                        <Link
                          href="/profile"
                          className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-100/80 transition-colors group"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-200 transition-colors">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium">Profile</p>
                            <p className="text-xs text-gray-500">Manage your account</p>
                          </div>
                        </Link>
                        <button
                          onClick={() => { logout(); setShowUserMenu(false); }}
                          className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-100/80 transition-colors group"
                        >
                          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-red-200 transition-colors">
                            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium">Sign out</p>
                            <p className="text-xs text-gray-500">Logout from your account</p>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors duration-200">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className="md:hidden border-t border-gray-200/50 bg-white/95 backdrop-blur-xl">
        <div className="px-4 py-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href) || (item.href === '/dashboard' && pathname === '/dashboard');
            const colorClasses = {
              blue: 'bg-blue-600',
              green: 'bg-green-600',
              red: 'bg-red-600',
              orange: 'bg-orange-600',
              purple: 'bg-purple-600',
              indigo: 'bg-indigo-600',
              teal: 'bg-teal-600'
            };
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? `${colorClasses[item.color] || colorClasses.blue} text-white shadow-lg`
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100/80'
                }`}
              >
                <span className={`text-base ${isActive ? 'filter brightness-0 invert' : ''}`}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
          
          {/* Mobile Auth Buttons */}
          {!isAuthenticated ? (
            <div className="pt-4 space-y-3 border-t border-gray-200/50 mt-4">
              <Link
                href="/login"
                className="block px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100/80 transition-all duration-200 text-center"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="block px-4 py-3 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 text-center shadow-lg"
              >
                Get Started
              </Link>
            </div>
          ) : (
            <div className="pt-4 border-t border-gray-200/50 mt-4 space-y-3">
              <Link
                href="/expenses/new"
                className="flex items-center justify-center space-x-2 px-4 py-3 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 shadow-lg"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Expense</span>
              </Link>
              <Link
                href="/profile"
                className="flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100/80 transition-all duration-200"
              >
                <img
                  src={user?.avatar}
                  alt={user?.name}
                  className="w-8 h-8 rounded-full border-2 border-gray-200"
                />
                <div>
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-xs text-gray-500">View Profile</p>
                </div>
              </Link>
              <button
                onClick={logout}
                className="flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}