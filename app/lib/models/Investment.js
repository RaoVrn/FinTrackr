import mongoose from 'mongoose';

const investmentSchema = new mongoose.Schema({
  // BASIC INFO
  name: {
    type: String,
    required: [true, 'Investment name is required'],
    trim: true,
    maxLength: [100, 'Name cannot exceed 100 characters']
  },
  type: {
    type: String,
    required: [true, 'Investment type is required'],
    enum: ['stocks', 'mutual-fund', 'crypto', 'bonds', 'real-estate', 'etf', 'gold', 'ppf', 'nps', 'custom']
  },
  category: {
    type: String,
    trim: true,
    maxLength: [50, 'Category cannot exceed 50 characters']
  },
  sector: {
    type: String,
    trim: true,
    maxLength: [50, 'Sector cannot exceed 50 characters']
  },
  riskLevel: {
    type: String,
    enum: ['low', 'moderate', 'high'],
    default: 'moderate'
  },
  tags: [{
    type: String,
    trim: true,
    maxLength: [30, 'Tag cannot exceed 30 characters']
  }],

  // PURCHASE DETAILS
  purchaseDate: {
    type: Date,
    required: [true, 'Purchase date is required']
  },
  investedAmount: {
    type: Number,
    required: [true, 'Invested amount is required'],
    min: [0, 'Amount must be positive']
  },
  quantity: {
    type: Number,
    min: [0, 'Quantity must be positive']
  },
  pricePerUnit: {
    type: Number,
    min: [0, 'Price per unit must be positive']
  },
  fees: {
    type: Number,
    default: 0,
    min: [0, 'Fees cannot be negative']
  },

  // CURRENT DETAILS
  currentValue: {
    type: Number,
    required: [true, 'Current value is required'],
    min: [0, 'Value must be positive']
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },

  // RETURN METRICS (computed)
  pnl: {
    type: Number,
    default: 0
  },
  pnlPercent: {
    type: Number,
    default: 0
  },
  cagr: {
    type: Number,
    default: 0
  },

  // SIP SUPPORT
  isSIP: {
    type: Boolean,
    default: false
  },
  sipAmount: {
    type: Number,
    min: [0, 'SIP amount must be positive']
  },
  sipStartDate: {
    type: Date
  },
  sipFrequency: {
    type: String,
    enum: ['monthly', 'weekly']
  },

  // OPTIONAL FIELDS
  expectedSellDate: {
    type: Date
  },
  attachmentUrl: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true,
    maxLength: [1000, 'Notes cannot exceed 1000 characters']
  },
  tickerSymbol: {
    type: String,
    trim: true,
    maxLength: [20, 'Ticker symbol cannot exceed 20 characters']
  },
  isin: {
    type: String,
    trim: true,
    maxLength: [12, 'ISIN cannot exceed 12 characters']
  },

  // USER
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // SIP TRANSACTIONS
  sipTransactions: [{
    amount: {
      type: Number,
      required: true,
      min: [0, 'Amount must be positive']
    },
    date: {
      type: Date,
      required: true
    },
    units: {
      type: Number,
      min: [0, 'Units must be positive']
    },
    nav: {
      type: Number,
      min: [0, 'NAV must be positive']
    },
    note: String
  }]
}, {
  timestamps: true
});

// Index for faster queries
investmentSchema.index({ userId: 1, createdAt: -1 });
investmentSchema.index({ userId: 1, type: 1 });
investmentSchema.index({ userId: 1, riskLevel: 1 });
investmentSchema.index({ userId: 1, tickerSymbol: 1 });
investmentSchema.index({ userId: 1, isSIP: 1 });

// Helper function to calculate years difference
function getYearsDifference(startDate, endDate = new Date()) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(diffDays / 365.25, 1/365.25); // Minimum 1 day
}

// Pre-save middleware to calculate P&L and CAGR
investmentSchema.pre('save', function(next) {
  // Calculate P&L
  this.pnl = this.currentValue - this.investedAmount;
  
  // Calculate P&L percentage
  if (this.investedAmount > 0) {
    this.pnlPercent = (this.pnl / this.investedAmount) * 100;
  } else {
    this.pnlPercent = 0;
  }
  
  // Calculate CAGR
  if (this.investedAmount > 0 && this.currentValue > 0) {
    const years = getYearsDifference(this.purchaseDate);
    this.cagr = (Math.pow(this.currentValue / this.investedAmount, 1 / years) - 1) * 100;
  } else {
    this.cagr = 0;
  }
  
  // Update lastUpdated timestamp
  this.lastUpdated = new Date();
  
  next();
});

