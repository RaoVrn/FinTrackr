import { NextResponse } from 'next/server';
import { connectDB } from '../../lib/db';
import Income from '../../lib/models/Income';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper function to get user ID from token
async function getUserFromToken(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      throw new Error('No token provided');
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.userId;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

// GET - Fetch all incomes for user
export async function GET(request) {
  try {
    await connectDB();
    
    const userId = await getUserFromToken(request);
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const isRecurring = searchParams.get('recurring');
    
    let query = { user: userId };
    
    // Add filters if provided
    if (category && category !== 'All Categories') {
      query.category = category;
    }
    
    if (isRecurring !== null) {
      query.isRecurring = isRecurring === 'true';
    }
    
    const incomes = await Income.find(query)
      .sort({ createdAt: -1 })
      .lean();
    
    return NextResponse.json({ 
      success: true, 
      incomes,
      count: incomes.length
    });
  } catch (error) {
    console.error('Error fetching incomes:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.message === 'Invalid token' ? 401 : 500 }
    );
  }
}

// POST - Create new income
export async function POST(request) {
  try {
    await connectDB();
    
    const userId = await getUserFromToken(request);
    const body = await request.json();
    
    // Validate required fields
    const { title, amount, category, source, frequency } = body;
    
    if (!title || !amount || !category || !source || !frequency) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Create income data
    const incomeData = {
      ...body,
      user: userId,
      isRecurring: frequency !== 'One-time'
    };
    
    const income = new Income(incomeData);
    await income.save();
    
    return NextResponse.json({ 
      success: true, 
      income,
      message: 'Income created successfully'
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating income:', error);
    
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed',
          details: Object.values(error.errors).map(err => err.message)
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.message === 'Invalid token' ? 401 : 500 }
    );
  }
}

// PUT - Update income
export async function PUT(request) {
  try {
    await connectDB();
    
    const userId = await getUserFromToken(request);
    const body = await request.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Income ID is required' },
        { status: 400 }
      );
    }
    
    // Update isRecurring based on frequency
    if (updateData.frequency) {
      updateData.isRecurring = updateData.frequency !== 'One-time';
    }
    
    const income = await Income.findOneAndUpdate(
      { _id: id, user: userId },
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!income) {
      return NextResponse.json(
        { success: false, error: 'Income not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      income,
      message: 'Income updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating income:', error);
    
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed',
          details: Object.values(error.errors).map(err => err.message)
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.message === 'Invalid token' ? 401 : 500 }
    );
  }
}

// DELETE - Delete income
export async function DELETE(request) {
  try {
    await connectDB();
    
    const userId = await getUserFromToken(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Income ID is required' },
        { status: 400 }
      );
    }
    
    const income = await Income.findOneAndDelete({ _id: id, user: userId });
    
    if (!income) {
      return NextResponse.json(
        { success: false, error: 'Income not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Income deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting income:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.message === 'Invalid token' ? 401 : 500 }
    );
  }
}