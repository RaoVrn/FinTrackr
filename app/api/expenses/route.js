import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../lib/db";
import Expense from "../../lib/models/Expense";
import Budget from "../../lib/models/Budget";
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Enhanced validation function
function validateExpenseData(data) {
  const errors = {};
  
  // Required fields validation
  if (!data.title || !data.title.trim()) {
    errors.title = 'Title is required';
  } else if (data.title.length > 100) {
    errors.title = 'Title cannot exceed 100 characters';
  }
  
  if (!data.amount || data.amount <= 0) {
    errors.amount = 'Amount must be greater than 0';
  }
  
  if (!data.category) {
    errors.category = 'Category is required';
  }
  
  if (!data.paymentMethod) {
    errors.paymentMethod = 'Payment method is required';
  }
  
  // Date validation
  if (data.date) {
    const expenseDate = new Date(data.date);
    if (isNaN(expenseDate.getTime())) {
      errors.date = 'Invalid date format';
    }
  }
  
  // Time validation (optional)
  if (data.time && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(data.time)) {
    errors.time = 'Time must be in HH:MM format';
  }
  
  // Recurring validation
  if (data.isRecurring && !data.recurringInterval) {
    errors.recurringInterval = 'Recurring interval is required when expense is recurring';
  }
  
  return { isValid: Object.keys(errors).length === 0, errors };
}

// Helper function to verify JWT token
const verifyToken = (request) => {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      throw new Error('No token provided');
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

export async function POST(request) {
  try {
    await connectDB();
    
    // Verify JWT token
    const decoded = verifyToken(request);
    const user = { userId: decoded.userId, email: decoded.email };
    
    const body = await request.json();
    
    // Validate request body
    const { isValid, errors } = validateExpenseData(body);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }
    
    // Prepare expense data
    const expenseData = {
      title: body.title.trim(),
      amount: parseFloat(body.amount),
      category: body.category,
      date: body.date ? new Date(body.date) : new Date(),
      time: body.time || undefined,
      paymentMethod: body.paymentMethod,
      account: body.account?.trim() || undefined,
      merchant: body.merchant?.trim() || undefined,
      notes: body.notes?.trim() || undefined,
      isRecurring: Boolean(body.isRecurring),
      recurringInterval: body.isRecurring ? body.recurringInterval : undefined,
      needOrWant: body.needOrWant || 'need',
      hasReceipt: Boolean(body.hasReceipt),
      receiptUrl: body.receiptUrl || undefined,
      currency: body.currency || 'INR',
      userId: user.userId,
      userEmail: user.email
    };
    
    const expense = await Expense.create(expenseData);
    
    // Try to automatically apply expense to matching budget
    let budgetUpdate = null;
    let alerts = [];
    
    try {
      // Find budget that matches category and time period
      const matchingBudget = await Budget.findForExpense(user.userId, expense.category, expense.date);

      if (matchingBudget) {
        console.log(`Found matching budget for ${expense.category}: ${matchingBudget._id}`);
        
        // Store previous state for alert checking
        const previousSpent = matchingBudget.spent;
        const previousPercentage = matchingBudget.progressPercentage;

        // Apply expense to budget
        await matchingBudget.addExpense(expense.amount);
        console.log(`Applied expense ₹${expense.amount} to budget. New spent: ₹${matchingBudget.spent}`);

        // Check for threshold alerts
        const newPercentage = matchingBudget.progressPercentage;

        // Check if any thresholds were crossed
        if (matchingBudget.alert50 && previousPercentage < 50 && newPercentage >= 50) {
          alerts.push({ type: '50', message: `50% of ${matchingBudget.category} budget used (₹${matchingBudget.spent.toFixed(2)}/₹${matchingBudget.amount})`, percentage: 50 });
        }
        
        if (matchingBudget.alert75 && previousPercentage < 75 && newPercentage >= 75) {
          alerts.push({ type: '75', message: `75% of ${matchingBudget.category} budget used (₹${matchingBudget.spent.toFixed(2)}/₹${matchingBudget.amount})`, percentage: 75 });
        }
        
        if (matchingBudget.alert100 && previousPercentage < 100 && newPercentage >= 100) {
          alerts.push({ type: '100', message: `${matchingBudget.category} budget fully used (₹${matchingBudget.spent.toFixed(2)}/₹${matchingBudget.amount})`, percentage: 100 });
        }
        
        if (matchingBudget.alertExceeded && previousSpent < matchingBudget.amount && matchingBudget.spent > matchingBudget.amount) {
          alerts.push({ type: 'exceeded', message: `${matchingBudget.category} budget exceeded! (₹${matchingBudget.spent.toFixed(2)}/₹${matchingBudget.amount})`, percentage: newPercentage });
        }

        budgetUpdate = {
          budgetId: matchingBudget._id,
          category: matchingBudget.category,
          amount: matchingBudget.amount,
          spent: matchingBudget.spent,
          remaining: matchingBudget.remaining,
          progressPercentage: matchingBudget.progressPercentage,
          status: matchingBudget.calculateStatus(),
          isOverBudget: matchingBudget.isOverBudget
        };
      } else {
        console.log(`No matching budget found for category: ${expense.category}`);
      }
    } catch (budgetError) {
      console.error('Error updating budget:', budgetError);
      // Don't fail expense creation if budget update fails
    }
    
    return NextResponse.json(
      { 
        message: budgetUpdate ? 
          `Expense created successfully and ${budgetUpdate.category} budget updated` : 
          'Expense created successfully',
        expense: expense,
        budgetUpdate: budgetUpdate,
        alerts: alerts
      }, 
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating expense:', error);
    
    // Handle JWT authentication errors
    if (error.message === 'Invalid token' || error.message === 'No token provided') {
      return NextResponse.json(
        { error: 'Unauthorized. Please login to continue.' },
        { status: 401 }
      );
    }
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = {};
      Object.keys(error.errors).forEach(key => {
        validationErrors[key] = error.errors[key].message;
      });
      return NextResponse.json(
        { error: 'Validation failed', details: validationErrors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    await connectDB();
    
    // Verify JWT token
    const decoded = verifyToken(request);
    const user = { userId: decoded.userId, email: decoded.email };
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // Build query
    const query = { userId: user.userId };
    
    if (category) {
      query.category = category;
    }
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    // Calculate skip for pagination
    const skip = (page - 1) * limit;
    
    // Get expenses with pagination
    const [expenses, total] = await Promise.all([
      Expense.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Expense.countDocuments(query)
    ]);
    
    return NextResponse.json({
      expenses,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalExpenses: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    
    // Handle JWT authentication errors
    if (error.message === 'Invalid token' || error.message === 'No token provided') {
      return NextResponse.json(
        { error: 'Unauthorized. Please login to continue.' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}
