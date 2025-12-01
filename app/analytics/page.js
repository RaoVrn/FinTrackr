"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "../components/ProtectedRoute";
import { expenseAPI, expenseHelpers } from "../lib/api";

function AnalyticsContent() {
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('30'); // Last 30 days
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Fetch expenses data
  useEffect(() => {
    fetchExpenses();
  }, [dateRange]);

  const fetchExpenses = async () => {
    try {
      setIsLoading(true);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      const response = await expenseAPI.getAll({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        limit: 1000 // Get all expenses for analytics
      });

      setExpenses(response.expenses || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching expenses:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate analytics data
  const calculateCategoryDistribution = () => {
    const categoryTotals = {};
    expenses.forEach(expense => {
      const category = expense.category || 'Other';
      categoryTotals[category] = (categoryTotals[category] || 0) + expense.amount;
    });
    
    const total = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);
    
    return Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: total > 0 ? ((amount / total) * 100).toFixed(1) : 0,
        icon: expenseHelpers.getCategoryIcon(category)
      }))
      .sort((a, b) => b.amount - a.amount);
  };

  const calculateDailyTrend = () => {
    const dailyTotals = {};
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(dateRange));

    // Initialize all dates with 0
    for (let i = 0; i < parseInt(dateRange); i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      dailyTotals[dateStr] = 0;
    }

    // Add actual expenses
    expenses.forEach(expense => {
      const dateStr = new Date(expense.date).toISOString().split('T')[0];
      if (dailyTotals.hasOwnProperty(dateStr)) {
        dailyTotals[dateStr] += expense.amount;
      }
    });

    return Object.entries(dailyTotals)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const calculateMonthlySpending = () => {
    const monthlyTotals = {};
    expenses.forEach(expense => {
      const date = new Date(expense.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + expense.amount;
    });

    return Object.entries(monthlyTotals)
      .map(([month, amount]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        amount
      }))
      .sort((a, b) => new Date(a.month + ' 1') - new Date(b.month + ' 1'));
  };

  const calculateCategoryInsights = () => {
    const categoryData = calculateCategoryDistribution();
    const totalExpenses = expenses.length;
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    return categoryData.map(cat => ({
      ...cat,
      count: expenses.filter(exp => exp.category === cat.category).length,
      averageAmount: cat.amount / expenses.filter(exp => exp.category === cat.category).length || 0,
      frequency: totalExpenses > 0 ? ((expenses.filter(exp => exp.category === cat.category).length / totalExpenses) * 100).toFixed(1) : 0
    }));
  };

  const calculateNeedWantDistribution = () => {
    const needWantTotals = {
      need: 0,
      want: 0,
      unsure: 0
    };
    const needWantCounts = {
      need: 0,
      want: 0,
      unsure: 0
    };

    expenses.forEach(expense => {
      const type = expense.needOrWant || 'need';
      needWantTotals[type] += expense.amount;
      needWantCounts[type] += 1;
    });

    const total = Object.values(needWantTotals).reduce((sum, amount) => sum + amount, 0);
    const totalCount = Object.values(needWantCounts).reduce((sum, count) => sum + count, 0);

    return [
      {
        type: 'Need',
        amount: needWantTotals.need,
        count: needWantCounts.need,
        percentage: total > 0 ? ((needWantTotals.need / total) * 100).toFixed(1) : 0,
        countPercentage: totalCount > 0 ? ((needWantCounts.need / totalCount) * 100).toFixed(1) : 0,
        icon: '✅',
        color: '#10B981'
      },
      {
        type: 'Want',
        amount: needWantTotals.want,
        count: needWantCounts.want,
        percentage: total > 0 ? ((needWantTotals.want / total) * 100).toFixed(1) : 0,
        countPercentage: totalCount > 0 ? ((needWantCounts.want / totalCount) * 100).toFixed(1) : 0,
        icon: '✨',
        color: '#8B5CF6'
      },
      {
        type: 'Unsure',
        amount: needWantTotals.unsure,
        count: needWantCounts.unsure,
        percentage: total > 0 ? ((needWantTotals.unsure / total) * 100).toFixed(1) : 0,
        countPercentage: totalCount > 0 ? ((needWantCounts.unsure / totalCount) * 100).toFixed(1) : 0,
        icon: '🤷',
        color: '#F59E0B'
      }
    ].filter(item => item.amount > 0);
  };

  // Chart components
  const PieChart = ({ data }) => {
    const total = data.reduce((sum, item) => sum + item.amount, 0);
    let cumulativePercentage = 0;

    const colors = [
      '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
      '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
    ];

    return (
      <div className="flex items-center justify-center">
        <div className="relative group">
          {/* Shadow circle for depth */}
          <svg width="180" height="180" className="absolute top-2 left-2 opacity-20">
            <circle
              cx="90"
              cy="90"
              r="60"
              fill="none"
              stroke="#000000"
              strokeWidth="20"
            />
          </svg>
          
          <svg width="180" height="180" className="transform -rotate-90 drop-shadow-lg">
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feOffset dx="0" dy="0" result="offset"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/> 
                </feMerge>
              </filter>
              <linearGradient id="pieGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3"/>
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
              </linearGradient>
            </defs>
            <circle
              cx="90"
              cy="90"
              r="60"
              fill="none"
              stroke="#F3F4F6"
              strokeWidth="20"
            />
            {data.slice(0, 6).map((item, index) => {
              const percentage = (item.amount / total) * 100;
              const circumference = 2 * Math.PI * 60;
              const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -((cumulativePercentage / 100) * circumference);
              cumulativePercentage += percentage;

              return (
                <circle
                  key={item.category}
                  cx="90"
                  cy="90"
                  r="60"
                  fill="none"
                  stroke={colors[index % colors.length]}
                  strokeWidth="15"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-700 hover:stroke-[18] cursor-pointer"
                  filter="url(#glow)"
                  strokeLinecap="round"

                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center bg-white rounded-full p-3 shadow-lg border border-gray-200">
              <div className="text-lg font-bold bg-gradient-to-br from-blue-600 to-purple-600 bg-clip-text text-transparent">₹{total.toFixed(0)}</div>
              <div className="text-xs font-semibold text-gray-500">Total</div>
            </div>
          </div>
        </div>

      </div>
    );
  };

  const DonutChart = ({ data }) => {
    const total = data.reduce((sum, item) => sum + item.amount, 0);
    let cumulativePercentage = 0;

    return (
      <div className="flex items-center justify-center">
        <div className="relative group">
          {/* Shadow effect */}
          <svg width="180" height="180" className="absolute top-2 left-2 opacity-20">
            <circle
              cx="90"
              cy="90"
              r="55"
              fill="none"
              stroke="#000000"
              strokeWidth="20"
            />
          </svg>
          
          <svg width="180" height="180" className="transform -rotate-90 drop-shadow-lg">
            <defs>
              <filter id="donut-glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feOffset dx="0" dy="0" result="offset"/>
                <feFlood floodColor="#ffffff" floodOpacity="0.3"/>
                <feComposite in="SourceGraphic" in2="offset" operator="over"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/> 
                </feMerge>
              </filter>
            </defs>
            {/* Background circle */}
            <circle
              cx="90"
              cy="90"
              r="55"
              fill="none"
              stroke="#F3F4F6"
              strokeWidth="20"
            />
            {/* Data segments */}
            {data.map((item, index) => {
              const percentage = (item.amount / total) * 100;
              const circumference = 2 * Math.PI * 55;
              const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -((cumulativePercentage / 100) * circumference);
              cumulativePercentage += percentage;

              return (
                <circle
                  key={item.type}
                  cx="90"
                  cy="90"
                  r="55"
                  fill="none"
                  stroke={item.color}
                  strokeWidth="20"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-300 hover:stroke-[22] cursor-pointer"
                  strokeLinecap="round"
                  filter="url(#donut-glow)"

                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center bg-white rounded-full p-4 shadow-lg border border-gray-200">
              <div className="text-lg font-bold bg-gradient-to-br from-green-600 to-purple-600 bg-clip-text text-transparent">₹{total.toFixed(0)}</div>
              <div className="text-xs font-semibold text-gray-600">Total</div>
            </div>
          </div>
        </div>

      </div>
    );
  };

  const LineChart = ({ data }) => {
    const maxAmount = Math.max(...data.map(d => d.amount), 100);
    const width = 300;
    const height = 180;
    const padding = 40;

    const getX = (index) => padding + (index * (width - 2 * padding)) / Math.max(data.length - 1, 1);
    const getY = (amount) => height - padding - ((amount / maxAmount) * (height - 2 * padding));

    const pathData = data
      .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.amount)}`)
      .join(' ');

    // Create area path for gradient fill
    const areaPathData = data.length > 0 ? 
      pathData + ` L ${getX(data.length - 1)} ${height - padding} L ${padding} ${height - padding} Z` : '';

    return (
      <div className="w-full">
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4"/>
              <stop offset="50%" stopColor="#60A5FA" stopOpacity="0.2"/>
              <stop offset="100%" stopColor="#93C5FD" stopOpacity="0.05"/>
            </linearGradient>
            <linearGradient id="lineStroke" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3B82F6"/>
              <stop offset="50%" stopColor="#6366F1"/>
              <stop offset="100%" stopColor="#8B5CF6"/>
            </linearGradient>
            <filter id="line-glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/> 
              </feMerge>
            </filter>
          </defs>
          
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
            <line
              key={ratio}
              x1={padding}
              x2={width - padding}
              y1={getY(maxAmount * ratio)}
              y2={getY(maxAmount * ratio)}
              stroke="#F3F4F6"
              strokeWidth="1"
              strokeDasharray={ratio === 0 || ratio === 1 ? "0" : "3,3"}
            />
          ))}
          
          {/* Area fill */}
          {data.length > 0 && (
            <path
              d={areaPathData}
              fill="url(#lineGradient)"
              className="transition-all duration-500"
            />
          )}
          
          {/* Main line */}
          <path
            d={pathData}
            fill="none"
            stroke="url(#lineStroke)"
            strokeWidth="4"
            className="drop-shadow-lg"
            filter="url(#line-glow)"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: data.length > 0 ? `0 ${pathData.length}` : '0',
              animation: 'drawLine 2s ease-out forwards'
            }}
          />
          
          {/* Data points */}
          {data.map((d, i) => (
            <g key={i}>
              <circle
                cx={getX(i)}
                cy={getY(d.amount)}
                r="8"
                fill="white"
                stroke="#3B82F6"
                strokeWidth="3"
                className="hover:r-10 transition-all cursor-pointer drop-shadow-lg"
                style={{
                  animation: `popIn 0.6s ease-out forwards`,
                  animationDelay: `${1.5 + i * 0.1}s`,
                  opacity: 0
                }}
              />
              <circle
                cx={getX(i)}
                cy={getY(d.amount)}
                r="4"
                fill="#3B82F6"
                className="pointer-events-none"
                style={{
                  animation: `popIn 0.6s ease-out forwards`,
                  animationDelay: `${1.5 + i * 0.1}s`,
                  opacity: 0
                }}
              />
            </g>
          ))}
          
          {/* Y-axis labels */}
          {[0, 0.5, 1].map(ratio => (
            <text
              key={ratio}
              x={padding - 15}
              y={getY(maxAmount * ratio) + 5}
              textAnchor="end"
              fontSize="12"
              fill="#6B7280"
              fontWeight="500"
            >
              ₹{(maxAmount * ratio).toFixed(0)}
            </text>
          ))}
        </svg>
        <style jsx>{`
          @keyframes drawLine {
            to {
              stroke-dasharray: 1000 0;
            }
          }
          @keyframes popIn {
            from {
              opacity: 0;
              transform: scale(0);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}</style>
      </div>
    );
  };

  const BarChart = ({ data }) => {
    const maxAmount = Math.max(...data.map(d => d.amount), 100);

    const gradients = [
      'from-blue-500 via-blue-600 to-indigo-600',
      'from-purple-500 via-purple-600 to-pink-600', 
      'from-emerald-500 via-emerald-600 to-teal-600',
      'from-orange-500 via-orange-600 to-red-600',
      'from-cyan-500 via-cyan-600 to-blue-600',
      'from-violet-500 via-violet-600 to-purple-600'
    ];

    return (
      <div className="space-y-5">
        {data.map((item, index) => (
          <div key={item.month} className="group">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-gray-700">
                {item.month}
              </div>
              <div className="text-sm font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-lg">
                ₹{item.amount.toFixed(0)}
              </div>
            </div>
            <div className="bg-gray-200 rounded-lg h-8 relative overflow-hidden">
              <div
                className={`bg-gradient-to-r ${gradients[index % gradients.length]} h-8 rounded-lg transition-all duration-500 ease-out`}
                style={{ 
                  width: `${Math.max((item.amount / maxAmount) * 100, 5)}%`
                }}
              >
              </div>
            </div>
          </div>
        ))}

      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto shadow-lg"></div>
          <p className="mt-6 text-xl font-medium text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="max-w-md mx-auto px-6">
          <div className="bg-red-50/90 backdrop-blur-sm border border-red-200 text-red-600 px-6 py-4 rounded-2xl shadow-lg">
            <h3 className="font-semibold mb-2">Error loading analytics</h3>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const categoryDistribution = calculateCategoryDistribution();
  const dailyTrend = calculateDailyTrend();
  const monthlySpending = calculateMonthlySpending();
  const categoryInsights = calculateCategoryInsights();
  const needWantDistribution = calculateNeedWantDistribution();
  const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-16">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4 leading-tight">Analytics & Insights</h1>
              <p className="text-xl text-gray-600 font-medium">Track your spending patterns and financial trends</p>
            </div>
          
            {/* Date Range Selector */}
            <div className="flex items-center space-x-4 mt-8 sm:mt-0">
              <div className="relative">
                <label className="text-sm font-semibold text-gray-600 mb-2 block">
                  Time Range:
                </label>
                <div className="relative">
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="appearance-none bg-gradient-to-r from-white to-blue-50 border border-blue-200 rounded-xl px-6 py-3 pr-12 text-sm font-semibold text-gray-800 cursor-pointer shadow-lg hover:shadow-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-300"
                  >
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="90">Last 3 months</option>
                    <option value="365">Last year</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {expenses.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-8xl mb-6">📊</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">No Data Available</h3>
            <p className="text-lg text-gray-600 mb-8">Add some expenses to see your analytics</p>
            <Link
              href="/expenses/new"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl text-lg font-semibold"
            >
              Add Your First Expense
            </Link>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Overview Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-blue-600 mb-1">Total Spent</p>
                    <p className="text-3xl font-bold text-blue-900">₹{totalSpent.toFixed(0)}</p>
                  </div>
                  <div className="text-4xl">💰</div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-emerald-600 mb-1">Total Transactions</p>
                    <p className="text-3xl font-bold text-emerald-900">{expenses.length}</p>
                  </div>
                  <div className="text-4xl">📊</div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-purple-600 mb-1">Average per Transaction</p>
                    <p className="text-3xl font-bold text-purple-900">
                      ₹{expenses.length > 0 ? (totalSpent / expenses.length).toFixed(0) : '0'}
                    </p>
                  </div>
                  <div className="text-4xl">📈</div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-amber-600 mb-1">Categories Used</p>
                    <p className="text-3xl font-bold text-amber-900">{categoryDistribution.length}</p>
                  </div>
                  <div className="text-4xl">🏷️</div>
                </div>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Category Distribution Pie Chart */}
              <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="flex items-center mb-6">
                  <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full mr-3"></div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold text-gray-800 truncate">Category Distribution</h3>
                    <p className="text-xs text-gray-500 mt-1 truncate">Breakdown by categories</p>
                  </div>
                </div>
                <div className="flex flex-col items-center space-y-4">
                  <div className="flex-shrink-0">
                    <PieChart data={categoryDistribution} />
                  </div>
                  <div className="space-y-2 w-full max-h-48 overflow-y-auto">
                    {categoryDistribution.slice(0, 4).map((item, index) => (
                      <div key={item.category} className="flex items-center justify-between p-3 bg-gradient-to-r from-white to-blue-50/30 rounded-xl hover:from-blue-50 hover:to-indigo-50/50 transition-all duration-300 border border-blue-100/50 shadow-sm hover:shadow-md">
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          <div 
                            className="w-4 h-4 rounded-full flex-shrink-0 shadow-md border border-white"
                            style={{ 
                              backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'][index],
                              boxShadow: `0 0 10px ${['#3B82F6', '#10B981', '#F59E0B', '#EF4444'][index]}40`
                            }}
                          ></div>
                          <span className="text-lg">{item.icon}</span>
                          <span className="text-sm font-semibold text-gray-700 truncate">{item.category}</span>
                        </div>
                        <div className="text-right flex-shrink-0 ml-3">
                          <div className="text-sm font-bold text-gray-900 bg-white/80 px-2 py-1 rounded-lg shadow-sm">₹{item.amount.toFixed(0)}</div>
                          <div className="text-xs font-medium text-gray-600 mt-1">{item.percentage}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Need vs Want vs Unsure Distribution */}
              <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="flex items-center mb-6">
                  <div className="w-1 h-8 bg-gradient-to-b from-green-500 to-orange-500 rounded-full mr-3"></div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold text-gray-800 truncate">Need vs Want vs Unsure</h3>
                    <p className="text-xs text-gray-500 mt-1 truncate">Priority analysis</p>
                  </div>
                </div>
                <div className="flex flex-col items-center space-y-4">
                  <div className="flex-shrink-0">
                    <DonutChart data={needWantDistribution} />
                  </div>
                  <div className="space-y-2 w-full max-h-32 overflow-y-auto">
                    {needWantDistribution.map((item) => (
                      <div key={item.type} className="flex items-center justify-between p-3 bg-gradient-to-r from-white to-orange-50/30 rounded-xl hover:from-orange-50 hover:to-yellow-50/50 transition-all duration-300 border border-orange-100/50 shadow-sm hover:shadow-md">
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          <div 
                            className="w-4 h-4 rounded-full flex-shrink-0 shadow-md border border-white"
                            style={{ 
                              backgroundColor: item.color,
                              boxShadow: `0 0 10px ${item.color}40`
                            }}
                          ></div>
                          <span className="text-lg">{item.icon}</span>
                          <span className="text-sm font-semibold text-gray-700 truncate">{item.type}</span>
                        </div>
                        <div className="text-right flex-shrink-0 ml-3">
                          <div className="text-sm font-bold text-gray-900 bg-white/80 px-2 py-1 rounded-lg shadow-sm">₹{item.amount.toFixed(0)}</div>
                          <div className="text-xs font-medium text-gray-600 mt-1">{item.percentage}%</div>
                        </div>
                      </div>
                    ))}
                    {needWantDistribution.length === 0 && (
                      <div className="text-sm text-gray-500 text-center py-8 bg-gray-50 rounded-xl">
                        No expense data available
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Daily Spending Trend Line Chart */}
              <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="flex items-center mb-6">
                  <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full mr-3"></div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold text-gray-800 truncate">Daily Spending Trend</h3>
                    <p className="text-xs text-gray-500 mt-1 truncate">Pattern analysis</p>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-cyan-50/80 rounded-xl p-4 mb-4 border border-blue-100/50 shadow-inner">
                  <div className="w-full h-48 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent pointer-events-none"></div>
                    <LineChart data={dailyTrend} />
                  </div>
                </div>
                <div className="text-xs font-medium text-gray-500 text-center bg-blue-50 py-2 px-3 rounded-lg">
                  Last {dateRange} days
                </div>
              </div>
            </div>

            {/* Monthly Spending Bar Chart */}
            {monthlySpending.length > 1 && (
              <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl border border-white/20 hover:shadow-2xl hover:bg-white/90 transition-all duration-500">
                <div className="flex items-center mb-8">
                  <div className="w-1 h-12 bg-gradient-to-b from-orange-500 to-red-500 rounded-full mr-4"></div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Monthly Spending</h3>
                    <p className="text-sm text-gray-500 mt-1">Month-over-month comparison</p>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-orange-50/80 via-amber-50/60 to-red-50/80 rounded-2xl p-6 border border-orange-100/50 shadow-inner relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent pointer-events-none"></div>
                  <BarChart data={monthlySpending} />
                </div>
              </div>
            )}

            {/* Category Insights */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden hover:shadow-2xl hover:bg-white/90 transition-all duration-500">
              <div className="px-8 py-8 border-b border-gray-100/50 bg-gradient-to-r from-indigo-50/80 to-purple-50/80">
                <div className="flex items-center">
                  <div className="w-1 h-12 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full mr-4"></div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">Category Insights</h3>
                    <p className="text-sm font-medium text-gray-600 mt-2">Detailed breakdown of your spending categories</p>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-blue-50">
                      <th className="text-left py-4 px-8 font-bold text-gray-700 tracking-wide">Category</th>
                      <th className="text-right py-4 px-8 font-bold text-gray-700 tracking-wide">Amount</th>
                      <th className="text-right py-4 px-8 font-bold text-gray-700 tracking-wide">Count</th>
                      <th className="text-right py-4 px-8 font-bold text-gray-700 tracking-wide">Average</th>
                      <th className="text-right py-4 px-8 font-bold text-gray-700 tracking-wide">Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {categoryInsights.map((item, index) => (
                      <tr key={item.category} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200">
                        <td className="py-5 px-8">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center">
                              <span className="text-xl">{item.icon}</span>
                            </div>
                            <span className="font-semibold text-gray-900">{item.category}</span>
                          </div>
                        </td>
                        <td className="py-5 px-8 text-right">
                          <span className="font-bold text-gray-900 bg-green-50 px-3 py-1 rounded-lg">₹{item.amount.toFixed(0)}</span>
                        </td>
                        <td className="py-5 px-8 text-right">
                          <span className="font-medium text-gray-700 bg-blue-50 px-3 py-1 rounded-lg">{item.count}</span>
                        </td>
                        <td className="py-5 px-8 text-right">
                          <span className="font-medium text-gray-700">₹{item.averageAmount.toFixed(0)}</span>
                        </td>
                        <td className="py-5 px-8 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <div className="w-12 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500" 
                                style={{ width: `${Math.min(parseFloat(item.percentage), 100)}%` }}
                              ></div>
                            </div>
                            <span className="font-semibold text-gray-700 min-w-[3rem]">{item.percentage}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Analytics() {
  return (
    <ProtectedRoute>
      <AnalyticsContent />
    </ProtectedRoute>
  );
}