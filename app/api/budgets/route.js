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

// GET - Fetch all budgets for authenticated user
export async function GET(request) {
  try {
    await connectDB();
    
    // Verify JWT token
    const decoded = verifyToken(request);
    const userId = decoded.userId;

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const period = searchParams.get('period');
    const active = searchParams.get('active');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;
    const skip = (page - 1) * limit;

    // Build filter query
    let filter = { user: userId };
    if (category && category !== 'all') {
      filter.category = category;
    }
    if (period && period !== 'all') {
      filter.period = period;
    }
    if (active === 'true') {
      filter.isActive = true;
    }

    // Fetch budgets with pagination
    const budgets = await Budget.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate('user', 'name email');

    // Get total count for pagination
    const totalCount = await Budget.countDocuments(filter);

    return NextResponse.json({
      budgets,
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
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch budgets' },
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
      category,
      amount,
      period,
      description,
      alertThreshold
    } = body;

    // Validate required fields
    if (!category || !amount || !period) {
      return NextResponse.json(
        { error: 'Missing required fields: category, amount, and period are required' },
        { status: 400 }
      );
    }

    // Check if budget already exists for this category and period
    const existingBudget = await Budget.findOne({
      user: userId,
      category: category.trim(),
      period,
      isActive: true
    });

    if (existingBudget) {
      return NextResponse.json(
        { error: `Active budget already exists for ${category} (${period})` },
        { status: 400 }
      );
    }

    // Create new budget
    const budget = new Budget({
      user: userId,
      category: category.trim(),
      amount: parseFloat(amount),
      period,
      description: description?.trim(),
      alertThreshold: alertThreshold ? parseFloat(alertThreshold) : 80
    });

    await budget.save();
    await budget.populate('user', 'name email');

    return NextResponse.json(budget, { status: 201 });
  } catch (error) {
    console.error('POST /api/budgets error:', error);
    if (error.message === 'Invalid token' || error.message === 'No token provided') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: Object.values(error.errors).map(e => e.message) },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create budget' },
      { status: 500 }
    );
  }
}

// PUT - Update existing budget
export async function PUT(request) {
  try {
    await connectDB();
    
    // Verify JWT token
    const decoded = verifyToken(request);
    const userId = decoded.userId;

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Budget ID is required' },
        { status: 400 }
      );
    }

    // Find and update budget (ensure user owns it)
    const budget = await Budget.findOne({ _id: id, user: userId });
    if (!budget) {
      return NextResponse.json(
        { error: 'Budget not found or unauthorized' },
        { status: 404 }
      );
    }

    // Handle spending update
    if (updateData.action === 'updateSpending') {
      const { amount } = updateData;
      
      if (amount === undefined || amount === null) {
        return NextResponse.json(
          { error: 'Spending amount is required' },
          { status: 400 }
        );
      }

      budget.spent = parseFloat(amount);
      budget.lastUpdated = new Date();
    } else {
      // Regular update
      Object.keys(updateData).forEach(key => {
        if (key !== 'action' && updateData[key] !== undefined) {
          budget[key] = updateData[key];
        }
      });
    }

    await budget.save();
    await budget.populate('user', 'name email');

    return NextResponse.json(budget);
  } catch (error) {
    console.error('PUT /api/budgets error:', error);
    if (error.message === 'Invalid token' || error.message === 'No token provided') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: Object.values(error.errors).map(e => e.message) },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update budget' },
      { status: 500 }
    );
  }
}

// DELETE - Delete budget
export async function DELETE(request) {
  try {
    await connectDB();
    
    // Verify JWT token
    const decoded = verifyToken(request);
    const userId = decoded.userId;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Budget ID is required' },
        { status: 400 }
      );
    }

    // Find and delete budget (ensure user owns it)
    const budget = await Budget.findOneAndDelete({ _id: id, user: userId });
    if (!budget) {
      return NextResponse.json(
        { error: 'Budget not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/budgets error:', error);
    if (error.message === 'Invalid token' || error.message === 'No token provided') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to delete budget' },
      { status: 500 }
    );
  }
}