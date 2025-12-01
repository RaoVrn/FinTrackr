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

// GET - Fetch all incomes for user with advanced filtering
export async function GET(request) {
  try {
    await connectDB();
    
    const userId = await getUserFromToken(request);
    const { searchParams } = new URL(request.url);
    
    // Get filter parameters
    const category = searchParams.get('category');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');
    const isRecurring = searchParams.get('recurring');
    const paymentMethod = searchParams.get('paymentMethod');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;
    
    // Build query
    let query = { userId, isActive: true };
    
    // Category filter
    if (category && category !== 'All Categories') {
      query.category = category.toLowerCase();
    }
    
    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }
    
    // Search filter (title, source, description)
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { source: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Recurring filter
    if (isRecurring !== null) {
      query.isRecurring = isRecurring === 'true';
    }
    
    // Payment method filter
    if (paymentMethod) {
      query.paymentMethod = paymentMethod.toLowerCase();
    }
    
    // Execute query with pagination
    const skip = (page - 1) * limit;
    const incomes = await Income.find(query)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Get total count for pagination
    const totalCount = await Income.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);
    
    return NextResponse.json({ 
      success: true, 
      incomes,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
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
    const { title, amount, category, source } = body;
    
    if (!title || amount === undefined || !category || !source) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title, amount, category, and source are required' },
        { status: 400 }
      );
    }
    
    // Validate amount
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }
    
    // Prepare income data with defaults
    const incomeData = {
      title: body.title?.trim(),
      amount: parseFloat(amount),
      category: body.category?.toLowerCase(),
      source: body.source?.trim(),
      date: body.date ? new Date(body.date) : new Date(),
      time: body.time || null,
      frequency: body.frequency?.toLowerCase() || 'one-time',
      paymentMethod: body.paymentMethod?.toLowerCase() || null,
      tags: Array.isArray(body.tags) ? body.tags.filter(tag => tag?.trim()) : [],
      description: body.description?.trim() || '',
      attachmentUrl: body.attachmentUrl || null,
      userId
    };
    
    // The pre-save middleware will handle isRecurring and nextOccurrence
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

// PUT - Update income (bulk update - kept for compatibility)
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
    
    // Clean and prepare update data
    const cleanedData = {};
    
    if (updateData.title) cleanedData.title = updateData.title.trim();
    if (updateData.amount !== undefined) {
      const amount = parseFloat(updateData.amount);
      if (amount > 0) cleanedData.amount = amount;
    }
    if (updateData.category) cleanedData.category = updateData.category.toLowerCase();
    if (updateData.source) cleanedData.source = updateData.source.trim();
    if (updateData.date) cleanedData.date = new Date(updateData.date);
    if (updateData.time !== undefined) cleanedData.time = updateData.time;
    if (updateData.frequency) {
      cleanedData.frequency = updateData.frequency.toLowerCase();
      cleanedData.isRecurring = cleanedData.frequency !== 'one-time';
    }
    if (updateData.paymentMethod) cleanedData.paymentMethod = updateData.paymentMethod.toLowerCase();
    if (updateData.tags) cleanedData.tags = Array.isArray(updateData.tags) ? updateData.tags : [];
    if (updateData.description !== undefined) cleanedData.description = updateData.description.trim();
    if (updateData.attachmentUrl !== undefined) cleanedData.attachmentUrl = updateData.attachmentUrl;
    
    const income = await Income.findOneAndUpdate(
      { _id: id, userId },
      cleanedData,
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

// DELETE - Delete income (bulk delete - kept for compatibility)
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
    
    const income = await Income.findOneAndDelete({ _id: id, userId });
    
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