// Virtual for days held
investmentSchema.virtual('daysHeld').get(function() {
  const now = new Date();
  const purchaseDate = new Date(this.purchaseDate);
  const diffTime = Math.abs(now - purchaseDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for total SIP invested amount
investmentSchema.virtual('totalSIPInvested').get(function() {
  if (!this.isSIP || !this.sipTransactions) return 0;
  return this.sipTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
});

// Method to add SIP transaction
investmentSchema.methods.addSIPTransaction = function(amount, nav, units, note = '') {
  if (!this.isSIP) {
    throw new Error('This is not a SIP investment');
  }
  
  const transaction = {
    amount,
    date: new Date(),
    units: units || (amount / nav),
    nav,
    note
  };
  
  this.sipTransactions.push(transaction);
  
  // Update investment totals
  this.investedAmount += amount;
  if (this.quantity) {
    this.quantity += transaction.units;
  } else {
    this.quantity = transaction.units;
  }
  
  return this.save();
};

// Method to update current value and recalculate metrics
investmentSchema.methods.updateCurrentValue = function(newValue, currentPrice = null) {
  this.currentValue = newValue;
  
  if (currentPrice && this.quantity) {
    this.pricePerUnit = currentPrice;
  }
  
  return this.save();
};

// Static method to get portfolio summary
investmentSchema.statics.getPortfolioSummary = async function(userId, filters = {}) {
  try {
    const matchStage = { userId: new mongoose.Types.ObjectId(userId) };
    
    // Apply filters
    if (filters.type && filters.type !== 'all') {
      matchStage.type = filters.type;
    }
    if (filters.riskLevel && filters.riskLevel !== 'all') {
      matchStage.riskLevel = filters.riskLevel;
    }
    if (filters.category) {
      matchStage.category = { $regex: filters.category, $options: 'i' };
    }
    if (filters.search) {
      matchStage.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { tickerSymbol: { $regex: filters.search, $options: 'i' } }
      ];
    }
    
    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalInvested: { $sum: '$investedAmount' },
          currentValue: { $sum: '$currentValue' },
          totalPnL: { $sum: '$pnl' },
          portfolioCount: { $sum: 1 },
          investments: { $push: '$$ROOT' }
        }
      },
      {
        $project: {
          _id: 0,
          totalInvested: 1,
          currentValue: 1,
          totalPnL: 1,
          portfolioCount: 1,
          investments: 1,
          pnlPercent: {
            $cond: [
              { $eq: ['$totalInvested', 0] },
              0,
              { $multiply: [{ $divide: ['$totalPnL', '$totalInvested'] }, 100] }
            ]
          }
        }
      }
    ];
    
    const result = await this.aggregate(pipeline);
    return result[0] || {
      totalInvested: 0,
      currentValue: 0,
      totalPnL: 0,
      portfolioCount: 0,
      pnlPercent: 0,
      investments: []
    };
  } catch (error) {
    console.error('Error in getPortfolioSummary:', error);
    return {
      totalInvested: 0,
      currentValue: 0,
      totalPnL: 0,
      portfolioCount: 0,
      pnlPercent: 0,
      investments: []
    };
  }
};

// Static method to get asset allocation
investmentSchema.statics.getAssetAllocation = async function(userId) {
  const pipeline = [
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$type',
        totalInvested: { $sum: '$investedAmount' },
        currentValue: { $sum: '$currentValue' },
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        type: '$_id',
        totalInvested: 1,
        currentValue: 1,
        count: 1,
        _id: 0
      }
    }
  ];
  
  return await this.aggregate(pipeline);
};

const Investment = mongoose.models.Investment || mongoose.model('Investment', investmentSchema);

// Ensure static methods are available
if (!Investment.getPortfolioSummary) {
  console.log('Warning: getPortfolioSummary static method not found on Investment model');
}

export default Investment;