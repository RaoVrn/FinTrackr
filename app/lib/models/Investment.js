import mongoose from 'mongoose';

const investmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxLength: [100, 'Title cannot exceed 100 characters']
  },
  type: {
    type: String,
    required: [true, 'Investment type is required'],
    enum: ['Stocks', 'Mutual Funds', 'ETFs', 'Bonds', 'Fixed Deposits', 'PPF', 'ELSS', 'Real Estate', 'Cryptocurrency', 'Gold', 'Other']
  },
  symbol: {
    type: String,
    trim: true,
    maxLength: [20, 'Symbol cannot exceed 20 characters']
  },
  platform: {
    type: String,
    required: [true, 'Platform is required'],
    trim: true,
    maxLength: [100, 'Platform cannot exceed 100 characters']
  },
  investedAmount: {
    type: Number,
    required: [true, 'Invested amount is required'],
    min: [0, 'Amount must be positive']
  },
  currentValue: {
    type: Number,
    required: [true, 'Current value is required'],
    min: [0, 'Value must be positive']
  },
  quantity: {
    type: Number,
    min: [0, 'Quantity must be positive']
  },
  purchasePrice: {
    type: Number,
    min: [0, 'Purchase price must be positive']
  },
  currentPrice: {
    type: Number,
    min: [0, 'Current price must be positive']
  },
  purchaseDate: {
    type: Date,
    required: [true, 'Purchase date is required']
  },
  maturityDate: {
    type: Date
  },
  expectedReturn: {
    type: Number,
    min: [-100, 'Return cannot be less than -100%'],
    max: [1000, 'Return cannot exceed 1000%']
  },
  riskLevel: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  category: {
    type: String,
    enum: ['Growth', 'Value', 'Income', 'Balanced', 'Speculative'],
    default: 'Balanced'
  },
  description: {
    type: String,
    trim: true,
    maxLength: [500, 'Description cannot exceed 500 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  transactions: [{
    type: {
      type: String,
      enum: ['Buy', 'Sell', 'Dividend', 'Split', 'Bonus'],
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    note: String
  }]
}, {
  timestamps: true
});

// Index for faster queries
investmentSchema.index({ userId: 1, createdAt: -1 });
investmentSchema.index({ userId: 1, type: 1 });
investmentSchema.index({ userId: 1, isActive: 1 });
investmentSchema.index({ userId: 1, symbol: 1 });

// Virtual for profit/loss amount
investmentSchema.virtual('profitLoss').get(function() {
  return this.currentValue - this.investedAmount;
});

// Virtual for profit/loss percentage
investmentSchema.virtual('profitLossPercentage').get(function() {
  if (this.investedAmount === 0) return 0;
  return ((this.currentValue - this.investedAmount) / this.investedAmount) * 100;
});

// Virtual for days held
investmentSchema.virtual('daysHeld').get(function() {
  const now = new Date();
  const purchaseDate = new Date(this.purchaseDate);
  const diffTime = Math.abs(now - purchaseDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for annualized return
investmentSchema.virtual('annualizedReturn').get(function() {
  const days = this.daysHeld;
  if (days === 0) return 0;
  
  const years = days / 365;
  const totalReturn = this.profitLossPercentage / 100;
  
  return (Math.pow(1 + totalReturn, 1 / years) - 1) * 100;
});

// Method to add transaction
investmentSchema.methods.addTransaction = function(type, quantity, price, note = '') {
  const amount = quantity * price;
  
  this.transactions.push({
    type,
    quantity,
    price,
    amount,
    date: new Date(),
    note
  });
  
  // Update investment based on transaction type
  if (type === 'Buy') {
    this.investedAmount += amount;
    if (this.quantity) {
      this.quantity += quantity;
    } else {
      this.quantity = quantity;
    }
    this.purchasePrice = price; // Update to latest purchase price
  } else if (type === 'Sell') {
    if (this.quantity) {
      this.quantity = Math.max(0, this.quantity - quantity);
    }
    // Reduce invested amount proportionally
    const sellRatio = quantity / (this.quantity + quantity);
    this.investedAmount = Math.max(0, this.investedAmount - (this.investedAmount * sellRatio));
  }
  
  return this.save();
};

// Method to update current value
investmentSchema.methods.updateCurrentValue = function(newPrice) {
  this.currentPrice = newPrice;
  if (this.quantity) {
    this.currentValue = this.quantity * newPrice;
  }
  return this.save();
};

export default mongoose.models.Investment || mongoose.model('Investment', investmentSchema);