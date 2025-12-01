import mongoose from 'mongoose';

const incomeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxLength: [100, 'Title cannot exceed 100 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount must be positive']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Salary', 'Freelance', 'Business', 'Investment', 'Rental', 'Passive', 'Other']
  },
  source: {
    type: String,
    required: [true, 'Source is required'],
    trim: true,
    maxLength: [100, 'Source cannot exceed 100 characters']
  },
  frequency: {
    type: String,
    required: [true, 'Frequency is required'],
    enum: ['One-time', 'Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly'],
    default: 'One-time'
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  nextOccurrence: {
    type: Date
  },
  description: {
    type: String,
    trim: true,
    maxLength: [500, 'Description cannot exceed 500 characters']
  },
  tags: [{
    type: String,
    trim: true
  }],
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries
incomeSchema.index({ user: 1, createdAt: -1 });
incomeSchema.index({ user: 1, category: 1 });
incomeSchema.index({ user: 1, isRecurring: 1 });

// Virtual for formatted amount
incomeSchema.virtual('formattedAmount').get(function() {
  return `₹${this.amount.toLocaleString()}`;
});

// Method to calculate next occurrence for recurring income
incomeSchema.methods.calculateNextOccurrence = function() {
  if (!this.isRecurring) return null;
  
  const frequencies = {
    'Daily': 1,
    'Weekly': 7,
    'Monthly': 30,
    'Quarterly': 90,
    'Yearly': 365
  };
  
  const days = frequencies[this.frequency];
  if (days) {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + days);
    return nextDate;
  }
  
  return null;
};

// Pre-save middleware to set next occurrence
incomeSchema.pre('save', function(next) {
  if (this.isRecurring && !this.nextOccurrence) {
    this.nextOccurrence = this.calculateNextOccurrence();
  }
  next();
});

export default mongoose.models.Income || mongoose.model('Income', incomeSchema);