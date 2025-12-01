import mongoose from 'mongoose';

const debtSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Debt name is required'],
    trim: true,
    maxLength: [100, 'Name cannot exceed 100 characters']
  },
  type: {
    type: String,
    required: [true, 'Debt type is required'],
    enum: ['credit-card', 'personal-loan', 'home-loan', 'car-loan', 'education-loan', 'business-loan', 'other']
  },
  creditor: {
    type: String,
    required: [true, 'Creditor is required'],
    trim: true
  },
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
  dueDate: {
    type: Number,
    min: [1, 'Due date must be between 1-31'],
    max: [31, 'Due date must be between 1-31']
  },
  status: {
    type: String,
    enum: ['active', 'paid-off', 'defaulted'],
    default: 'active'
  },
  endDate: {
    type: Date
  },
  creditor: {
    type: String,
    required: [true, 'Creditor is required'],
    trim: true,
    maxLength: [100, 'Creditor name cannot exceed 100 characters']
  },
  accountNumber: {
    type: String,
    trim: true,
    maxLength: [50, 'Account number cannot exceed 50 characters']
  },
  description: {
    type: String,
    trim: true,
    maxLength: [500, 'Description cannot exceed 500 characters']
  },
  priority: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['Active', 'Paid Off', 'Defaulted', 'Restructured'],
    default: 'Active'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  payments: [{
    amount: {
      type: Number,
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    type: {
      type: String,
      enum: ['Regular', 'Extra', 'Minimum'],
      default: 'Regular'
    },
    note: String
  }]
}, {
  timestamps: true
});

// Index for faster queries
debtSchema.index({ userId: 1, createdAt: -1 });
debtSchema.index({ userId: 1, type: 1 });
debtSchema.index({ userId: 1, status: 1 });
debtSchema.index({ userId: 1, dueDate: 1 });

// Virtual for progress percentage
debtSchema.virtual('progressPercentage').get(function() {
  const paidAmount = this.totalAmount - this.remainingAmount;
  return Math.round((paidAmount / this.totalAmount) * 100);
});

// Virtual for months remaining (rough estimate)
debtSchema.virtual('monthsRemaining').get(function() {
  if (this.monthlyPayment <= 0) return 0;
  return Math.ceil(this.remainingAmount / this.monthlyPayment);
});

// Method to calculate total interest paid
debtSchema.methods.calculateTotalInterest = function() {
  const monthlyRate = this.interestRate / 100 / 12;
  const totalPayments = this.monthsRemaining;
  const totalPaid = this.monthlyPayment * totalPayments;
  return Math.max(0, totalPaid - this.remainingAmount);
};

// Method to add payment
debtSchema.methods.addPayment = function(amount, type = 'regular', notes = '') {
  if (amount <= 0) {
    throw new Error('Payment amount must be positive');
  }
  
  if (amount > this.currentBalance) {
    throw new Error('Payment amount cannot exceed current balance');
  }
  
  // Add to payment history
  this.paymentHistory.push({
    amount,
    type,
    notes,
    date: new Date()
  });
  
  // Update current balance
  this.currentBalance = Math.max(0, this.currentBalance - amount);
  
  // Update status if fully paid
  if (this.currentBalance === 0) {
    this.status = 'paid-off';
  }
  
  return this.save();
};

export default mongoose.models.Debt || mongoose.model('Debt', debtSchema);