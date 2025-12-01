import { NextResponse } from 'next/server';
import { connectDB } from '../../lib/db';
import Investment from '../../lib/models/Investment';
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

// GET - Fetch all investments for authenticated user
export async function GET(request) {
  try {
    await connectDB();
    
    // Verify JWT token
    const decoded = verifyToken(request);
    const userId = decoded.userId;

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;
    const skip = (page - 1) * limit;

    // Build filter query
    let filter = { user: userId };
    if (type && type !== 'all') {
      filter.type = type;
    }

    // Fetch investments with pagination
    const investments = await Investment.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate('user', 'name email');

    // Get total count for pagination
    const totalCount = await Investment.countDocuments(filter);

    return NextResponse.json({
      investments,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('GET /api/investments error:', error);
    if (error.message === 'Invalid token' || error.message === 'No token provided') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch investments' },
      { status: 500 }
    );
  }
}

// POST - Create new investment
export async function POST(request) {
  try {
    await connectDB();
    
    // Verify JWT token
    const decoded = verifyToken(request);
    const userId = decoded.userId;

    const body = await request.json();
    const {
      name,
      type,
      symbol,
      quantity,
      avgPrice,
      currentPrice,
      description
    } = body;

    // Validate required fields
    if (!name || !type || !quantity || !avgPrice) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type, quantity, and avgPrice are required' },
        { status: 400 }
      );
    }

    // Create new investment
    const investment = new Investment({
      user: userId,
      name: name.trim(),
      type,
      symbol: symbol?.trim().toUpperCase(),
      quantity: parseFloat(quantity),
      avgPrice: parseFloat(avgPrice),
      currentPrice: currentPrice ? parseFloat(currentPrice) : parseFloat(avgPrice),
      description: description?.trim()
    });

    await investment.save();
    await investment.populate('user', 'name email');

    return NextResponse.json(investment, { status: 201 });
  } catch (error) {
    console.error('POST /api/investments error:', error);
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
      { error: 'Failed to create investment' },
      { status: 500 }
    );
  }
}

// PUT - Update existing investment
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
        { error: 'Investment ID is required' },
        { status: 400 }
      );
    }

    // Find and update investment (ensure user owns it)
    const investment = await Investment.findOne({ _id: id, user: userId });
    if (!investment) {
      return NextResponse.json(
        { error: 'Investment not found or unauthorized' },
        { status: 404 }
      );
    }

    // Handle transaction addition
    if (updateData.action === 'addTransaction') {
      const { transactionType, quantity, price, date } = updateData;
      
      if (!transactionType || !quantity || !price) {
        return NextResponse.json(
          { error: 'Transaction type, quantity, and price are required' },
          { status: 400 }
        );
      }

      investment.addTransaction(transactionType, parseFloat(quantity), parseFloat(price), date);
    } else {
      // Regular update
      Object.keys(updateData).forEach(key => {
        if (key !== 'action' && updateData[key] !== undefined) {
          investment[key] = updateData[key];
        }
      });
    }

    await investment.save();
    await investment.populate('user', 'name email');

    return NextResponse.json(investment);
  } catch (error) {
    console.error('PUT /api/investments error:', error);
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
        { error: 'Investment ID is required' },
        { status: 400 }
      );
    }

    // Find and delete investment (ensure user owns it)
    const investment = await Investment.findOneAndDelete({ _id: id, user: userId });
    if (!investment) {
      return NextResponse.json(
        { error: 'Investment not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Investment deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/investments error:', error);
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