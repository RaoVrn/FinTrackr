import { NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db';
import Investment from '../../../lib/models/Investment';
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

// GET - Fetch single investment details
export async function GET(request, { params }) {
  try {
    await connectDB();
    
    // Verify JWT token
    const decoded = verifyToken(request);
    const userId = decoded.userId;
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Investment ID is required' },
        { status: 400 }
      );
    }

    // Find investment (ensure user owns it)
    const investment = await Investment.findOne({ _id: id, userId })
      .populate('userId', 'name email');

    if (!investment) {
      return NextResponse.json(
        { error: 'Investment not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json(investment);
  } catch (error) {
    console.error('GET /api/investments/[id] error:', error);
    if (error.message === 'Invalid token' || error.message === 'No token provided') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch investment' },
      { status: 500 }
    );
  }
}

// PATCH - Update investment
export async function PATCH(request, { params }) {
  try {
    await connectDB();
    
    // Verify JWT token
    const decoded = verifyToken(request);
    const userId = decoded.userId;
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Investment ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Find investment (ensure user owns it)
    const investment = await Investment.findOne({ _id: id, userId });
    if (!investment) {
      return NextResponse.json(
        { error: 'Investment not found or unauthorized' },
        { status: 404 }
      );
    }

    // Update fields
    const allowedUpdates = [
      'name', 'type', 'category', 'sector', 'riskLevel', 'tags',
      'investedAmount', 'quantity', 'pricePerUnit', 'fees', 'currentValue',
      'expectedSellDate', 'attachmentUrl', 'notes', 'tickerSymbol', 'isin',
      'isSIP', 'sipAmount', 'sipStartDate', 'sipFrequency'
    ];

    allowedUpdates.forEach(field => {
      if (body[field] !== undefined) {
        if (field === 'tags' && Array.isArray(body[field])) {
          investment[field] = body[field].map(tag => tag.trim());
        } else if (['investedAmount', 'currentValue', 'quantity', 'pricePerUnit', 'fees', 'sipAmount'].includes(field)) {
          investment[field] = parseFloat(body[field]);
        } else if (['purchaseDate', 'expectedSellDate', 'sipStartDate'].includes(field)) {
          investment[field] = new Date(body[field]);
        } else if (typeof body[field] === 'string') {
          investment[field] = body[field].trim();
        } else {
          investment[field] = body[field];
        }
      }
    });

    await investment.save();

    return NextResponse.json(investment);
  } catch (error) {
    console.error('PATCH /api/investments/[id] error:', error);
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
      { error: 'Failed to update investment' },
      { status: 500 }
    );
  }
}

// DELETE - Delete investment
export async function DELETE(request, { params }) {
  try {
    await connectDB();
    
    // Verify JWT token
    const decoded = verifyToken(request);
    const userId = decoded.userId;
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Investment ID is required' },
        { status: 400 }
      );
    }

    // Find and delete investment (ensure user owns it)
    const investment = await Investment.findOneAndDelete({ _id: id, userId });
    if (!investment) {
      return NextResponse.json(
        { error: 'Investment not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Investment deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/investments/[id] error:', error);
    if (error.message === 'Invalid token' || error.message === 'No token provided') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to delete investment' },
      { status: 500 }
    );
  }
}