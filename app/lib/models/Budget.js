import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema({
  // BASIC INFO
  name: {
    type: String,
    required: [true, 'Budget name is required'],
    trim: true,
    maxLength: [100, 'Name cannot exceed 100 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    maxlength: [50, 'Category name cannot exceed 50 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Budget amount is required'],
    min: [1, 'Budget amount must be positive']
  },
  
  // TIME PERIOD
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  rolloverEnabled: {
    type: Boolean,
    default: false
  },
  
  // SPENDING DETAILS
  spent: {
    type: Number,
    default: 0,
    min: [0, 'Spent amount cannot be negative']
  },
  rolloverAmount: {
    type: Number,
    default: 0
  },
  
  // PRIORITY & NOTES
  priority: {
    type: String,
    enum: ['essential', 'flexible', 'luxury'],
    default: 'essential'
  },
  notes: {
    type: String,
    trim: true,
    maxLength: [500, 'Notes cannot exceed 500 characters']
  },
  
  // ALERTS
  alert50: {
    type: Boolean,
    default: true
  },
  alert75: {
    type: Boolean,
    default: true
  },
  alert100: {
    type: Boolean,
    default: true
  },
  alertExceeded: {
    type: Boolean,
    default: true
  },
  
  // META
  userId: {
    type: String,
    required: [true, 'User ID is required']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for performance
budgetSchema.index({ userId: 1, createdAt: -1 });
budgetSchema.index({ userId: 1, category: 1 });
budgetSchema.index({ userId: 1, startDate: 1, endDate: 1 });
budgetSchema.index({ userId: 1, isRecurring: 1 });

// Virtual for remaining amount
budgetSchema.virtual('remaining').get(function() {
  return this.amount - this.spent + this.rolloverAmount;
});

// Virtual for budget progress percentage
budgetSchema.virtual('progressPercentage').get(function() {
  if (this.amount === 0) return 0;
  return Math.min(100, (this.spent / this.amount) * 100);
});

// Virtual for over budget status
budgetSchema.virtual('isOverBudget').get(function() {
  return this.spent > this.amount;
});

// Virtual for budget status
budgetSchema.virtual('status').get(function() {
  const percentage = this.progressPercentage;
  if (this.isOverBudget) return 'Over Budget';
  if (percentage >= 90) return 'Near Limit';
  if (percentage >= 75) return 'On Track';
  return 'Under Budget';
});

// Virtual for alert status
budgetSchema.virtual('alertStatus').get(function() {
  const percentage = this.progressPercentage;
  const alerts = [];
  
  if (this.isOverBudget && this.alertExceeded) {
    alerts.push({ type: 'exceeded', message: 'Budget exceeded!' });
  } else if (percentage >= 100 && this.alert100) {
    alerts.push({ type: '100', message: '100% budget used' });
  } else if (percentage >= 75 && this.alert75) {
    alerts.push({ type: '75', message: '75% budget used' });
  } else if (percentage >= 50 && this.alert50) {
    alerts.push({ type: '50', message: '50% budget used' });
  }
  
  return alerts;
});

// Method to update spending
budgetSchema.methods.addExpense = function(expenseAmount) {
  this.spent += expenseAmount;
  this.updateCalculatedFields();
  return this.save();
};

// Method to remove spending (for expense deletion)
budgetSchema.methods.removeExpense = function(expenseAmount) {
  this.spent = Math.max(0, this.spent - expenseAmount);
  this.updateCalculatedFields();
  return this.save();
};

// Method to set spending directly
budgetSchema.methods.setSpent = function(newSpentAmount) {
  this.spent = Math.max(0, newSpentAmount);
  this.updateCalculatedFields();
  return this.save();
};

// Method to update calculated fields
budgetSchema.methods.updateCalculatedFields = function() {
  // This will trigger virtual getters when accessed
  return this;
};

// Helper method to calculate status
budgetSchema.methods.calculateStatus = function() {
  const percentage = this.progressPercentage;
  if (this.isOverBudget) return 'exceeded';
  if (percentage >= 90) return 'nearLimit';
  if (percentage >= 75) return 'onTrack';
  return 'underBudget';
};

// Static method to find budget for expense
budgetSchema.statics.findForExpense = function(userId, category, date) {
  const expenseDate = new Date(date);
  
  // Create multiple search patterns for better matching
  const searchPatterns = [
    { category: category }, // Exact match
    { category: { $regex: new RegExp(`^${category.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}$`, 'i') } }, // Case insensitive exact match
  ];
  
  // Add variations for common category formats
  if (category.toLowerCase() === 'food & dining') {
    searchPatterns.push({ category: 'food' });
    searchPatterns.push({ category: 'Food' });
  } else if (category.toLowerCase() === 'food') {
    searchPatterns.push({ category: 'Food & Dining' });
  }
  
  return this.findOne({
    userId,
    $and: [
      { $or: searchPatterns },
      { startDate: { $lte: expenseDate } },
      { endDate: { $gte: expenseDate } },
      {
        $or: [
          { isActive: true },
          { isActive: { $exists: false } } // Handle budgets created before isActive field was added
        ]
      }
    ]
  });
};

// Method to check if budget is within date range
budgetSchema.methods.isWithinPeriod = function(date) {
  const checkDate = new Date(date);
  return checkDate >= this.startDate && checkDate <= this.endDate;
};

// Method to get progress bar color
budgetSchema.methods.getProgressColor = function() {
  const percentage = this.progressPercentage;
  if (this.isOverBudget) return 'red';
  if (percentage >= 75) return 'red';
  if (percentage >= 50) return 'orange';
  return 'green';
};

// Pre-save middleware to validate dates
budgetSchema.pre('save', function(next) {
  if (this.startDate >= this.endDate) {
    const error = new Error('End date must be after start date');
    error.code = 'INVALID_DATE_RANGE';
    return next(error);
  }
  next();
});

// Static method to create recurring budget for next month
budgetSchema.statics.createRecurringBudget = function(previousBudget) {
  const nextMonth = new Date(previousBudget.endDate);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  
  const startDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1);
  const endDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0);
  
  const rolloverAmount = previousBudget.rolloverEnabled && previousBudget.remaining > 0 
    ? previousBudget.remaining 
    : 0;
  
  return new this({
    name: previousBudget.name,
    category: previousBudget.category,
    amount: previousBudget.amount,
    startDate,
    endDate,
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
  });
};

// Static method to get budgets for current month
budgetSchema.statics.getCurrentMonthBudgets = function(userId) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  return this.find({
    userId,
    startDate: { $lte: endOfMonth },
    endDate: { $gte: startOfMonth }
  });
};

export default mongoose.models.Budget || mongoose.model('Budget', budgetSchema);