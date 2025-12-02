// Budget calculation and utility functions

/**
 * Calculate remaining budget amount
 * @param {number} amount - Budget amount
 * @param {number} spent - Amount spent
 * @param {number} rolloverAmount - Rollover amount from previous period
 * @returns {number} Remaining amount
 */
export function calculateRemaining(amount, spent, rolloverAmount = 0) {
  return Math.max(0, amount - spent + rolloverAmount);
}

/**
 * Check if budget is exceeded
 * @param {number} amount - Budget amount
 * @param {number} spent - Amount spent
 * @returns {boolean} True if budget is exceeded
 */
export function isBudgetExceeded(amount, spent) {
  return spent > amount;
}

/**
 * Calculate budget progress percentage
 * @param {number} amount - Budget amount
 * @param {number} spent - Amount spent
 * @returns {number} Progress percentage (0-100+)
 */
export function calculateProgress(amount, spent) {
  if (amount === 0) return 0;
  return (spent / amount) * 100;
}

/**
 * Get first and last day of a given month
 * @param {Date|string} date - Date in the month
 * @returns {object} Object with firstDay and lastDay
 */
export function getFirstAndLastDayOfMonth(date) {
  const d = new Date(date);
  const firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  
  return { firstDay, lastDay };
}

/**
 * Get next month's first and last day
 * @param {Date|string} date - Current date
 * @returns {object} Object with firstDay and lastDay of next month
 */
export function getNextMonthRange(date) {
  const d = new Date(date);
  const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  const firstDay = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1);
  const lastDay = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0);
  
  return { firstDay, lastDay };
}

/**
 * Create recurring budget data for next month
 * @param {object} previousBudget - Previous budget object
 * @returns {object} New budget data for next month
 */
export function createRecurringBudget(previousBudget) {
  const { firstDay, lastDay } = getNextMonthRange(previousBudget.endDate);
  
  // Calculate rollover amount if enabled
  const rolloverAmount = previousBudget.rolloverEnabled && previousBudget.remaining > 0 
    ? previousBudget.remaining 
    : 0;
  
  return {
    name: previousBudget.name,
    category: previousBudget.category,
    amount: previousBudget.amount,
    startDate: firstDay,
    endDate: lastDay,
    isRecurring: previousBudget.isRecurring,
    rolloverEnabled: previousBudget.rolloverEnabled,
    rolloverAmount,
    spent: 0,
    priority: previousBudget.priority,
    notes: previousBudget.notes,
    alert50: previousBudget.alert50,
    alert75: previousBudget.alert75,
    alert100: previousBudget.alert100,
    alertExceeded: previousBudget.alertExceeded,
    userId: previousBudget.userId
  };
}

/**
 * Get budget progress color based on percentage
 * @param {number} progressPercentage - Progress percentage
 * @param {boolean} isOverBudget - Whether budget is exceeded
 * @returns {string} Color identifier
 */
export function getBudgetProgressColor(progressPercentage, isOverBudget = false) {
  if (isOverBudget) return 'red';
  if (progressPercentage >= 75) return 'red';
  if (progressPercentage >= 50) return 'orange';
  return 'green';
}

/**
 * Get budget status text
 * @param {number} progressPercentage - Progress percentage
 * @param {boolean} isOverBudget - Whether budget is exceeded
 * @returns {string} Status text
 */
export function getBudgetStatus(progressPercentage, isOverBudget = false) {
  if (isOverBudget) return 'Over Budget';
  if (progressPercentage >= 90) return 'Near Limit';
  if (progressPercentage >= 75) return 'On Track';
  return 'Under Budget';
}

/**
 * Check which alert thresholds have been crossed
 * @param {number} previousPercentage - Previous progress percentage
 * @param {number} currentPercentage - Current progress percentage
 * @param {object} alertSettings - Alert settings object
 * @returns {Array} Array of triggered alerts
 */
export function getTriggeredAlerts(previousPercentage, currentPercentage, alertSettings) {
  const alerts = [];
  
  if (alertSettings.alert50 && previousPercentage < 50 && currentPercentage >= 50) {
    alerts.push({ type: '50', message: '50% of budget used', percentage: 50 });
  }
  
  if (alertSettings.alert75 && previousPercentage < 75 && currentPercentage >= 75) {
    alerts.push({ type: '75', message: '75% of budget used', percentage: 75 });
  }
  
  if (alertSettings.alert100 && previousPercentage < 100 && currentPercentage >= 100) {
    alerts.push({ type: '100', message: 'Budget fully used', percentage: 100 });
  }
  
  return alerts;
}

