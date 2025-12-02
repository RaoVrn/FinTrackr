import { NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db';
import Budget from '../../../lib/models/Budget';
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

// GET - Fetch specific budget by ID
export async function GET(request, { params }) {
  try {
    await connectDB();
    
    // Verify JWT token
    const decoded = verifyToken(request);
    const userId = decoded.userId;
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Budget ID is required' },
        { status: 400 }
      );
    }

    // Find budget (ensure user owns it)
    const budget = await Budget.findOne({ _id: id, userId });
    
    if (!budget) {
      return NextResponse.json(
        { success: false, error: 'Budget not found or unauthorized' },
        { status: 404 }
      );
    }

    // Calculate progress info
    const progressInfo = {
      progressPercentage: budget.progressPercentage,
      remaining: budget.remaining,
      isOverBudget: budget.isOverBudget,
      status: budget.status,
      alertStatus: budget.alertStatus,
      progressColor: budget.getProgressColor()
    };

    return NextResponse.json({
      success: true,
      budget: {
        ...budget.toObject(),
        ...progressInfo
      }
    });

  } catch (error) {
    console.error('GET /api/budgets/[id] error:', error);
    if (error.message === 'Invalid token' || error.message === 'No token provided') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to fetch budget' },
      { status: 500 }
    );
  }
}

// PUT - Update specific budget (full update)
export async function PUT(request, { params }) {
  try {
    await connectDB();
    
    // Verify JWT token
    const decoded = verifyToken(request);
    const userId = decoded.userId;
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Budget ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, category, amount, priority, description } = body;

    // Validation
    if (!name || !category || !amount || !priority) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: name, category, amount, priority' 
      }, { status: 400 });
    }

    if (amount <= 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Amount must be greater than 0' 
      }, { status: 400 });
    }

    const validCategories = ['food', 'transport', 'entertainment', 'shopping', 'healthcare', 'utilities', 'groceries', 'education', 'other'];
    const validPriorities = ['essential', 'important', 'nice-to-have'];

    if (!validCategories.includes(category)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid category' 
      }, { status: 400 });
    }

    if (!validPriorities.includes(priority)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid priority' 
      }, { status: 400 });
    }

    const updatedBudget = await Budget.findOneAndUpdate(
      { _id: id, userId },
      {
        name: name.trim(),
        category,
        amount: parseFloat(amount),
        priority,
        description: description?.trim() || '',
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!updatedBudget) {
      return NextResponse.json({ success: false, error: 'Budget not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      budget: updatedBudget
    });

  } catch (error) {
    console.error('PUT /api/budgets/[id] error:', error);
    if (error.message === 'Invalid token' || error.message === 'No token provided') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to update budget' },
      { status: 500 }
    );
  }
}

// PATCH - Update specific budget
export async function PATCH(request, { params }) {
  try {
    await connectDB();
    
    // Verify JWT token
    const decoded = verifyToken(request);
    const userId = decoded.userId;
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Budget ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updateData = { ...body };
    delete updateData._id; // Remove _id if present
    delete updateData.userId; // Don't allow userId changes

    // Find budget (ensure user owns it)
    const budget = await Budget.findOne({ _id: id, userId });
    
    if (!budget) {
      return NextResponse.json(
        { success: false, error: 'Budget not found or unauthorized' },
        { status: 404 }
      );
    }

    // Validate date changes if provided
    if (updateData.startDate || updateData.endDate) {
      const startDate = updateData.startDate ? new Date(updateData.startDate) : budget.startDate;
      const endDate = updateData.endDate ? new Date(updateData.endDate) : budget.endDate;
      
      if (startDate >= endDate) {
        return NextResponse.json(
          { success: false, error: 'End date must be after start date' },
          { status: 400 }
        );
      }
    }

    // Validate amount if provided
    if (updateData.amount !== undefined && updateData.amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Budget amount must be positive' },
        { status: 400 }
      );
    }

    // Update budget
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        budget[key] = updateData[key];
      }
    });

    await budget.save();

    return NextResponse.json({
      success: true,
      budget,
      message: 'Budget updated successfully'
    });

  } catch (error) {
    console.error('PATCH /api/budgets/[id] error:', error);
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
      { success: false, error: 'Failed to update budget' },
      { status: 500 }
    );
  }
}

// DELETE - Delete specific budget
export async function DELETE(request, { params }) {
  try {
    await connectDB();
    
    // Verify JWT token
    const decoded = verifyToken(request);
    const userId = decoded.userId;
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Budget ID is required' },
        { status: 400 }
      );
    }

    // Find and delete budget (ensure user owns it)
    const budget = await Budget.findOneAndDelete({ _id: id, userId });
    
    if (!budget) {
      return NextResponse.json(
        { success: false, error: 'Budget not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Budget deleted successfully'
    });

  } catch (error) {
    console.error('DELETE /api/budgets/[id] error:', error);
    if (error.message === 'Invalid token' || error.message === 'No token provided') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to delete budget' },
      { status: 500 }
    );
  }
}