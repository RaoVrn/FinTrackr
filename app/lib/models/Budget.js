import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Budget name is required'],
    trim: true,
    maxLength: [100, 'Name cannot exceed 100 characters']
  },
  period: {
    type: String,
    required: [true, 'Budget period is required'],
    enum: ['Monthly', 'Quarterly', 'Yearly'],
    default: 'Monthly'
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  totalBudget: {
    type: Number,
    required: [true, 'Total budget is required'],
    min: [0, 'Budget must be positive']
  },
  categories: [{
    name: {
      type: String,
      required: true,
      enum: ['Food & Dining', 'Groceries', 'Transport', 'Entertainment', 'Shopping', 
             'Bills & Utilities', 'Health & Medical', 'Education', 'Travel', 'Other']
    },
    budgetAmount: {
      type: Number,
      required: true,
      min: [0, 'Budget amount must be positive']
    },
    spentAmount: {
      type: Number,
      default: 0,
      min: [0, 'Spent amount must be positive']
    },
    alertThreshold: {
      type: Number,
      default: 80,
      min: [0, 'Threshold must be between 0-100'],
      max: [100, 'Threshold must be between 0-100']
    }
  }],
  description: {
    type: String,
    trim: true,
    maxLength: [500, 'Description cannot exceed 500 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  alertSettings: {
    emailAlerts: {
      type: Boolean,
      default: true
    },
    pushNotifications: {
      type: Boolean,
      default: true
    },
    dailyDigest: {
      type: Boolean,
      default: false
    }
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for faster queries
budgetSchema.index({ userId: 1, createdAt: -1 });
budgetSchema.index({ userId: 1, isActive: 1 });
budgetSchema.index({ userId: 1, startDate: 1, endDate: 1 });

// Virtual for total spent amount
budgetSchema.virtual('totalSpent').get(function() {
  return this.categories.reduce((total, category) => total + category.spentAmount, 0);
});

// Virtual for budget utilization percentage
budgetSchema.virtual('utilizationPercentage').get(function() {
  if (this.totalBudget === 0) return 0;
  return (this.totalSpent / this.totalBudget) * 100;
});

// Virtual for remaining budget
budgetSchema.virtual('remainingBudget').get(function() {
  return Math.max(0, this.totalBudget - this.totalSpent);
});

// Virtual for budget status
budgetSchema.virtual('status').get(function() {
  const utilization = this.utilizationPercentage;
  if (utilization >= 100) return 'Over Budget';
  if (utilization >= 90) return 'Near Limit';
  if (utilization >= 70) return 'On Track';
  return 'Under Budget';
});

// Method to update category spending
budgetSchema.methods.updateCategorySpending = function(categoryName, amount) {
  const category = this.categories.find(cat => cat.name === categoryName);
  if (category) {
    category.spentAmount = Math.max(0, category.spentAmount + amount);
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to check if category is over threshold
budgetSchema.methods.getCategoryAlerts = function() {
  return this.categories.filter(category => {
    const utilization = (category.spentAmount / category.budgetAmount) * 100;
    return utilization >= category.alertThreshold;
  });
};

// Method to get category utilization
budgetSchema.methods.getCategoryUtilization = function(categoryName) {
  const category = this.categories.find(cat => cat.name === categoryName);
  if (!category || category.budgetAmount === 0) return 0;
  return (category.spentAmount / category.budgetAmount) * 100;
};

// Pre-save middleware to ensure categories don't exceed total budget
budgetSchema.pre('save', function(next) {
  const totalCategoryBudget = this.categories.reduce((total, cat) => total + cat.budgetAmount, 0);
  if (totalCategoryBudget > this.totalBudget) {
    const error = new Error('Total category budgets cannot exceed total budget');
    error.code = 'BUDGET_EXCEEDED';
    return next(error);
  }
  next();
});

export default mongoose.models.Budget || mongoose.model('Budget', budgetSchema);