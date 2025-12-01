import { NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db';
import Debt from '../../../lib/models/Debt';
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

// GET - Fetch single debt by ID
export async function GET(request, { params }) {
  try {
    await connectDB();
    
    const userId = await getUserFromToken(request);
    const { id } = params;
    
    const debt = await Debt.findOne({ _id: id, userId: userId }).lean();
    
    if (!debt) {
      return NextResponse.json(
        { success: false, error: 'Debt not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      debt 
    });
    
  } catch (error) {
    console.error('Error fetching debt:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.message === 'Invalid token' ? 401 : 500 }
    );
  }
}

// PATCH - Update debt
export async function PATCH(request, { params }) {
  try {
    await connectDB();
    
    const userId = await getUserFromToken(request);
    const { id } = params;
    const body = await request.json();
    
    // Find the debt first
    const existingDebt = await Debt.findOne({ _id: id, userId: userId });
    
    if (!existingDebt) {
      return NextResponse.json(
        { success: false, error: 'Debt not found' },
        { status: 404 }
      );
    }
    
    // Additional validation for financial fields
    if (body.originalAmount !== undefined && body.originalAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Original amount must be positive' },
        { status: 400 }
      );
    }
    
    if (body.currentBalance !== undefined && body.currentBalance < 0) {
      return NextResponse.json(
        { success: false, error: 'Current balance cannot be negative' },
        { status: 400 }
      );
    }
    
    if (body.currentBalance !== undefined && body.originalAmount !== undefined && 
        body.currentBalance > body.originalAmount) {
      return NextResponse.json(
        { success: false, error: 'Current balance cannot exceed original amount' },
        { status: 400 }
      );
    }
    
    // Update the debt
    const updatedDebt = await Debt.findOneAndUpdate(
      { _id: id, userId: userId },
      body,
      { new: true, runValidators: true }
    );
    
    // Recalculate payoff date if financial details changed
    if (body.currentBalance !== undefined || body.minimumPayment !== undefined || 
        body.interestRate !== undefined || body.repaymentFrequency !== undefined) {
      updatedDebt.expectedPayoffDate = updatedDebt.calculatePayoffDate();
      await updatedDebt.save();
    }
    
    return NextResponse.json({ 
      success: true, 
      debt: updatedDebt,
      message: 'Debt updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating debt:', error);
    
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

// DELETE - Delete debt
export async function DELETE(request, { params }) {
  try {
    await connectDB();
    
    const userId = await getUserFromToken(request);
    const { id } = params;
    
    const debt = await Debt.findOneAndDelete({ _id: id, userId: userId });
    
    if (!debt) {
      return NextResponse.json(
        { success: false, error: 'Debt not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Debt deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting debt:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.message === 'Invalid token' ? 401 : 500 }
    );
  }
}