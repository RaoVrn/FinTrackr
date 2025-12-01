import { NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db';
import Income from '../../../lib/models/Income';
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

// GET - Fetch single income entry
export async function GET(request, { params }) {
  try {
    await connectDB();
    
    const userId = await getUserFromToken(request);
    const { id } = params;
    
    const income = await Income.findOne({ _id: id, userId }).lean();
    
    if (!income) {
      return NextResponse.json(
        { success: false, error: 'Income entry not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      income 
    });
    
  } catch (error) {
    console.error('Error fetching income:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.message === 'Invalid token' ? 401 : 500 }
    );
  }
}

// PATCH - Update income entry
export async function PATCH(request, { params }) {
  try {
    await connectDB();
    
    const userId = await getUserFromToken(request);
    const { id } = params;
    const updateData = await request.json();
    
    // Remove fields that shouldn't be updated directly
    delete updateData.userId;
    delete updateData._id;
    delete updateData.__v;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    
    // Auto-set isRecurring based on frequency if frequency is being updated
    if (updateData.frequency) {
      updateData.isRecurring = updateData.frequency !== 'one-time';
    }
    
    const income = await Income.findOneAndUpdate(
      { _id: id, userId },
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!income) {
      return NextResponse.json(
        { success: false, error: 'Income entry not found' },
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

// DELETE - Delete income entry
export async function DELETE(request, { params }) {
  try {
    await connectDB();
    
    const userId = await getUserFromToken(request);
    const { id } = params;
    
    const income = await Income.findOneAndDelete({ _id: id, userId });
    
    if (!income) {
      return NextResponse.json(
        { success: false, error: 'Income entry not found' },
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