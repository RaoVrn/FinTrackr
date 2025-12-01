// Investment utility functions for calculations and data processing

/**
 * Calculate CAGR (Compound Annual Growth Rate)
 * @param {number} initialValue - Initial investment amount
 * @param {number} finalValue - Final investment value
 * @param {Date} startDate - Purchase date
 * @param {Date} endDate - Current date (optional)
 * @returns {number} CAGR percentage
 */
export function calculateCAGR(initialValue, finalValue, startDate, endDate = new Date()) {
  if (initialValue <= 0 || finalValue <= 0) return 0;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const years = getYearsDifference(start, end);
  
  if (years <= 0) return 0;
  
  return (Math.pow(finalValue / initialValue, 1 / years) - 1) * 100;
}

/**
 * Calculate P&L (Profit & Loss)
 * @param {number} currentValue - Current investment value
 * @param {number} investedAmount - Total invested amount
 * @returns {Object} P&L amount and percentage
 */
export function calculatePnL(currentValue, investedAmount) {
  const pnlAmount = currentValue - investedAmount;
  const pnlPercent = investedAmount > 0 ? (pnlAmount / investedAmount) * 100 : 0;
  
  return {
    amount: pnlAmount,
    percent: pnlPercent
  };
}

/**
 * Calculate years difference between two dates
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {number} Years difference
 */
export function getYearsDifference(startDate, endDate = new Date()) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(diffDays / 365.25, 1/365.25); // Minimum 1 day
}

/**
 * Group investments by asset type for allocation
 * @param {Array} investments - Array of investments
 * @returns {Array} Asset allocation data
 */
export function calculateAssetAllocation(investments) {
  const allocation = investments.reduce((acc, investment) => {
    const type = investment.type;
    if (!acc[type]) {
      acc[type] = {
        type,
        totalInvested: 0,
        currentValue: 0,
        count: 0,
        pnl: 0
      };
    }
    
    acc[type].totalInvested += investment.investedAmount || 0;
    acc[type].currentValue += investment.currentValue || 0;
    acc[type].count += 1;
    acc[type].pnl += (investment.currentValue || 0) - (investment.investedAmount || 0);
    
    return acc;
  }, {});
  
  const totalValue = Object.values(allocation).reduce((sum, item) => sum + item.currentValue, 0);
  
  return Object.values(allocation).map(item => ({
    ...item,
    percentage: totalValue > 0 ? (item.currentValue / totalValue) * 100 : 0,
    pnlPercent: item.totalInvested > 0 ? (item.pnl / item.totalInvested) * 100 : 0
  })).sort((a, b) => b.currentValue - a.currentValue);
}

/**
 * Calculate portfolio summary metrics
 * @param {Array} investments - Array of investments
 * @returns {Object} Portfolio summary
 */
export function calculatePortfolioSummary(investments) {
  const summary = investments.reduce((acc, investment) => {
    acc.totalInvested += investment.investedAmount || 0;
    acc.currentValue += investment.currentValue || 0;
    acc.count += 1;
    
    if (investment.isSIP) {
      acc.sipCount += 1;
      acc.totalSIPInvested += investment.investedAmount || 0;
    }
    
    return acc;
  }, {
    totalInvested: 0,
    currentValue: 0,
    count: 0,
    sipCount: 0,
    totalSIPInvested: 0
  });
  
  summary.totalPnL = summary.currentValue - summary.totalInvested;
  summary.pnlPercent = summary.totalInvested > 0 ? 
    (summary.totalPnL / summary.totalInvested) * 100 : 0;
  
  return summary;
}

/**
 * Filter investments based on criteria
 * @param {Array} investments - Array of investments
 * @param {Object} filters - Filter criteria
 * @returns {Array} Filtered investments
 */