/**
 * Check if expense date falls within budget period
 * @param {Date|string} expenseDate - Expense date
 * @param {Date|string} budgetStart - Budget start date
 * @param {Date|string} budgetEnd - Budget end date
 * @returns {boolean} True if expense is within budget period
 */
export function isExpenseInBudgetPeriod(expenseDate, budgetStart, budgetEnd) {
  const expense = new Date(expenseDate);
  const start = new Date(budgetStart);
  const end = new Date(budgetEnd);
  
  return expense >= start && expense <= end;
}

/**
 * Calculate budget summary for multiple budgets
 * @param {Array} budgets - Array of budget objects
 * @returns {object} Summary statistics
 */
export function calculateBudgetsSummary(budgets) {
  if (!Array.isArray(budgets) || budgets.length === 0) {
    return {
      totalBudget: 0,
      totalSpent: 0,
      totalRemaining: 0,
      categoriesCount: 0,
      overBudgetCount: 0,
      averageProgress: 0
    };
  }
  
  const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);
  const totalSpent = budgets.reduce((sum, budget) => sum + budget.spent, 0);
  const totalRemaining = budgets.reduce((sum, budget) => {
    const remaining = calculateRemaining(budget.amount, budget.spent, budget.rolloverAmount);
    return sum + remaining;
  }, 0);
  
  const categoriesCount = new Set(budgets.map(budget => budget.category)).size;
  const overBudgetCount = budgets.filter(budget => isBudgetExceeded(budget.amount, budget.spent)).length;
  
  const totalProgress = budgets.reduce((sum, budget) => {
    return sum + calculateProgress(budget.amount, budget.spent);
  }, 0);
  const averageProgress = budgets.length > 0 ? totalProgress / budgets.length : 0;
  
  return {
    totalBudget,
    totalSpent,
    totalRemaining,
    categoriesCount,
    overBudgetCount,
    averageProgress: Math.round(averageProgress * 100) / 100
  };
}

/**
 * Find budgets that need renewal (recurring budgets that have ended)
 * @param {Array} budgets - Array of budget objects
 * @param {Date} currentDate - Current date (default: now)
 * @returns {Array} Array of budgets that need renewal
 */
export function findBudgetsNeedingRenewal(budgets, currentDate = new Date()) {
  return budgets.filter(budget => {
    return budget.isRecurring && new Date(budget.endDate) < currentDate;
  });
}

/**
 * Format currency amount
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency symbol (default: ₹)
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, currency = '₹') {
  return `${currency}${amount.toLocaleString()}`;
}

/**
 * Validate budget data
 * @param {object} budgetData - Budget data to validate
 * @returns {object} Validation result with isValid and errors
 */
export function validateBudgetData(budgetData) {
  const errors = [];
  
  if (!budgetData.name || budgetData.name.trim().length === 0) {
    errors.push('Budget name is required');
  }
  
  if (!budgetData.category) {
    errors.push('Category is required');
  }
  
  if (!budgetData.amount || budgetData.amount <= 0) {
    errors.push('Budget amount must be positive');
  }
  
  if (!budgetData.startDate) {
    errors.push('Start date is required');
  }
  
  if (!budgetData.endDate) {
    errors.push('End date is required');
  }
  
  if (budgetData.startDate && budgetData.endDate) {
    const start = new Date(budgetData.startDate);
    const end = new Date(budgetData.endDate);
    if (start >= end) {
      errors.push('End date must be after start date');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Budget categories with display names
export const BUDGET_CATEGORIES = {
  food: 'Food & Dining',
  transport: 'Transportation',
  entertainment: 'Entertainment',
  shopping: 'Shopping',
  bills: 'Bills & Utilities',
  health: 'Health & Medical',
  education: 'Education',
  travel: 'Travel',
  others: 'Others'
};

// Priority levels
export const PRIORITY_LEVELS = {
  essential: 'Essential',
  flexible: 'Flexible',
  luxury: 'Luxury'
};

// Default alert thresholds
export const DEFAULT_ALERT_THRESHOLDS = {
  alert50: true,
  alert75: true,
  alert100: true,
  alertExceeded: true
};