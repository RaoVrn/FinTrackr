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
    min: [0.01, 'Amount must be greater than 0']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['salary', 'allowance', 'freelance', 'bonus', 'gift', 'rental', 'other'],
    lowercase: true
  },
  source: {
    type: String,
    required: [true, 'Source is required'],
    trim: true,
    maxLength: [100, 'Source cannot exceed 100 characters']
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },
  time: {
    type: String,
    validate: {
      validator: function(v) {
        if (!v) return true; // Optional field
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Time must be in HH:MM format'
    }
  },
  frequency: {
    type: String,
    required: [true, 'Frequency is required'],
    enum: ['one-time', 'monthly', 'weekly'],
    default: 'one-time',
    lowercase: true
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  paymentMethod: {
    type: String,
    enum: ['bank-transfer', 'cash', 'upi', 'paypal', 'cheque', 'other'],
    lowercase: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  description: {
    type: String,
    trim: true,
    maxLength: [500, 'Description cannot exceed 500 characters']
  },
  attachmentUrl: {
    type: String,
    validate: {
      validator: function(v) {
        if (!v) return true; // Optional field
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Attachment URL must be a valid URL'
    }
  },
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    index: true
  },
  nextOccurrence: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
incomeSchema.index({ userId: 1, createdAt: -1 });
incomeSchema.index({ userId: 1, category: 1 });
incomeSchema.index({ userId: 1, isRecurring: 1 });
incomeSchema.index({ userId: 1, date: -1 });

// Virtual for formatted amount
incomeSchema.virtual('formattedAmount').get(function() {
  return `₹${this.amount.toLocaleString()}`;
});

// Method to calculate next occurrence for recurring income
incomeSchema.methods.calculateNextOccurrence = function() {
  if (!this.isRecurring) return null;
  
  const frequencies = {
    'weekly': 7,
    'monthly': 30
  };
  
  const days = frequencies[this.frequency];
  if (days) {
    const nextDate = new Date(this.date);
    nextDate.setDate(nextDate.getDate() + days);
    return nextDate;
  }
  
  return null;
};

// Pre-save middleware to automatically set isRecurring and next occurrence
incomeSchema.pre('save', function(next) {
  // Auto-set isRecurring based on frequency
  this.isRecurring = this.frequency !== 'one-time';
  
  // Set next occurrence for recurring income
  if (this.isRecurring && !this.nextOccurrence) {
    this.nextOccurrence = this.calculateNextOccurrence();
  }
  
  next();
});

export default mongoose.models.Income || mongoose.model('Income', incomeSchema);