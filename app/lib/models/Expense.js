import mongoose, { Schema } from "mongoose";

const ExpenseSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0']
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      maxlength: [50, 'Category name cannot exceed 50 characters'],
      validate: {
        validator: function(v) {
          // Allow predefined categories and any custom category
          const predefinedCategories = [
            // Most Essential Daily Categories
            'Food & Dining', 'Groceries', 'Transport', 'Bills & Utilities', 'Health & Medical', 'Housing & Rent',
            // Common Lifestyle
            'Entertainment', 'Shopping', 'Education',
            // Financial Essentials
            'Insurance', 'Investments', 'Loans & EMI',
            // Other Important
            'Travel', 'Gifts', 'Other'
          ];
          
          // Allow predefined categories or any non-empty string (for custom categories)
          if (typeof v !== 'string') return false;
          const trimmedValue = v.trim();
          
          // Check if it's a predefined category (case-sensitive match)
          if (predefinedCategories.includes(v)) return true;
          
          // Allow any non-empty string for custom categories
          return trimmedValue.length > 0 && trimmedValue.length <= 50;
        },
        message: 'Please select a valid category or create a custom one'
      }
    },
    categoryIcon: {
      type: String,
      default: '📦',
      maxlength: [10, 'Category icon is too long']
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
    paymentMethod: {
      type: String,
      required: [true, 'Payment method is required'],
      enum: {
        values: ['cash', 'upi', 'debit-card', 'credit-card', 'netbanking', 'wallet'],
        message: 'Invalid payment method'
      }
    },
    account: {
      type: String,
      trim: true,
      maxlength: [50, 'Account name cannot exceed 50 characters']
    },
    merchant: {
      type: String,
      trim: true,
      maxlength: [100, 'Merchant name cannot exceed 100 characters']
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters']
    },
    isRecurring: {
      type: Boolean,
      default: false
    },
    recurringInterval: {
      type: String,
      enum: {
        values: ['weekly', 'monthly', 'yearly'],
        message: 'Invalid recurring interval'
      },
      validate: {
        validator: function(v) {
          // Only required if isRecurring is true
          if (this.isRecurring && !v) {
            return false;
          }
          return true;
        },
        message: 'Recurring interval is required when expense is set to recurring'
      }
    },
    needOrWant: {
      type: String,
      enum: {
        values: ['need', 'want', 'unsure'],
        message: 'Must be either need, want, or unsure'
      },
      default: 'need'
    },
    hasReceipt: {
      type: Boolean,
      default: false
    },
    receiptUrl: {
      type: String,
      validate: {
        validator: function(v) {
          if (!v) return true; // Optional field
          return /^https?:\/\/.+/.test(v);
        },
        message: 'Receipt URL must be a valid URL'
      }
    },
    currency: {
      type: String,
      default: 'INR',
      enum: {
        values: ['INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD'],
        message: 'Unsupported currency'
      }
    },
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      index: true // Add index for better query performance
    },
    userEmail: {
      type: String,
      required: [true, 'User email is required']
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Add indexes for better performance
ExpenseSchema.index({ userId: 1, createdAt: -1 });
ExpenseSchema.index({ userId: 1, category: 1 });
ExpenseSchema.index({ userId: 1, date: -1 });

// Virtual for formatted amount
ExpenseSchema.virtual('formattedAmount').get(function() {
  return `${this.currency} ${this.amount.toFixed(2)}`;
});

// Pre-save middleware to validate recurring interval
ExpenseSchema.pre('save', function(next) {
  if (this.isRecurring && !this.recurringInterval) {
    next(new Error('Recurring interval is required when expense is recurring'));
  } else {
    next();
  }
});

// Clear any existing model to avoid caching issues
if (mongoose.models.Expense) {
  delete mongoose.models.Expense;
}

export default mongoose.model("Expense", ExpenseSchema);
