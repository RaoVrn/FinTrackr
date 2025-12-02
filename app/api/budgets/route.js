import { NextResponse } from 'next/server';
import { connectDB } from '../../lib/db';
import Budget from '../../lib/models/Budget';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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

// GET - Fetch all budgets for authenticated user with comprehensive filtering
export async function GET(request) {
  try {
    await connectDB();
    
    // Verify JWT token
    const decoded = verifyToken(request);
    const userId = decoded.userId;

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const priority = searchParams.get('priority');
    const month = searchParams.get('month'); // Format: YYYY-MM
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;
    const skip = (page - 1) * limit;

    // Build filter query
    let filter = { 
      userId,
      $or: [
        { isActive: true },
        { isActive: { $exists: false } } // Handle budgets created before isActive field was added
      ]
    };
    
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    if (priority && priority !== 'all') {
      filter.priority = priority;
    }
    
    // Month filter - find budgets that overlap with the specified month
    if (month) {
      const [year, monthNum] = month.split('-');
      const startOfMonth = new Date(year, monthNum - 1, 1);
      const endOfMonth = new Date(year, monthNum, 0);
      
      filter.$or = [
        {
          startDate: { $lte: endOfMonth },
          endDate: { $gte: startOfMonth }
        }
      ];
    }

    console.log('Budget API - Filter:', JSON.stringify(filter));
    
    // Simple, robust query without optimization hints that might cause issues
    const budgets = await Budget.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean(false); // Keep lean false for fresh data

    console.log(`Budget API - Found ${budgets.length} budgets for user ${userId}`);
    budgets.forEach(budget => {
      console.log(`  Budget: "${budget.name}" (${budget.category}) - ₹${budget.spent || 0}/₹${budget.amount}`);
    });

    // Get total count for pagination
    const totalCount = await Budget.countDocuments(filter);

    // Calculate summary statistics
    const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);
    const totalSpent = budgets.reduce((sum, budget) => sum + budget.spent, 0);
    const totalRemaining = budgets.reduce((sum, budget) => sum + budget.remaining, 0);
    const categoriesCount = new Set(budgets.map(budget => budget.category)).size;

    const summary = {
      totalBudget,
      totalSpent,
      totalRemaining,
      categoriesCount,
      budgetsCount: budgets.length
    };

    return NextResponse.json({
      success: true,
      budgets,
      summary,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('GET /api/budgets error:', error);
    if (error.message === 'Invalid token' || error.message === 'No token provided') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to fetch budgets' },
      { status: 500 }
    );
  }
}

// POST - Create new budget
export async function POST(request) {
  try {
    await connectDB();
    
    // Verify JWT token
    const decoded = verifyToken(request);
    const userId = decoded.userId;

    const body = await request.json();
    const {
      name,
      category,
      amount,
      startDate,
      endDate,
      isRecurring,
      rolloverEnabled,
      priority,
      notes,
      alert50,
      alert75,
      alert100,
      alertExceeded
    } = body;

    // Validate required fields
    if (!name || !category || !amount || !startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, category, amount, startDate, and endDate are required' },
        { status: 400 }
      );
    }

    // Validate amount
    if (amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Budget amount must be positive' },
        { status: 400 }
      );
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      return NextResponse.json(
        { success: false, error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Check for overlapping budgets in the same category
    const existingBudget = await Budget.findOne({
      userId,
      category: category.toLowerCase(),
      $or: [
        {
          startDate: { $lte: end },
          endDate: { $gte: start }
        }
      ]
    });

    if (existingBudget) {
      return NextResponse.json(
        { success: false, error: `Budget already exists for ${category} in the selected time period` },
        { status: 400 }
      );
    }

    // Create new budget
    const budget = new Budget({
      name: name.trim(),
      category: category.toLowerCase(),
      amount: parseFloat(amount),
      startDate: start,
      endDate: end,
      isRecurring: Boolean(isRecurring),
      rolloverEnabled: Boolean(rolloverEnabled),
      priority: priority || 'essential',
      notes: notes?.trim() || '',
      alert50: alert50 !== false, // default true
      alert75: alert75 !== false, // default true
      alert100: alert100 !== false, // default true
      alertExceeded: alertExceeded !== false, // default true
      spent: 0,
      isActive: true,
      rolloverAmount: 0,
      userId
    });

    await budget.save();

    return NextResponse.json({
      success: true,
      budget,
      message: 'Budget created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('POST /api/budgets error:', error);
    if (error.message === 'Invalid token' || error.message === 'No token provided') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: Object.values(error.errors).map(e => e.message) },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create budget' },
      { status: 500 }
    );
  }
}