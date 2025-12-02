"use client";

import { useState, useEffect } from 'react';

export default function ProfileOverviewCard({ overview, isLoading = false }) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Financial Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="text-center">
              <div className="animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-1"></div>
                <div className="h-5 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  const overviewItems = [
    {
      icon: "💰",
      label: "Total Income",
      value: formatCurrency(overview?.totalIncome || 0),
      bgColor: "bg-green-50",
      textColor: "text-green-600",
      iconColor: "text-green-600"
    },
    {
      icon: "💸",
      label: "Total Expenses",
      value: formatCurrency(overview?.totalExpenses || 0),
      bgColor: "bg-red-50",
      textColor: "text-red-600",
      iconColor: "text-red-600"
    },
    {
      icon: "🎯",
      label: "Active Budgets",
      value: formatNumber(overview?.activeBudgets || 0),
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
      iconColor: "text-blue-600"
    },
    {
      icon: "📈",
      label: "Investments",
      value: formatCurrency(overview?.totalInvestments || 0),
      bgColor: "bg-purple-50",
      textColor: "text-purple-600",
      iconColor: "text-purple-600"
    }
  ];

  const savingsAmount = (overview?.totalIncome || 0) - (overview?.totalExpenses || 0);
  const savingsRate = overview?.savingsRate || 0;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 space-y-1 sm:space-y-0">
        <h3 className="text-lg md:text-xl font-semibold text-gray-900">Financial Overview</h3>
        <span className="text-xs md:text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">This Month</span>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        {overviewItems.map((item, index) => (
          <div key={index} className={`${item.bgColor} p-3 md:p-4 rounded-xl text-center min-h-[80px] md:min-h-[90px] flex flex-col justify-center`}>
            <div className={`text-xl md:text-2xl mb-1 md:mb-2 ${item.iconColor}`}>
              {item.icon}
            </div>
            <p className="text-xs text-gray-600 mb-1 leading-tight">{item.label}</p>
            <p className={`font-bold ${item.textColor} text-xs md:text-sm lg:text-base leading-tight`}>
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {/* Savings Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-1">Monthly Savings</p>
            <p className={`text-base md:text-lg font-bold ${savingsAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(Math.abs(savingsAmount))}
              {savingsAmount < 0 && (
                <span className="text-xs md:text-sm font-normal text-red-500 ml-1 block sm:inline">(Overspent)</span>
              )}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-sm text-gray-600 mb-1">Savings Rate</p>
            <p className={`text-base md:text-lg font-bold ${savingsRate >= 20 ? 'text-green-600' : savingsRate >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
              {savingsRate.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Savings Rate Indicator */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Poor</span>
            <span>Good</span>
            <span>Excellent</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                savingsRate >= 20 
                  ? 'bg-green-500' 
                  : savingsRate >= 10 
                  ? 'bg-yellow-500' 
                  : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, savingsRate))}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Quick Insights */}
      {overview && (
        <div className="mt-4 text-center">
          {savingsRate >= 20 && (
            <p className="text-xs md:text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg inline-block">🎉 Excellent savings rate! Keep it up!</p>
          )}
          {savingsRate >= 10 && savingsRate < 20 && (
            <p className="text-xs md:text-sm text-yellow-600 bg-yellow-50 px-3 py-2 rounded-lg inline-block">👍 Good progress! Try to save a bit more.</p>
          )}
          {savingsRate < 10 && savingsRate >= 0 && (
            <p className="text-xs md:text-sm text-orange-600 bg-orange-50 px-3 py-2 rounded-lg inline-block">⚠️ Consider reducing expenses to save more.</p>
          )}
          {savingsRate < 0 && (
            <p className="text-xs md:text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg inline-block">🚨 You're overspending! Review your budget.</p>
          )}
        </div>
      )}
    </div>
  );
}