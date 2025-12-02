"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout, isAuthenticated } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // All navigation items with theme colors
  const navItems = [
    { href: '/dashboard', label: 'Dashboard', color: 'blue' },
    { href: '/expenses', label: 'Expenses', color: 'red' },
    { href: '/budget', label: 'Budget', color: 'blue' },
    { href: '/income', label: 'Income', color: 'green' },
    { href: '/investments', label: 'Investments', color: 'purple' },
    { href: '/debts', label: 'Debts', color: 'orange' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Far Left */}
          <div className="flex-shrink-0">
            <Link 
              href={isAuthenticated ? "/dashboard" : "/"} 
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity duration-200"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">F</span>
              </div>
              <span className="text-xl font-bold text-gray-900">FinTrackr</span>
            </Link>
          </div>

          {/* Center Navigation */}
          {isAuthenticated && (
            <div className="hidden lg:flex items-center justify-center flex-1">
              <div className="flex items-center space-x-6">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/');
                  
                  const colorClasses = {
                    blue: { 
                      active: 'text-blue-600 border-blue-600',
                      hover: 'hover:text-blue-600'
                    },
                    red: { 
                      active: 'text-red-600 border-red-600',
                      hover: 'hover:text-red-600'
                    },
                    purple: { 
                      active: 'text-purple-600 border-purple-600',
                      hover: 'hover:text-purple-600'
                    },
                    green: { 
                      active: 'text-green-600 border-green-600',
                      hover: 'hover:text-green-600'
                    },
                    emerald: { 
                      active: 'text-emerald-600 border-emerald-600',
                      hover: 'hover:text-emerald-600'
                    },
                    orange: { 
                      active: 'text-orange-600 border-orange-600',
                      hover: 'hover:text-orange-600'
                    }
                  };

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`text-sm font-medium transition-colors duration-200 ${
                        isActive
                          ? `${colorClasses[item.color].active} border-b-2 pb-1`
                          : `text-gray-600 ${colorClasses[item.color].hover}`
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Right Side */}
          <div className="flex-shrink-0">
            {isAuthenticated ? (
              /* User Profile - Far Right */
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 hover:opacity-80 transition-opacity duration-200"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {user?.name?.charAt(0)?.toUpperCase() || 'D'}
                  </div>
                  <span className="text-sm font-medium text-gray-700 hidden xl:block">{user?.name || 'Demo'}</span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user?.name || 'Demo User'}</p>
                      <p className="text-xs text-gray-500">Account</p>
                    </div>
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Profile Settings
                    </Link>
                    <button
                      onClick={() => { logout(); setShowUserMenu(false); }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Public Navigation - Far Right */
              <div className="hidden md:flex items-center space-x-4">
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-4 space-y-1">
            {isAuthenticated ? (
              <>
                {/* All nav items */}
                {navItems.map((item) => {
                  const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/');
                  
                  const mobileColorClasses = {
                    blue: 'bg-blue-50 text-blue-600',
                    red: 'bg-red-50 text-red-600',
                    purple: 'bg-purple-50 text-purple-600',
                    green: 'bg-green-50 text-green-600',
                    emerald: 'bg-emerald-50 text-emerald-600',
                    orange: 'bg-orange-50 text-orange-600'
                  };

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`block px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                        isActive
                          ? mobileColorClasses[item.color]
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  );
                })}
                
                {/* Mobile user actions */}
                <div className="pt-4 border-t border-gray-200 mt-4 space-y-1">
                  <Link
                    href="/profile"
                    className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="w-6 h-6 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white text-xs">
                      {user?.name?.charAt(0)?.toUpperCase() || 'D'}
                    </div>
                    <span>Profile</span>
                  </Link>
                  
                  <button
                    onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                    className="flex items-center space-x-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            ) : (
              /* Public mobile menu */
              <div className="space-y-1">
                <Link
                  href="/login"
                  className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg text-center"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="block px-4 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg text-center"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}