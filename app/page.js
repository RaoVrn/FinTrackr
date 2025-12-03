"use client";

import Link from 'next/link';
import { useAuth } from './context/AuthContext';

export default function Home() {
  const { isAuthenticated } = useAuth();
  
  const features = [
    {
      icon: '💸',
      title: 'Expense Tracking',
      description: 'Track every rupee with smart categorization, receipt scanning, and real-time expense monitoring.',
      action: '/expenses/new'
    },
    {
      icon: '📊',
      title: 'Budget Management',
      description: 'Create intelligent budgets, set spending limits, and get alerts before you overspend.',
      action: '/budget/new'
    },
    {
      icon: '💰',
      title: 'Income Tracking',
      description: 'Monitor multiple income sources, track salary, freelance work, and investment returns.',
      action: '/income/new'
    },
    {
      icon: '📈',
      title: 'Investment Portfolio',
      description: 'Track your SIPs, mutual funds, stocks, and calculate returns with detailed analytics.',
      action: '/investments/new'
    },
    {
      icon: '💳',
      title: 'Debt Management',
      description: 'Manage credit cards, loans, and EMIs with payment schedules and interest calculations.',
      action: '/debts/new'
    },
    {
      icon: '📱',
      title: 'Real-time Insights',
      description: 'Get instant analytics, spending patterns, and financial health reports on any device.',
      action: '/dashboard'
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="hero-gradient py-20 md:py-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366f1' fill-opacity='0.04'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>
        
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="animate-fade-in">
            {/* Trust Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full text-sm font-medium text-gray-700 mb-8 shadow-lg border border-white/20">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              Secure & Privacy-First Financial Tracker
            </div>
            
            {/* Main Headline */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Take Control of Your{' '}
              <span className="text-gradient bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 bg-clip-text text-transparent">
                Money
              </span>
            </h1>
            
            {/* Subheadline */}
            <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-4xl mx-auto leading-relaxed">
              Complete financial management platform for tracking expenses, managing budgets, 
              monitoring investments, and achieving your financial goals.{' '}
              <span className="font-semibold text-gray-800">Available worldwide for everyone.</span>
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link 
                href={isAuthenticated ? "/dashboard" : "/signup"}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-lg px-8 py-4 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
              >
                {isAuthenticated ? "Go to Dashboard" : "Start Free Trial"}
              </Link>
              <Link 
                href={isAuthenticated ? "/expenses/new" : "/login"}
                className="bg-white/90 backdrop-blur-sm text-gray-700 font-semibold text-lg px-8 py-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-white hover:shadow-lg transition-all duration-300"
              >
                {isAuthenticated ? "Add Expense" : "Sign In"}
              </Link>
            </div>
            
            {/* Feature Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="flex items-center justify-center space-x-2 text-gray-600">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Multi-currency Support</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-gray-600">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Bank-level Security</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-gray-600">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">100% Free Forever</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Preview Section */}
      <section className="py-4 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-4">
            <div className="inline-block px-2 py-1 bg-green-50 text-green-600 rounded-full text-xs font-semibold mb-1">
              Live Product Preview
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
              See FinTrackr in action
            </h2>
            <p className="text-sm text-gray-600 max-w-xl mx-auto">
              Get a glimpse of the intuitive interface and powerful features.
            </p>
          </div>

          {/* Two PC Screens Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left PC - Main Dashboard */}
            <div className="transform hover:scale-[1.01] transition-transform duration-300">
              <div className="bg-gray-800 rounded-t-lg px-3 py-2">
                <div className="flex items-center space-x-1.5">
                  <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>
                  <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full"></div>
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                  <div className="flex-1 mx-3">
                    <div className="bg-gray-700 rounded px-2 py-1 text-center">
                      <span className="text-gray-300 text-xs">🔒 fintrackr.com/dashboard</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-b-lg shadow-xl overflow-hidden" style={{ height: '320px' }}>
                <div className="p-3 bg-gradient-to-br from-gray-50 to-white h-full">
                  {/* Dashboard Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h1 className="text-base font-bold text-blue-600">Financial Dashboard</h1>
                      <p className="text-xs text-gray-600">December 2024 • Welcome back!</p>
                    </div>
                    <div className="flex space-x-1">
                      <button className="bg-red-500 text-white px-2 py-1 rounded text-xs font-medium hover:bg-red-600 transition-colors">+ Expense</button>
                      <button className="bg-green-500 text-white px-2 py-1 rounded text-xs font-medium hover:bg-green-600 transition-colors">+ Income</button>
                    </div>
                  </div>
                  
                  {/* Financial Snapshot Cards */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-gradient-to-br from-green-400 to-green-600 p-3 rounded-lg text-white shadow-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white text-xs font-medium opacity-90">Net Worth</span>
                        <span className="text-sm">📈</span>
                      </div>
                      <div className="text-lg font-bold text-white">₹32,650</div>
                      <div className="text-xs text-white opacity-90">Growing wealth</div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-lg text-white shadow-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white text-xs font-medium opacity-90">Monthly Cash Flow</span>
                        <span className="text-sm">📊</span>
                      </div>
                      <div className="text-lg font-bold text-white">₹19,650</div>
                      <div className="text-xs text-white opacity-90">₹20,000 in • ₹350 out</div>
                    </div>
                  </div>
                  
                  {/* Portfolio Overview */}
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <h3 className="font-bold text-gray-900 mb-2 text-xs">Portfolio Overview</h3>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <h4 className="text-xs font-medium text-gray-600 mb-1">Assets vs Liabilities</h4>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center space-x-1">
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                              <span className="text-xs">Assets</span>
                            </div>
                            <span className="font-bold text-green-600">₹33,000</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '95%' }}></div>
                          </div>
                          
                          <div className="flex items-center justify-between text-xs mt-1">
                            <div className="flex items-center space-x-1">
                              <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                              <span className="text-xs">Liabilities</span>
                            </div>
                            <span className="font-bold text-red-600">₹350</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div className="bg-red-500 h-1.5 rounded-full" style={{ width: '5%' }}></div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-center justify-center">
                        <h4 className="text-xs font-medium text-gray-600 mb-1">Financial Health</h4>
                        <div className="relative w-12 h-12">
                          <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                            <path className="text-gray-200" strokeDasharray="100, 100" strokeWidth="3" fill="none" stroke="currentColor" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                            <path className="text-green-500" strokeDasharray="98, 100" strokeWidth="3" strokeLinecap="round" fill="none" stroke="currentColor" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-sm font-bold text-green-600">98%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right PC - Analytics & Mobile */}
            <div className="transform hover:scale-[1.01] transition-transform duration-300">
              <div className="bg-gray-800 rounded-t-lg px-3 py-2">
                <div className="flex items-center space-x-1.5">
                  <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>
                  <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full"></div>
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                  <div className="flex-1 mx-3">
                    <div className="bg-gray-700 rounded px-2 py-1 text-center">
                      <span className="text-gray-300 text-xs">🔒 fintrackr.com/analytics</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-b-lg shadow-xl overflow-hidden" style={{ height: '320px' }}>
                <div className="p-3 bg-gradient-to-br from-gray-50 to-white h-full">
                  <div className="grid grid-cols-2 gap-4 h-full">
                    {/* Expense Management */}
                    <div className="space-y-2">
                      <h2 className="text-base font-bold text-red-600">Expense Management</h2>
                      
                      <div className="grid grid-cols-2 gap-1.5">
                        <div className="bg-white p-2 rounded border border-gray-200 text-center">
                          <div className="text-red-500 text-xs font-medium mb-0.5">$</div>
                          <div className="text-xs text-gray-600">Total Expenses</div>
                          <div className="text-sm font-bold text-gray-900">₹250</div>
                        </div>
                        
                        <div className="bg-white p-2 rounded border border-gray-200 text-center">
                          <div className="text-orange-500 text-xs font-medium mb-0.5">📅</div>
                          <div className="text-xs text-gray-600">This Month</div>
                          <div className="text-sm font-bold text-gray-900">₹250</div>
                        </div>
                        
                        <div className="bg-white p-2 rounded border border-gray-200 text-center">
                          <div className="text-purple-500 text-xs font-medium mb-0.5">🏷️</div>
                          <div className="text-xs text-gray-600">Categories</div>
                          <div className="text-sm font-bold text-purple-600">2</div>
                        </div>
                        
                        <div className="bg-white p-2 rounded border border-gray-200 text-center">
                          <div className="text-pink-500 text-xs font-medium mb-0.5">📋</div>
                          <div className="text-xs text-gray-600">Entries</div>
                          <div className="text-sm font-bold text-pink-600">2</div>
                        </div>
                      </div>
                      
                      <div className="bg-white p-2 rounded border border-gray-200">
                        <h4 className="text-xs font-bold text-gray-900 mb-1.5">Your Expense Sources</h4>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between p-1.5 bg-gray-50 rounded border-l-2 border-blue-500">
                            <div className="flex items-center space-x-1.5">
                              <div className="w-4 h-4 bg-blue-100 rounded flex items-center justify-center text-xs">🚗</div>
                              <div>
                                <div className="text-xs font-medium">Transport</div>
                                <div className="text-xs text-gray-500">Dec 1</div>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-gray-900">₹100</span>
                          </div>
                          
                          <div className="flex items-center justify-between p-1.5 bg-gray-50 rounded border-l-2 border-orange-500">
                            <div className="flex items-center space-x-1.5">
                              <div className="w-4 h-4 bg-orange-100 rounded flex items-center justify-center text-xs">🍽️</div>
                              <div>
                                <div className="text-xs font-medium">Food & Dining</div>
                                <div className="text-xs text-gray-500">Dec 3</div>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-gray-900">₹150</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Investment Management */}
                    <div className="space-y-2">
                      <h2 className="text-base font-bold text-purple-600">Investment Management</h2>
                      
                      <div className="grid grid-cols-2 gap-1.5">
                        <div className="bg-white p-2 rounded border border-gray-200 text-center">
                          <div className="text-purple-500 text-xs font-medium mb-0.5">📈</div>
                          <div className="text-xs text-gray-600">Total Invested</div>
                          <div className="text-sm font-bold text-purple-600">₹10,000</div>
                        </div>
                        
                        <div className="bg-white p-2 rounded border border-gray-200 text-center">
                          <div className="text-green-500 text-xs font-medium mb-0.5">$</div>
                          <div className="text-xs text-gray-600">Current Value</div>
                          <div className="text-sm font-bold text-green-600">₹13,000</div>
                        </div>
                        
                        <div className="bg-white p-2 rounded border border-gray-200 text-center">
                          <div className="text-green-500 text-xs font-medium mb-0.5">↗️</div>
                          <div className="text-xs text-gray-600">Total P&L</div>
                          <div className="text-sm font-bold text-green-600">+₹3,000</div>
                        </div>
                        
                        <div className="bg-white p-2 rounded border border-gray-200 text-center">
                          <div className="text-purple-500 text-xs font-medium mb-0.5">📊</div>
                          <div className="text-xs text-gray-600">Portfolio</div>
                          <div className="text-sm font-bold text-purple-600">1</div>
                        </div>
                      </div>
                      
                      <div className="bg-white p-2 rounded border border-gray-200">
                        <h4 className="text-xs font-bold text-gray-900 mb-1.5">Your Investments</h4>
                        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-2 rounded border border-yellow-200">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center space-x-1.5">
                              <div className="w-4 h-4 bg-yellow-100 rounded flex items-center justify-center text-xs">🥇</div>
                              <div>
                                <div className="text-xs font-bold text-gray-900">gold</div>
                                <div className="text-xs text-gray-600">ETF • low risk</div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-1.5 text-xs">
                            <div>
                              <div className="text-gray-600">Invested</div>
                              <div className="font-bold">₹10,000</div>
                            </div>
                            <div>
                              <div className="text-gray-600">Current</div>
                              <div className="font-bold">₹13,000</div>
                            </div>
                            <div>
                              <div className="text-gray-600">P&L</div>
                              <div className="font-bold text-green-600">+₹3,000</div>
                            </div>
                            <div>
                              <div className="text-gray-600">CAGR</div>
                              <div className="font-bold text-green-600">+43%</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50/50">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-semibold mb-4">
              Complete Financial Suite
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Everything you need in one place
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              From daily expense tracking to investment portfolio management, 
              FinTrackr provides all the tools you need for complete financial control.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 group border border-gray-100 hover:border-blue-200"
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <span className="text-xl">{feature.icon}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed mb-4">
                      {feature.description}
                    </p>
                    {isAuthenticated ? (
                      <Link 
                        href={feature.action}
                        className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm group-hover:underline"
                      >
                        Get Started
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    ) : (
                      <div className="text-blue-600 font-medium text-sm">
                        Available after signup
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Quick Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">₹0</div>
              <div className="text-sm text-gray-600">Setup Cost</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">∞</div>
              <div className="text-sm text-gray-600">Transactions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">24/7</div>
              <div className="text-sm text-gray-600">Access</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">100%</div>
              <div className="text-sm text-gray-600">Secure</div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile & Features Showcase */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - iPhone Mockup */}
            <div className="relative flex justify-center">
              {/* iPhone Frame */}
              <div className="relative w-72 h-[600px] bg-black rounded-[3rem] p-2 shadow-2xl">
                {/* iPhone Notch */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-36 h-6 bg-black rounded-b-2xl z-10"></div>
                
                {/* iPhone Screen */}
                <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden relative">
                  {/* Status Bar */}
                  <div className="flex justify-between items-center px-6 pt-12 pb-2 text-black">
                    <div className="text-sm font-semibold">9:41</div>
                    <div className="flex items-center space-x-1">
                      <div className="flex space-x-1">
                        <div className="w-1 h-1 bg-black rounded-full"></div>
                        <div className="w-1 h-1 bg-black rounded-full"></div>
                        <div className="w-1 h-1 bg-black rounded-full"></div>
                        <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                      </div>
                      <div className="w-6 h-3 border border-black rounded-sm">
                        <div className="w-4 h-2 bg-green-500 rounded-sm m-0.5"></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* App Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-6 text-white mx-4 rounded-2xl mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-lg">FinTrackr</h3>
                      <div className="text-lg font-semibold">₹1,25,430</div>
                    </div>
                    <div className="text-sm opacity-90">Good morning! 👋</div>
                    
                    {/* Live Updates Badge */}
                    <div className="inline-block mt-2 px-3 py-1 bg-white/20 rounded-full">
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                          <span className="text-xs font-medium">Live Updates</span>
                        </div>
                      </div>
                      <div className="text-green-300 text-xs font-semibold">+₹500 saved!</div>
                    </div>
                  </div>
                  
                  {/* Phone Content */}
                  <div className="px-4 space-y-4">
                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 gap-3">
                      <button className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-medium hover:bg-red-100 transition-colors border border-red-100 shadow-sm">
                        <div className="text-lg mb-1">💸</div>
                        Add Expense
                      </button>
                      <button className="bg-green-50 text-green-600 p-4 rounded-2xl text-sm font-medium hover:bg-green-100 transition-colors border border-green-100 shadow-sm">
                        <div className="text-lg mb-1">💰</div>
                        Add Income
                      </button>
                    </div>
                    
                    {/* Recent Activity */}
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                      <div className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                        <span className="mr-2">⚡</span>
                        Recent Activity
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">🍔</div>
                            <div>
                              <div className="text-sm font-medium">Lunch</div>
                              <div className="text-xs text-gray-500">2h ago</div>
                            </div>
                          </div>
                          <span className="text-red-600 font-semibold">-₹250</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">⛽</div>
                            <div>
                              <div className="text-sm font-medium">Petrol</div>
                              <div className="text-xs text-gray-500">5h ago</div>
                            </div>
                          </div>
                          <span className="text-red-600 font-semibold">-₹2,000</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">💼</div>
                            <div>
                              <div className="text-sm font-medium">Salary</div>
                              <div className="text-xs text-gray-500">Yesterday</div>
                            </div>
                          </div>
                          <span className="text-green-600 font-semibold">+₹85,000</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Budget Status */}
                    <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                      <div className="text-sm font-semibold text-blue-900 mb-3 flex items-center">
                        <span className="mr-2">📊</span>
                        Monthly Budget
                      </div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="font-medium">₹18,750 / ₹30,000</span>
                        <span className="text-blue-600 font-semibold">62%</span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-3">
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full shadow-sm" style={{ width: '62%' }}></div>
                      </div>
                    </div>
                    
                    {/* Smart Alert */}
                    <div className="bg-orange-50 rounded-2xl p-3 border border-orange-100 border-l-4 border-l-orange-400">
                      <div className="text-xs font-semibold text-orange-800 mb-1">Smart Alert</div>
                      <div className="text-xs text-orange-700">Budget limit near</div>
                    </div>
                  </div>
                </div>
                
                {/* iPhone Home Indicator */}
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-white rounded-full"></div>
              </div>
            </div>
            
            {/* Right Side - Feature Highlights */}
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                  Designed for everyday use
                </h2>
                <p className="text-lg text-gray-600 mb-8">
                  Simple, fast, and intuitive. FinTrackr works the way you think about money.
                </p>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <span className="text-white text-xl">⚡</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Lightning Fast Entry</h3>
                    <p className="text-gray-600">Add expenses in under 5 seconds with smart auto-categorization and voice input support.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                    <span className="text-white text-xl">🧠</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Insights</h3>
                    <p className="text-gray-600">AI-powered analytics show spending patterns, predict future expenses, and suggest optimizations.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                    <span className="text-white text-xl">🔐</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Bank-Level Security</h3>
                    <p className="text-gray-600">Your financial data is encrypted and secured with the same technology banks use.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
                    <span className="text-white text-xl">📊</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Beautiful Reports</h3>
                    <p className="text-gray-600">Generate stunning visual reports and share insights with family or financial advisors.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Start in 3 simple steps
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Get your finances organized in minutes, not hours
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Create Account</h3>
              <p className="text-gray-600">
                Sign up with your email in under 30 seconds. No phone verification or complex setup required.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Add Your Data</h3>
              <p className="text-gray-600">
                Start by adding your first expense, income, or budget. Our intuitive interface makes it effortless.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Get Insights</h3>
              <p className="text-gray-600">
                Watch your financial dashboard come alive with real-time insights, trends, and actionable recommendations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          {!isAuthenticated ? (
            <>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
                Ready to transform your finances?
              </h2>
              <p className="text-lg md:text-xl text-blue-100 mb-10 max-w-3xl mx-auto leading-relaxed">
                Join thousands of Indians who are already taking control of their money with FinTrackr. 
                Start your journey towards financial freedom today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link 
                  href="/signup"
                  className="bg-white text-blue-700 font-bold text-lg px-10 py-4 rounded-xl hover:bg-gray-50 transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:-translate-y-1"
                >
                  Start Free Today
                </Link>
                <Link 
                  href="/login"
                  className="border-2 border-white/30 text-white font-semibold text-lg px-10 py-4 rounded-xl hover:bg-white/10 transition-all duration-300"
                >
                  Sign In
                </Link>
              </div>
              <div className="flex items-center justify-center space-x-8 text-white/80 text-sm mt-8">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Free forever</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Bank-level security</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>No hidden fees</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
                Welcome back! Ready to track your finances?
              </h2>
              <p className="text-lg text-blue-100 mb-10 max-w-2xl mx-auto leading-relaxed">
                Continue managing your money with FinTrackr's powerful tools and insights.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link 
                  href="/dashboard"
                  className="bg-white text-blue-700 font-bold text-lg px-10 py-4 rounded-xl hover:bg-gray-50 transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:-translate-y-1"
                >
                  View Dashboard
                </Link>
                <Link 
                  href="/expenses/new"
                  className="border-2 border-white/30 text-white font-semibold text-lg px-10 py-4 rounded-xl hover:bg-white/10 transition-all duration-300"
                >
                  Add Expense
                </Link>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
