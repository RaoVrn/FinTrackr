"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "../components/ProtectedRoute";
import { expenseAPI, incomeAPI, debtAPI, investmentAPI, budgetAPI } from "../lib/api";
import { useAuth } from "../context/AuthContext";

function DashboardContent() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [financialData, setFinancialData] = useState({
    // Core amounts
    totalIncome: 0,
    totalExpenses: 0,
    totalDebts: 0,
    totalInvestments: 0,
    
    // Monthly data
    monthlyIncome: 0,
    monthlyExpenses: 0,
    monthlyDebtPayments: 0,
    
    // Budget data
    budgetUsed: 0,
    budgetLimit: 0,
    userHasBudget: false,
    
    // Calculated values
    netWorth: 0,
    cashFlow: 0,
    
    // Health metrics
    financialHealthScore: 0,
    hasHealthData: false,
    emergencyFundRatio: 0,
    debtToIncomeRatio: 0,
    savingsRate: 0,
    
    // Counts
    incomeCount: 0,
    expenseCount: 0,
    debtCount: 0,
    investmentCount: 0,

    // Chart data
    expensesByCategory: {},
    monthlyTrends: [],
    needWantBreakdown: {}
  });

  // Pie chart component
  const PieChart = ({ data, title }) => {
    console.log('PieChart data:', data); // Debug log
    const total = Object.values(data || {}).reduce((sum, value) => sum + (value || 0), 0);
    
    if (total === 0 || Object.keys(data || {}).length === 0) {
      return (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">📊</div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">{title}</h4>
          <p className="text-gray-500">No data available</p>
        </div>
      );
    }

    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280'];
    const radius = 15.91549430918953;
    const circumference = 2 * Math.PI * radius;
    let accumulatedPercentage = 0;

    return (
      <div className="text-center">
        <h4 className="text-lg font-semibold text-gray-900 mb-3">{title}</h4>
        <div className="relative w-40 h-40 mx-auto mb-3">
          <svg viewBox="0 0 42 42" className="w-40 h-40 transform -rotate-90">
            {/* Background circle */}
            <circle cx="21" cy="21" r={radius} fill="transparent" stroke="#f3f4f6" strokeWidth="3"></circle>
            {/* Data segments */}
            {Object.entries(data).map(([category, value], index) => {
              const percentage = (value / total);
              const strokeLength = circumference * percentage;
              const offset = circumference * accumulatedPercentage;
              const color = colors[index % colors.length];
              
              accumulatedPercentage += percentage;
              
              return (
                <circle
                  key={category}
                  cx="21"
                  cy="21"
                  r={radius}
                  fill="transparent"
                  stroke={color}
                  strokeWidth="3"
                  strokeDasharray={`${strokeLength} ${circumference}`}
                  strokeDashoffset={-offset}
                  className="transition-all duration-500"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">₹{total.toLocaleString()}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
          </div>
        </div>
        <div className="space-y-1 max-w-sm mx-auto">
          {Object.entries(data).map(([category, value], index) => (
            <div key={category} className="flex items-center justify-between text-xs">
              <div className="flex items-center min-w-0">
                <div 
                  className="w-2 h-2 rounded-full mr-2 flex-shrink-0" 
                  style={{ backgroundColor: colors[index % colors.length] }}
                ></div>
                <span className="capitalize truncate">{category}</span>
              </div>
              <span className="font-medium ml-2">₹{value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Bar chart component
  const BarChart = ({ data, title }) => {
    console.log('BarChart data:', data); // Debug log
    
    if (!data || data.length === 0) {
      return (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">📈</div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">{title}</h4>
          <p className="text-gray-500">No trend data available</p>
        </div>
      );
    }

    const maxValue = Math.max(...data.map(item => Math.max(item.income || 0, item.expenses || 0)));
    if (maxValue === 0) {
      return (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">📈</div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">{title}</h4>
          <p className="text-gray-500">No financial activity yet</p>
        </div>
      );
    }

    return (
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-3">{title}</h4>
        <div className="space-y-3">
          {data.slice(-6).map((item, index) => (
            <div key={index} className="space-y-1">
              <div className="flex justify-between text-xs text-gray-600">
                <span className="font-medium">{item.month}</span>
              </div>
              <div className="space-y-1">
                {/* Income bar */}
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-green-600 w-10">Inc</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="h-1.5 bg-green-500 rounded-full transition-all duration-700"
                      style={{ width: `${((item.income || 0) / maxValue) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-green-600 w-14 text-right">₹{(item.income || 0).toLocaleString()}</span>
                </div>
                {/* Expenses bar */}
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-red-600 w-10">Exp</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="h-1.5 bg-red-500 rounded-full transition-all duration-700"
                      style={{ width: `${((item.expenses || 0) / maxValue) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-red-600 w-14 text-right">₹{(item.expenses || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-center space-x-3 text-xs text-gray-500">
          <div className="flex items-center">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></div>
            Income
          </div>
          <div className="flex items-center">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1"></div>
            Expenses
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    const fetchAllFinancialData = async () => {
      try {
        setLoading(true);
        
        // Fetch all financial data in parallel
        const [expensesResponse, incomesResponse, debtsResponse, investmentsResponse, budgetsResponse] = await Promise.allSettled([
          expenseAPI.getAll(),
          incomeAPI.getAll(),
          debtAPI.getAll(),
          investmentAPI.getAll(),
          budgetAPI.getAll()
        ]);

        // Handle responses
        const expensesArray = expensesResponse.status === 'fulfilled' 
          ? (expensesResponse.value?.expenses || expensesResponse.value || [])
          : [];
        
        const incomesArray = incomesResponse.status === 'fulfilled'
          ? (incomesResponse.value?.incomes || incomesResponse.value || [])
          : [];

        const debtsArray = debtsResponse.status === 'fulfilled'
          ? (debtsResponse.value?.success ? debtsResponse.value.debts || [] : debtsResponse.value?.debts || debtsResponse.value || [])
          : [];

        const investmentsArray = investmentsResponse.status === 'fulfilled'
          ? (investmentsResponse.value?.investments || investmentsResponse.value || [])
          : [];

        const budgetsArray = budgetsResponse.status === 'fulfilled'
          ? (budgetsResponse.value?.budgets || budgetsResponse.value || [])
          : [];

        calculateFinancialData(expensesArray, incomesArray, debtsArray, investmentsArray, budgetsArray);
        
      } catch (error) {
        console.error('Error fetching financial data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllFinancialData();
  }, []);

  const calculateFinancialData = (expenseData = [], incomeData = [], debtData = [], investmentData = [], budgetData = []) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Calculate expenses
    const monthlyExpenses = expenseData.filter(expense => {
      const expenseDate = new Date(expense.createdAt || expense.date);
      return expenseDate.getMonth() === currentMonth && 
             expenseDate.getFullYear() === currentYear;
    });
    const totalExpenseAmount = expenseData.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const monthlyExpenseAmount = monthlyExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

    // Calculate income
    const monthlyIncomes = incomeData.filter(income => {
      const incomeDate = new Date(income.createdAt || income.date);
      return incomeDate.getMonth() === currentMonth && 
             incomeDate.getFullYear() === currentYear;
    });
    const totalIncomeAmount = incomeData.reduce((sum, inc) => sum + (inc.amount || 0), 0);
    const monthlyIncomeAmount = monthlyIncomes.reduce((sum, inc) => sum + (inc.amount || 0), 0);

    // Calculate debts
    const totalDebtAmount = debtData.reduce((sum, debt) => sum + (debt.currentBalance || debt.remainingAmount || debt.amount || 0), 0);
    const monthlyDebtPayments = debtData.reduce((sum, debt) => sum + (debt.minimumPayment || debt.monthlyPayment || debt.amount / 12 || 0), 0);

    // Calculate investments
    const totalInvestmentValue = investmentData.reduce((sum, inv) => sum + (inv.currentValue || inv.amount || 0), 0);

    // Calculate budget
    const activeBudgets = budgetData.filter(budget => budget.isActive !== false);
    const totalBudgetLimit = activeBudgets.reduce((sum, budget) => sum + (budget.amount || 0), 0);
    const totalBudgetUsed = activeBudgets.reduce((sum, budget) => sum + (budget.spent || 0), 0);
    const userHasBudget = activeBudgets.length > 0;

    // Core calculations
    const netWorth = totalIncomeAmount + totalInvestmentValue - totalExpenseAmount - totalDebtAmount;
    const cashFlow = monthlyIncomeAmount - monthlyExpenseAmount - monthlyDebtPayments;

    // Calculate chart data
    const expensesByCategory = {};
    console.log('Processing expense data:', expenseData); // Debug log
    expenseData.forEach(expense => {
      const category = expense.category || 'Other';
      expensesByCategory[category] = (expensesByCategory[category] || 0) + (expense.amount || 0);
    });
    console.log('Expenses by category:', expensesByCategory); // Debug log

    // Calculate Need vs Want vs Unsure
    const needWantCategories = {
      'Need': 0,
      'Want': 0,
      'Unsure': 0
    };

    // Define category mappings (you can customize these)
    const needCategories = ['food', 'groceries', 'healthcare', 'utilities', 'transport', 'rent', 'housing'];
    const wantCategories = ['entertainment', 'shopping', 'dining', 'travel', 'hobbies', 'games'];
    
    expenseData.forEach(expense => {
      const category = (expense.category || '').toLowerCase();
      const amount = expense.amount || 0;
      
      if (needCategories.includes(category)) {
        needWantCategories['Need'] += amount;
      } else if (wantCategories.includes(category)) {
        needWantCategories['Want'] += amount;
      } else {
        needWantCategories['Unsure'] += amount;
      }
    });
    console.log('Need vs Want breakdown:', needWantCategories); // Debug log

    // Calculate monthly trends (last 6 months)
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      
      const monthIncomes = incomeData.filter(income => {
        const incomeDate = new Date(income.createdAt || income.date);
        return incomeDate.getMonth() === date.getMonth() && 
               incomeDate.getFullYear() === date.getFullYear();
      });
      
      const monthExpenses = expenseData.filter(expense => {
        const expenseDate = new Date(expense.createdAt || expense.date);
        return expenseDate.getMonth() === date.getMonth() && 
               expenseDate.getFullYear() === date.getFullYear();
      });
      
      monthlyTrends.push({
        month: monthName,
        income: monthIncomes.reduce((sum, inc) => sum + (inc.amount || 0), 0),
        expenses: monthExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)
      });
    }
    console.log('Monthly trends:', monthlyTrends); // Debug log

    // Health metrics calculations
    const availableSavings = monthlyIncomeAmount - monthlyExpenseAmount - monthlyDebtPayments;
    const emergencyFundRatio = monthlyExpenseAmount > 0 && availableSavings > 0 ? 
      availableSavings / monthlyExpenseAmount : 0;
    const debtToIncomeRatio = monthlyIncomeAmount > 0 ? monthlyDebtPayments / monthlyIncomeAmount : 0;
    const netMonthlySavings = monthlyIncomeAmount - monthlyExpenseAmount - monthlyDebtPayments;
    const savingsRate = monthlyIncomeAmount > 0 ? netMonthlySavings / monthlyIncomeAmount : 0;

    // Calculate financial health score
    let healthScore = 0;
    let hasHealthData = false;

    // Only calculate health score if there's meaningful monthly data
    if (monthlyIncomeAmount > 0 && monthlyExpenseAmount > 0) {
      hasHealthData = true;
      
      // Emergency fund component (0-25 points) - based on months of expenses covered
      const monthsOfExpensesCovered = monthlyExpenseAmount > 0 ? 
        (monthlyIncomeAmount - monthlyExpenseAmount - monthlyDebtPayments) / monthlyExpenseAmount : 0;
      const emergencyScore = Math.min(Math.max(monthsOfExpensesCovered / 3, 0) * 25, 25);
      
      // Debt ratio component (0-25 points) - lower debt ratio is better
      const debtScore = monthlyIncomeAmount > 0 ? 
        Math.max(25 - (monthlyDebtPayments / monthlyIncomeAmount) * 100, 0) : 25;
      
      // Savings rate component (0-25 points) - positive cash flow is good
      const monthlySavings = monthlyIncomeAmount - monthlyExpenseAmount - monthlyDebtPayments;
      const savingsRatePercentage = monthlyIncomeAmount > 0 ? (monthlySavings / monthlyIncomeAmount) * 100 : 0;
      const savingsScore = Math.min(Math.max(savingsRatePercentage / 2, 0), 25); // 50% savings rate = max points
      
      // Investment component (0-25 points) - having investments is good
      const investmentScore = totalInvestmentValue > 0 ? 
        Math.min((totalInvestmentValue / Math.max(monthlyIncomeAmount * 12, 1000)) * 100, 25) : 0;
      
      healthScore = Math.round(emergencyScore + debtScore + savingsScore + investmentScore);
      healthScore = Math.min(healthScore, 100); // Cap at 100
    } else if (monthlyIncomeAmount > 0 || totalInvestmentValue > 0) {
      hasHealthData = true;
      // Basic score if only partial data available
      healthScore = 40; // Neutral score
    }

    setFinancialData({
      // Core amounts
      totalIncome: totalIncomeAmount,
      totalExpenses: totalExpenseAmount,
      totalDebts: totalDebtAmount,
      totalInvestments: totalInvestmentValue,
      
      // Monthly data
      monthlyIncome: monthlyIncomeAmount,
      monthlyExpenses: monthlyExpenseAmount,
      monthlyDebtPayments,
      
      // Budget data
      budgetUsed: totalBudgetUsed,
      budgetLimit: totalBudgetLimit,
      userHasBudget,
      
      // Calculated values
      netWorth,
      cashFlow,
      
      // Health metrics
      financialHealthScore: healthScore,
      hasHealthData,
      emergencyFundRatio,
      debtToIncomeRatio,
      savingsRate,
      
      // Counts
      incomeCount: incomeData.length,
      expenseCount: expenseData.length,
      debtCount: debtData.length,
      investmentCount: investmentData.length,

      // Chart data
      expensesByCategory,
      monthlyTrends,
      needWantBreakdown: needWantCategories
    });
  };

  // Helper functions for conditional rendering
  const getBudgetStatus = () => {
    if (!financialData.userHasBudget) {
      return {
        message: "No budget set yet. Create a budget to track spending.",
        status: "none",
        color: "text-gray-500"
      };
    }

    const remaining = financialData.budgetLimit - financialData.budgetUsed;
    const percentUsed = (financialData.budgetUsed / financialData.budgetLimit) * 100;

    if (percentUsed > 100) {
      return {
        message: `Over budget by ₹${Math.abs(remaining).toLocaleString()}`,
        status: "over",
        color: "text-red-600"
      };
    } else {
      return {
        message: `₹${remaining.toLocaleString()} remaining`,
        status: "within",
        color: "text-green-600"
      };
    }
  };

  const getNetWorthDisplay = () => {
    if (financialData.netWorth === 0 && financialData.totalIncome === 0 && financialData.totalExpenses === 0) {
      return {
        amount: "₹0",
        message: "Net worth will appear once you add income and expenses.",
        showMessage: true
      };
    }
    return {
      amount: `₹${financialData.netWorth.toLocaleString()}`,
      message: "",
      showMessage: false
    };
  };

  const getCashFlowDisplay = () => {
    if (financialData.cashFlow === 0 && financialData.monthlyIncome === 0 && financialData.monthlyExpenses === 0) {
      return {
        amount: "₹0",
        message: "Cash flow insights will appear when you add transactions.",
        showMessage: true
      };
    }
    return {
      amount: `₹${financialData.cashFlow.toLocaleString()}`,
      message: financialData.cashFlow > 0 ? "Positive cash flow" : "Negative cash flow",
      showMessage: false
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your financial overview...</p>
        </div>
      </div>
    );
  }

  const netWorthDisplay = getNetWorthDisplay();
  const cashFlowDisplay = getCashFlowDisplay();
  const budgetStatus = getBudgetStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent mb-2">
            Financial Dashboard
          </h1>
          <p className="text-gray-600 text-lg">Welcome back, {user?.name} 👋 Here's your complete financial picture</p>
        </div>

        {/* SECTION A — Key Financial Overview */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Financial Snapshot</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Net Worth */}
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-6 rounded-2xl shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <span className="text-emerald-100 text-sm font-medium">Net Worth</span>
              </div>
              <p className="text-3xl font-bold mb-2">{netWorthDisplay.amount}</p>
              {netWorthDisplay.showMessage ? (
                <p className="text-emerald-100 text-sm">{netWorthDisplay.message}</p>
              ) : (
                <p className={`text-sm ${financialData.netWorth >= 0 ? 'text-emerald-100' : 'text-red-200'}`}>
                  {financialData.netWorth >= 0 ? 'Growing wealth' : 'Need attention'}
                </p>
              )}
            </div>

            {/* Monthly Cash Flow */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
                <span className="text-blue-100 text-sm font-medium">Monthly Cash Flow</span>
              </div>
              <p className="text-3xl font-bold mb-2">{cashFlowDisplay.amount}</p>
              <p className="text-blue-100 text-sm">
                ₹{financialData.monthlyIncome.toLocaleString()} in - ₹{(financialData.monthlyExpenses + financialData.monthlyDebtPayments).toLocaleString()} out
              </p>
            </div>
          </div>
        </div>

        {/* SECTION B — Portfolio Overview */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Portfolio Overview</h2>
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Assets vs Liabilities */}
              <div className="lg:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Assets vs Liabilities</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-700 font-medium flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                        Assets (Income + Investments)
                      </span>
                      <span className="font-semibold text-green-600">
                        ₹{(financialData.totalIncome + financialData.totalInvestments).toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="h-3 bg-green-500 rounded-full"
                        style={{
                          width: `${Math.min(
                            ((financialData.totalIncome + financialData.totalInvestments) / 
                            Math.max(financialData.totalIncome + financialData.totalInvestments + financialData.totalExpenses + financialData.totalDebts, 1)) * 100,
                            100
                          )}%`
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-700 font-medium flex items-center">
                        <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                        Liabilities (Expenses + Debts)
                      </span>
                      <span className="font-semibold text-red-600">
                        ₹{(financialData.totalExpenses + financialData.totalDebts).toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="h-3 bg-red-500 rounded-full"
                        style={{
                          width: `${Math.min(
                            ((financialData.totalExpenses + financialData.totalDebts) / 
                            Math.max(financialData.totalIncome + financialData.totalInvestments + financialData.totalExpenses + financialData.totalDebts, 1)) * 100,
                            100
                          )}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Health Score */}
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Health</h3>
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" stroke="#f3f4f6" strokeWidth="8" fill="none" />
                    <circle
                      cx="50" cy="50" r="40"
                      stroke={financialData.savingsRate >= 0.2 ? "#10b981" : financialData.savingsRate >= 0.1 ? "#f59e0b" : "#ef4444"}
                      strokeWidth="8" fill="none"
                      strokeDasharray={251.2}
                      strokeDashoffset={251.2 - (Math.min(financialData.savingsRate * 100, 100) / 100) * 251.2}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold text-gray-900">{(financialData.savingsRate * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-700">Savings Rate</p>
                <p className={`text-xs mt-1 ${
                  financialData.savingsRate >= 0.2 ? 'text-green-600' : 
                  financialData.savingsRate >= 0.1 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {financialData.savingsRate >= 0.2 ? 'Excellent' : 
                   financialData.savingsRate >= 0.1 ? 'Good' : 
                   financialData.savingsRate >= 0 ? 'Improving' : 'Needs attention'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION C — Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              
              <Link href="/expenses/new" className="p-4 bg-red-50 hover:bg-red-100 rounded-xl transition-colors group">
                <div className="w-10 h-10 bg-red-600 group-hover:bg-red-700 rounded-lg flex items-center justify-center mb-3 transition-colors">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <p className="font-medium text-gray-900">Add Expense</p>
                <p className="text-sm text-gray-500">Record spending</p>
              </Link>

              <Link href="/income/new" className="p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-colors group">
                <div className="w-10 h-10 bg-green-600 group-hover:bg-green-700 rounded-lg flex items-center justify-center mb-3 transition-colors">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <p className="font-medium text-gray-900">Add Income</p>
                <p className="text-sm text-gray-500">Record earnings</p>
              </Link>

              <Link href="/debts/new" className="p-4 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors group">
                <div className="w-10 h-10 bg-orange-600 group-hover:bg-orange-700 rounded-lg flex items-center justify-center mb-3 transition-colors">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <p className="font-medium text-gray-900">Add Debt</p>
                <p className="text-sm text-gray-500">Track loans</p>
              </Link>

              <Link href="/investments/new" className="p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors group">
                <div className="w-10 h-10 bg-purple-600 group-hover:bg-purple-700 rounded-lg flex items-center justify-center mb-3 transition-colors">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <p className="font-medium text-gray-900">Add Investment</p>
                <p className="text-sm text-gray-500">Track portfolio</p>
              </Link>
            </div>
          </div>
        </div>

        {/* SECTION D — Smart Recommendations & Budget Status */}
        <div className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Monthly Progress */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Monthly Progress</h2>
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                
                {/* Income vs Expenses Progress */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium text-gray-900">Cash Flow Breakdown</h3>
                    <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                      financialData.cashFlow >= 0 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {financialData.cashFlow >= 0 ? 'Positive' : 'Negative'} Flow
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Monthly Income</span>
                        <span className="font-medium text-green-600">₹{financialData.monthlyIncome.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="h-2 bg-green-500 rounded-full" style={{width: '100%'}}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Monthly Expenses</span>
                        <span className="font-medium text-red-600">₹{financialData.monthlyExpenses.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 bg-red-500 rounded-full" 
                          style={{
                            width: `${financialData.monthlyIncome > 0 ? (financialData.monthlyExpenses / financialData.monthlyIncome) * 100 : 0}%`
                          }}
                        ></div>
                      </div>
                    </div>
                    
                    {financialData.monthlyDebtPayments > 0 && (
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Debt Payments</span>
                          <span className="font-medium text-orange-600">₹{financialData.monthlyDebtPayments.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 bg-orange-500 rounded-full" 
                            style={{
                              width: `${financialData.monthlyIncome > 0 ? (financialData.monthlyDebtPayments / financialData.monthlyIncome) * 100 : 0}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-600 font-medium">Expense Ratio</p>
                        <p className="text-xl font-bold text-blue-900">
                          {financialData.monthlyIncome > 0 ? ((financialData.monthlyExpenses / financialData.monthlyIncome) * 100).toFixed(1) : 0}%
                        </p>
                      </div>
                      <div className="text-blue-500">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-purple-600 font-medium">Total Entries</p>
                        <p className="text-xl font-bold text-purple-900">
                          {financialData.incomeCount + financialData.expenseCount + financialData.investmentCount + financialData.debtCount}
                        </p>
                      </div>
                      <div className="text-purple-500">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Budget Status */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Budget Status</h2>
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                {financialData.userHasBudget ? (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-gray-700">This Month</span>
                      <Link href="/budget" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                        Manage →
                      </Link>
                    </div>
                    <div className="text-center mb-4">
                      <p className="text-3xl font-bold text-purple-600 mb-2">
                        ₹{(financialData.budgetLimit - financialData.budgetUsed).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">Remaining</p>
                    </div>
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600">Used</span>
                        <span className="font-medium">{((financialData.budgetUsed / financialData.budgetLimit) * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            (financialData.budgetUsed / financialData.budgetLimit) > 0.9 ? 'bg-red-500' :
                            (financialData.budgetUsed / financialData.budgetLimit) > 0.7 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min((financialData.budgetUsed / financialData.budgetLimit) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                      ₹{financialData.budgetUsed.toLocaleString()} of ₹{financialData.budgetLimit.toLocaleString()} used
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Budget Set</h3>
                    <p className="text-gray-600 text-sm mb-4">Create budgets to track your spending</p>
                    <Link href="/budget/create" className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
                      Create Budget
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION E — Financial Analytics Charts */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Financial Analytics</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Expenses Breakdown Pie Chart */}
            <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-100 h-fit">
              {Object.keys(financialData.expensesByCategory || {}).length > 0 ? (
                <PieChart 
                  data={financialData.expensesByCategory} 
                  title="Expenses by Category" 
                />
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">No Expense Data</h3>
                  <p className="text-gray-600 text-xs mb-3">Add expenses to see breakdown</p>
                  <Link href="/expenses/new" className="text-blue-600 hover:text-blue-800 font-medium text-xs">
                    Add Expense →
                  </Link>
                </div>
              )}
            </div>

            {/* Monthly Trends Bar Chart */}
            <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-100 h-fit">
              {financialData.monthlyTrends && financialData.monthlyTrends.length > 0 ? (
                <BarChart 
                  data={financialData.monthlyTrends} 
                  title="6-Month Income vs Expenses Trend" 
                />
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">No Trend Data</h3>
                  <p className="text-gray-600 text-xs mb-3">Add transactions to see trends</p>
                  <div className="space-x-2 text-xs">
                    <Link href="/income/new" className="text-green-600 hover:text-green-800 font-medium">
                      Add Income
                    </Link>
                    <span className="text-gray-400">|</span>
                    <Link href="/expenses/new" className="text-red-600 hover:text-red-800 font-medium">
                      Add Expense
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Need vs Want vs Unsure Pie Chart */}
            <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-100 h-fit">
              {Object.values(financialData.needWantBreakdown || {}).some(val => val > 0) ? (
                <PieChart 
                  data={financialData.needWantBreakdown} 
                  title="Need vs Want vs Unsure" 
                />
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">No Spending Data</h3>
                  <p className="text-gray-600 text-xs mb-3">Add expenses to see need vs want analysis</p>
                  <Link href="/expenses/new" className="text-blue-600 hover:text-blue-800 font-medium text-xs">
                    Add Expense →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}