export function filterInvestments(investments, filters = {}) {
  return investments.filter(investment => {
    // Type filter
    if (filters.type && filters.type !== 'all' && investment.type !== filters.type) {
      return false;
    }
    
    // Risk level filter
    if (filters.riskLevel && investment.riskLevel !== filters.riskLevel) {
      return false;
    }
    
    // Category filter
    if (filters.category && 
        !investment.category?.toLowerCase().includes(filters.category.toLowerCase())) {
      return false;
    }
    
    // Search filter (name, ticker symbol, or sector)
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const searchableFields = [
        investment.name,
        investment.tickerSymbol,
        investment.sector,
        investment.category
      ].filter(Boolean);
      
      if (!searchableFields.some(field => 
        field.toLowerCase().includes(searchTerm)
      )) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Sort investments by given criteria
 * @param {Array} investments - Array of investments
 * @param {string} sortBy - Sort criteria
 * @param {string} sortOrder - Sort order (asc/desc)
 * @returns {Array} Sorted investments
 */
export function sortInvestments(investments, sortBy = 'createdAt', sortOrder = 'desc') {
  return [...investments].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'name':
        aValue = a.name?.toLowerCase() || '';
        bValue = b.name?.toLowerCase() || '';
        break;
      case 'investedAmount':
        aValue = a.investedAmount || 0;
        bValue = b.investedAmount || 0;
        break;
      case 'currentValue':
        aValue = a.currentValue || 0;
        bValue = b.currentValue || 0;
        break;
      case 'pnl':
        aValue = a.pnl || 0;
        bValue = b.pnl || 0;
        break;
      case 'pnlPercent':
        aValue = a.pnlPercent || 0;
        bValue = b.pnlPercent || 0;
        break;
      case 'cagr':
        aValue = a.cagr || 0;
        bValue = b.cagr || 0;
        break;
      case 'purchaseDate':
        aValue = new Date(a.purchaseDate || 0);
        bValue = new Date(b.purchaseDate || 0);
        break;
      case 'createdAt':
      default:
        aValue = new Date(a.createdAt || 0);
        bValue = new Date(b.createdAt || 0);
        break;
    }
    
    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });
}

/**
 * Format currency value
 * @param {number} value - Numeric value
 * @param {string} currency - Currency symbol
 * @returns {string} Formatted currency string
 */
export function formatCurrency(value, currency = '₹') {
  if (typeof value !== 'number') return `${currency}0`;
  
  return `${currency}${value.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })}`;
}

/**
 * Format percentage value
 * @param {number} value - Percentage value
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage string
 */
export function formatPercent(value, decimals = 2) {
  if (typeof value !== 'number') return '0.00%';
  
  return `${value.toFixed(decimals)}%`;
}

/**
 * Get investment type display name
 * @param {string} type - Investment type
 * @returns {string} Display name
 */
export function getInvestmentTypeDisplayName(type) {
  const typeMap = {
    'stocks': 'Stocks',
    'mutual-fund': 'Mutual Funds',
    'crypto': 'Cryptocurrency',
    'bonds': 'Bonds',
    'real-estate': 'Real Estate',
    'etf': 'ETF',
    'gold': 'Gold',
    'ppf': 'PPF',
    'nps': 'NPS',
    'custom': 'Custom'
  };
  
  return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1);
}

/**
 * Get risk level color class
 * @param {string} riskLevel - Risk level
 * @returns {string} CSS class name
 */
export function getRiskLevelColor(riskLevel) {
  const colorMap = {
    'low': 'bg-green-100 text-green-800',
    'moderate': 'bg-yellow-100 text-yellow-800',
    'high': 'bg-red-100 text-red-800'
  };
  
  return colorMap[riskLevel] || 'bg-gray-100 text-gray-800';
}

/**
 * Get P&L color class
 * @param {number} pnl - P&L value
 * @returns {string} CSS class name
 */
export function getPnLColor(pnl) {
  if (pnl > 0) return 'text-green-600';
  if (pnl < 0) return 'text-red-600';
  return 'text-gray-600';
}

/**
 * Calculate SIP metrics
 * @param {Array} sipTransactions - SIP transaction array
 * @param {number} currentValue - Current investment value
 * @returns {Object} SIP metrics
 */
export function calculateSIPMetrics(sipTransactions, currentValue) {
  if (!sipTransactions || sipTransactions.length === 0) {
    return {
      totalTransactions: 0,
      totalInvested: 0,
      totalUnits: 0,
      averageNav: 0,
      currentValue: 0,
      pnl: 0,
      pnlPercent: 0
    };
  }
  
  const totalInvested = sipTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalUnits = sipTransactions.reduce((sum, t) => sum + (t.units || 0), 0);
  const averageNav = totalInvested > 0 && totalUnits > 0 ? totalInvested / totalUnits : 0;
  const pnl = currentValue - totalInvested;
  const pnlPercent = totalInvested > 0 ? (pnl / totalInvested) * 100 : 0;
  
  return {
    totalTransactions: sipTransactions.length,
    totalInvested,
    totalUnits,
    averageNav,
    currentValue,
    pnl,
    pnlPercent
  };
}