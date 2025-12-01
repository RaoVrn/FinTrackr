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
    investmentCount: 0
  });

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
          ? (debtsResponse.value?.debts || debtsResponse.value || [])
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
    const totalDebtAmount = debtData.reduce((sum, debt) => sum + (debt.remainingAmount || debt.amount || 0), 0);
    const monthlyDebtPayments = debtData.reduce((sum, debt) => sum + (debt.monthlyPayment || debt.amount / 12 || 0), 0);

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

    // Health metrics calculations
    const emergencyFundRatio = monthlyExpenseAmount > 0 ? 
      (totalIncomeAmount - totalExpenseAmount - totalDebtAmount) / (monthlyExpenseAmount * 3) : 0;
    const debtToIncomeRatio = monthlyIncomeAmount > 0 ? monthlyDebtPayments / monthlyIncomeAmount : 0;
    const savingsRate = monthlyIncomeAmount > 0 ? 
      (monthlyIncomeAmount - monthlyExpenseAmount) / monthlyIncomeAmount : 0;

    // Calculate financial health score
    let healthScore = 0;
    let hasHealthData = false;

    // Only calculate health score if there's meaningful data
    if (monthlyIncomeAmount > 0 || monthlyExpenseAmount > 0 || totalDebtAmount > 0 || totalInvestmentValue > 0) {
      hasHealthData = true;
      
      // Emergency fund component (0-25 points)
      const emergencyScore = Math.min(Math.max(emergencyFundRatio, 0) * 25, 25);
      
      // Debt ratio component (0-25 points) - lower debt ratio is better
      const debtScore = Math.max(25 - (debtToIncomeRatio * 100), 0);
      
      // Savings rate component (0-25 points)
      const savingsScore = Math.min(Math.max(savingsRate, 0) * 50, 25);
      
      // Investment component (0-25 points)
      const investmentScore = totalInvestmentValue > 0 ? 
        Math.min((totalInvestmentValue / Math.max(totalIncomeAmount, 1000)) * 100, 25) : 0;
      
      healthScore = Math.round(emergencyScore + debtScore + savingsScore + investmentScore);
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
      investmentCount: investmentData.length
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-purple-400 border-b-transparent rounded-full animate-spin mx-auto" style={{animationDirection: 'reverse', animationDuration: '1s'}}></div>
          </div>
          <div className="space-y-2">
            <p className="text-gray-700 text-xl font-semibold">Loading your financial overview</p>
            <p className="text-gray-500 text-sm">Calculating your financial health...</p>
          </div>
        </div>
      </div>
    );
  }

  const netWorthDisplay = getNetWorthDisplay();
  const cashFlowDisplay = getCashFlowDisplay();
  const budgetStatus = getBudgetStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-emerald-400/20 to-blue-600/20 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
            Financial Dashboard
          </h1>
          <p className="text-gray-600 text-lg">Welcome back, {user?.name} 👋 Here's your complete financial picture</p>
        </div>

        {/* SECTION A — Financial Summary */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Financial Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
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

            {/* Cash Flow */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
                <span className="text-blue-100 text-sm font-medium">Cash Flow</span>
              </div>
              <p className="text-3xl font-bold mb-2">{cashFlowDisplay.amount}</p>
              {cashFlowDisplay.showMessage ? (
                <p className="text-blue-100 text-sm">{cashFlowDisplay.message}</p>
              ) : (
                <p className={`text-sm ${financialData.cashFlow > 0 ? 'text-green-200' : 'text-red-200'}`}>
                  {cashFlowDisplay.message}
                </p>
              )}
            </div>

            {/* Budget Status */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-2xl shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span className="text-purple-100 text-sm font-medium">Budget Status</span>
              </div>
              <p className="text-2xl font-bold mb-2">
                {budgetStatus.status === "none" ? "No Budget" : budgetStatus.message}
              </p>
              <div className="flex items-center justify-between">
                <p className="text-purple-100 text-sm">
                  {budgetStatus.status === "none" ? 
                    "Create your first budget" : 
                    `${((financialData.budgetUsed / financialData.budgetLimit) * 100).toFixed(0)}% used`
                  }
                </p>
                {budgetStatus.status !== "none" && (
                  <Link href="/budget" className="text-purple-100 hover:text-white text-sm underline">
                    Manage
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION B — Account Breakdown */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Account Breakdown</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Income */}
            <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">💰</span>
                </div>
                <Link href="/income" className="text-green-600 hover:text-green-700 text-sm font-medium">
                  View →
                </Link>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Income</h3>
              <p className="text-2xl font-bold text-gray-900 mb-1">
                ₹{financialData.monthlyIncome.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">
                {financialData.incomeCount > 0 ? 
                  `${financialData.incomeCount} sources this month` : 
                  'Add your first income'
                }
              </p>
            </div>

            {/* Expenses */}
            <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">💸</span>
                </div>
                <Link href="/expenses" className="text-red-600 hover:text-red-700 text-sm font-medium">
                  View →
                </Link>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Expenses</h3>
              <p className="text-2xl font-bold text-gray-900 mb-1">
                ₹{financialData.monthlyExpenses.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">
                {financialData.expenseCount > 0 ? 
                  `${financialData.expenseCount} transactions` : 
                  'No expenses recorded'
                }
              </p>
            </div>

            {/* Debts */}
            <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">💳</span>
                </div>
                <Link href="/debts" className="text-orange-600 hover:text-orange-700 text-sm font-medium">
                  View →
                </Link>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Debts</h3>
              <p className="text-2xl font-bold text-gray-900 mb-1">
                ₹{financialData.totalDebts.toLocaleString()}
              </p>
              <p className="text-sm text-orange-600">
                {financialData.totalDebts > 0 ? 
                  `₹${financialData.monthlyDebtPayments.toLocaleString()}/month` : 
                  'Debt-free 🎉'
                }
              </p>
            </div>

            {/* Investments */}
            <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">📈</span>
                </div>
                <Link href="/investments" className="text-purple-600 hover:text-purple-700 text-sm font-medium">
                  View →
                </Link>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Investments</h3>
              <p className="text-2xl font-bold text-gray-900 mb-1">
                ₹{financialData.totalInvestments.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">
                {financialData.investmentCount > 0 ? 
                  `${financialData.investmentCount} investments` : 
                  'Start investing'
                }
              </p>
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

        {/* SECTION D — Financial Health (conditional) */}
        {financialData.hasHealthData && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Financial Health</h2>
            <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-white/20">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Health Score Circle */}
                <div className="text-center">
                  <div className="w-32 h-32 mx-auto relative mb-4">
                    <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="#f3f4f6"
                        strokeWidth="6"
                        fill="none"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke={
                          financialData.financialHealthScore >= 80 ? "#10b981" : 
                          financialData.financialHealthScore >= 60 ? "#f59e0b" : "#ef4444"
                        }
                        strokeWidth="6"
                        fill="none"
                        strokeDasharray={251.2}
                        strokeDashoffset={251.2 - (financialData.financialHealthScore / 100) * 251.2}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl font-bold text-gray-900">{financialData.financialHealthScore}</span>
                    </div>
                  </div>
                  <p className="text-xl font-semibold text-gray-900 mb-2">
                    {financialData.financialHealthScore >= 80 ? 'Excellent' : 
                     financialData.financialHealthScore >= 60 ? 'Good' : 'Needs Work'}
                  </p>
                  <p className="text-gray-600">Overall Financial Health</p>
                </div>

                {/* Health Metrics */}
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-700 font-medium">Emergency Fund</span>
                      <span className={`text-sm font-medium ${
                        financialData.emergencyFundRatio >= 1 ? 'text-green-600' : 
                        financialData.emergencyFundRatio >= 0.5 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {financialData.emergencyFundRatio >= 1 ? 'Excellent' : 
                         financialData.emergencyFundRatio >= 0.5 ? 'Good' : 'Needs Attention'}
                      </span>
                    </div>
                    <div className="w-full h-3 bg-gray-200 rounded-full">
                      <div 
                        className={`h-3 rounded-full ${
                          financialData.emergencyFundRatio >= 1 ? 'bg-green-500' : 
                          financialData.emergencyFundRatio >= 0.5 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(financialData.emergencyFundRatio * 100, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {financialData.emergencyFundRatio >= 1 ? 
                        '3+ months of expenses covered' : 
                        'Build emergency fund to 3-6 months of expenses'
                      }
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-700 font-medium">Debt Ratio</span>
                      <span className={`text-sm font-medium ${
                        financialData.debtToIncomeRatio <= 0.2 ? 'text-green-600' : 
                        financialData.debtToIncomeRatio <= 0.4 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {financialData.debtToIncomeRatio <= 0.2 ? 'Excellent' : 
                         financialData.debtToIncomeRatio <= 0.4 ? 'Manageable' : 'High'}
                      </span>
                    </div>
                    <div className="w-full h-3 bg-gray-200 rounded-full">
                      <div 
                        className={`h-3 rounded-full ${
                          financialData.debtToIncomeRatio <= 0.2 ? 'bg-green-500' : 
                          financialData.debtToIncomeRatio <= 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(financialData.debtToIncomeRatio * 100, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {(financialData.debtToIncomeRatio * 100).toFixed(1)}% of income goes to debt payments
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-700 font-medium">Savings Rate</span>
                      <span className={`text-sm font-medium ${
                        financialData.savingsRate >= 0.2 ? 'text-green-600' : 
                        financialData.savingsRate >= 0.1 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {financialData.savingsRate >= 0.2 ? 'Excellent' : 
                         financialData.savingsRate >= 0.1 ? 'Good' : 'Improve'}
                      </span>
                    </div>
                    <div className="w-full h-3 bg-gray-200 rounded-full">
                      <div 
                        className={`h-3 rounded-full ${
                          financialData.savingsRate >= 0.2 ? 'bg-green-500' : 
                          financialData.savingsRate >= 0.1 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(Math.abs(financialData.savingsRate) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {financialData.savingsRate >= 0 ? 
                        `Saving ${(financialData.savingsRate * 100).toFixed(1)}% of income` :
                        `Spending ${Math.abs(financialData.savingsRate * 100).toFixed(1)}% more than earning`
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION E — Charts (placeholder) */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Financial Insights</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Category Distribution Placeholder */}
            <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Categories</h3>
              <div className="h-48 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                  </svg>
                  <p className="text-gray-500">Pie chart coming soon</p>
                  <p className="text-sm text-gray-400">Category distribution</p>
                </div>
              </div>
            </div>

            {/* Monthly Trend Placeholder */}
            <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trends</h3>
              <div className="h-48 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p className="text-gray-500">Charts coming soon</p>
                  <p className="text-sm text-gray-400">Income vs expenses over time</p>
                </div>
              </div>
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