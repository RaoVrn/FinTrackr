import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../lib/db";
import Expense from "../../lib/models/Expense";

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

// Helper function to get user from request headers (your existing auth system)
function getUserFromRequest(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  try {
    // Your token format: "Bearer {userId}:{email}"
    const token = authHeader.replace('Bearer ', '');
    const [userId, email] = token.split(':');
    return { userId, email };
  } catch (error) {
    console.error('Error parsing auth token:', error);
    return null;
  }
}

export async function POST(request) {
  try {
    await connectDB();
    
    // Get user from auth header
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login to continue.' }, 
        { status: 401 }
      );
    }
    
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
    
    return NextResponse.json(
      { 
        message: 'Expense created successfully',
        expense: expense
      }, 
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating expense:', error);
    
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
    
    // Get user from auth header
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login to continue.' },
        { status: 401 }
      );
    }
    
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
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}
