import mongoose from 'mongoose';

const debtSchema = new mongoose.Schema({
  // BASIC INFO
  name: {
    type: String,
    required: [true, 'Debt name is required'],
    trim: true,
    maxLength: [100, 'Name cannot exceed 100 characters']
  },
  creditor: {
    type: String,
    required: [true, 'Creditor is required'],
    trim: true,
    maxLength: [100, 'Creditor name cannot exceed 100 characters']
  },
  type: {
    type: String,
    required: [true, 'Debt type is required'],
    enum: ['credit-card', 'personal-loan', 'education-loan', 'auto-loan', 'home-loan', 'family-borrowing', 'other']
  },
  category: {
    type: String,
    trim: true,
    maxLength: [50, 'Category cannot exceed 50 characters']
  },
  status: {
    type: String,
    enum: ['active', 'closed', 'defaulted'],
    default: 'active'
  },

  // FINANCIAL DETAILS
  originalAmount: {
    type: Number,
    required: [true, 'Original amount is required'],
    min: [0, 'Amount must be positive']
  },
  currentBalance: {
    type: Number,
    required: [true, 'Current balance is required'],
    min: [0, 'Amount must be positive']
  },
  interestRate: {
    type: Number,
    required: [true, 'Interest rate is required'],
    min: [0, 'Interest rate must be positive'],
    max: [100, 'Interest rate cannot exceed 100%']
  },
  minimumPayment: {
    type: Number,
    required: [true, 'Minimum payment is required'],
    min: [0, 'Payment must be positive']
  },

  // DATE FIELDS
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  expectedPayoffDate: {
    type: Date
  },
  dueDay: {
    type: Number,
    required: [true, 'Due day is required'],
    min: [1, 'Due day must be between 1-31'],
    max: [31, 'Due day must be between 1-31']
  },
  repaymentFrequency: {
    type: String,
    enum: ['weekly', 'bi-weekly', 'monthly'],
    default: 'monthly'
  },

  // REMINDERS
  remindersEnabled: {
    type: Boolean,
    default: false
  },
  reminderMode: {
    type: String,
    enum: ['day-before', 'on-day', 'custom']
  },
  customReminderDays: {
    type: Number,
    min: [1, 'Custom reminder days must be at least 1'],
    max: [30, 'Custom reminder days cannot exceed 30']
  },

  // EXTRA FIELDS
  collateral: {
    type: String,
    trim: true,
    maxLength: [200, 'Collateral description cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxLength: [500, 'Description cannot exceed 500 characters']
  },
  userId: {
    type: String,
    required: [true, 'User ID is required']
  },

  // PAYMENT HISTORY
  payments: [{
    amount: {
      type: Number,
      required: true,
      min: [0, 'Payment amount must be positive']
    },
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    type: {
      type: String,
      enum: ['minimum', 'extra', 'regular'],
      default: 'regular'
    },
    note: {
      type: String,
      trim: true,
      maxLength: [200, 'Payment note cannot exceed 200 characters']
    }
  }]
}, {
  timestamps: true
});

// Indexes for performance
debtSchema.index({ userId: 1, createdAt: -1 });
debtSchema.index({ userId: 1, type: 1 });
debtSchema.index({ userId: 1, status: 1 });
debtSchema.index({ userId: 1, dueDay: 1 });
debtSchema.index({ userId: 1, remindersEnabled: 1 });

// Helper method to auto-close debt when balance reaches zero
debtSchema.pre('save', function(next) {
  if (this.currentBalance <= 0 && this.status === 'active') {
    this.status = 'closed';
  }
  next();
});

// Virtual for progress percentage
debtSchema.virtual('progressPercentage').get(function() {
  if (this.originalAmount <= 0) return 0;
  const paidAmount = this.originalAmount - this.currentBalance;
  return Math.round((paidAmount / this.originalAmount) * 100);
});

// Virtual for total paid amount
debtSchema.virtual('totalPaid').get(function() {
  return this.originalAmount - this.currentBalance;
});

// Method to calculate payoff date
debtSchema.methods.calculatePayoffDate = function() {
  if (this.currentBalance <= 0 || this.minimumPayment <= 0) {
    return null;
  }

  const monthlyRate = this.interestRate / 100 / 12;
  let paymentsPerMonth;
  
  switch (this.repaymentFrequency) {
    case 'weekly':
      paymentsPerMonth = 52 / 12;
      break;
    case 'bi-weekly':
      paymentsPerMonth = 26 / 12;
      break;
    case 'monthly':
    default:
      paymentsPerMonth = 1;
      break;
  }

  const adjustedPayment = this.minimumPayment * paymentsPerMonth;
  
  if (monthlyRate === 0) {
    // No interest case
    const months = this.currentBalance / adjustedPayment;
    const payoffDate = new Date();
    payoffDate.setMonth(payoffDate.getMonth() + Math.ceil(months));
    return payoffDate;
  }

  // With interest calculation
  const months = -Math.log(1 - (this.currentBalance * monthlyRate) / adjustedPayment) / Math.log(1 + monthlyRate);
  
  if (!isFinite(months) || months <= 0) {
    return null;
  }

  const payoffDate = new Date();
  payoffDate.setMonth(payoffDate.getMonth() + Math.ceil(months));
  return payoffDate;
};

// Method to add payment
debtSchema.methods.addPayment = function(amount, type = 'regular', note = '') {
  if (amount <= 0) {
    throw new Error('Payment amount must be positive');
  }
  
  if (amount > this.currentBalance) {
    amount = this.currentBalance; // Pay off remaining balance
  }
  
  // Add to payment history
  this.payments.push({
    amount,
    type,
    note,
    date: new Date()
  });
  
  // Update current balance
  this.currentBalance = Math.max(0, this.currentBalance - amount);
  
  // Update status if fully paid
  if (this.currentBalance === 0) {
    this.status = 'closed';
  }
  
  return this.save();
};

export default mongoose.models.Debt || mongoose.model('Debt', debtSchema);