import { NextResponse } from 'next/server';
import { connectDB } from '../../lib/db';
import Debt from '../../lib/models/Debt';
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

// GET - Fetch all debts for user
export async function GET(request) {
  try {
    await connectDB();
    
    const userId = await getUserFromToken(request);
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    
    let query = { user: userId };
    
    // Add filters if provided
    if (type && type !== 'all') {
      query.type = type;
    }
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    const debts = await Debt.find(query)
      .sort({ createdAt: -1 })
      .lean();
    
    return NextResponse.json({ 
      success: true, 
      debts,
      count: debts.length
    });
  } catch (error) {
    console.error('Error fetching debts:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.message === 'Invalid token' ? 401 : 500 }
    );
  }
}

// POST - Create new debt
export async function POST(request) {
  try {
    await connectDB();
    
    const userId = await getUserFromToken(request);
    const body = await request.json();
    
    // Validate required fields
    const { title, type, totalAmount, remainingAmount, interestRate, monthlyPayment, minimumPayment, dueDate, startDate, creditor } = body;
    
    if (!title || !type || !totalAmount || remainingAmount === undefined || !interestRate || !monthlyPayment || !minimumPayment || !dueDate || !startDate || !creditor) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const debtData = {
      ...body,
      userId
    };
    
    const debt = new Debt(debtData);
    await debt.save();
    
    return NextResponse.json({ 
      success: true, 
      debt,
      message: 'Debt created successfully'
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating debt:', error);
    
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

// PUT - Update debt
export async function PUT(request) {
  try {
    await connectDB();
    
    const userId = await getUserFromToken(request);
    const body = await request.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Debt ID is required' },
        { status: 400 }
      );
    }
    
    // Handle add payment action
    if (updateData.action === 'addPayment') {
      const { amount, type, notes } = updateData;
      
      if (!amount || amount <= 0) {
        return NextResponse.json(
          { success: false, error: 'Valid payment amount is required' },
          { status: 400 }
        );
      }
      
      const debt = await Debt.findOne({ _id: id, user: userId });
      if (!debt) {
        return NextResponse.json(
          { success: false, error: 'Debt not found' },
          { status: 404 }
        );
      }
      
      try {
        await debt.addPayment(parseFloat(amount), type || 'regular', notes || '');
        return NextResponse.json({ 
          success: true, 
          debt,
          message: 'Payment added successfully'
        });
      } catch (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 400 }
        );
      }
    } else {
      // Regular update
      const debt = await Debt.findOneAndUpdate(
        { _id: id, user: userId },
        updateData,
        { new: true, runValidators: true }
      );
      
      if (!debt) {
        return NextResponse.json(
          { success: false, error: 'Debt not found' },
          { status: 404 }
        );
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      debt,
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
export async function DELETE(request) {
  try {
    await connectDB();
    
    const userId = await getUserFromToken(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Debt ID is required' },
        { status: 400 }
      );
    }
    
    const debt = await Debt.findOneAndDelete({ _id: id, user: userId });
    
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