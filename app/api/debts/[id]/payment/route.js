import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import Debt from '../../../../lib/models/Debt';
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

// POST - Add payment to debt
export async function POST(request, { params }) {
  try {
    await connectDB();
    
    const userId = await getUserFromToken(request);
    const { id } = params;
    const body = await request.json();
    
    const { amount, type = 'regular', note = '' } = body;
    
    // Validation
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid payment amount is required' },
        { status: 400 }
      );
    }
    
    // Find the debt
    const debt = await Debt.findOne({ _id: id, userId: userId });
    
    if (!debt) {
      return NextResponse.json(
        { success: false, error: 'Debt not found' },
        { status: 404 }
      );
    }
    
    if (debt.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Cannot add payment to inactive debt' },
        { status: 400 }
      );
    }
    
    // Add the payment using the model method
    try {
      await debt.addPayment(parseFloat(amount), type, note);
      
      // Recalculate payoff date
      debt.expectedPayoffDate = debt.calculatePayoffDate();
      await debt.save();
      
      return NextResponse.json({ 
        success: true, 
        debt,
        message: 'Payment added successfully'
      });
      
    } catch (paymentError) {
      return NextResponse.json(
        { success: false, error: paymentError.message },
        { status: 400 }
      );
    }
    
  } catch (error) {
    console.error('Error adding payment:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.message === 'Invalid token' ? 401 : 500 }
    );
  }
}