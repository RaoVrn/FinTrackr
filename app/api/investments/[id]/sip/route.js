import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import Investment from '../../../../lib/models/Investment';
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

// POST - Add SIP transaction
export async function POST(request, { params }) {
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
    const { amount, nav, units, note } = body;

    // Validate required fields
    if (!amount || !nav) {
      return NextResponse.json(
        { error: 'Amount and NAV are required for SIP transaction' },
        { status: 400 }
      );
    }

    // Find investment (ensure user owns it and it's a SIP)
    const investment = await Investment.findOne({ _id: id, userId });
    if (!investment) {
      return NextResponse.json(
        { error: 'Investment not found or unauthorized' },
        { status: 404 }
      );
    }

    if (!investment.isSIP) {
      return NextResponse.json(
        { error: 'This investment is not configured for SIP' },
        { status: 400 }
      );
    }

    // Add SIP transaction
    await investment.addSIPTransaction(
      parseFloat(amount),
      parseFloat(nav),
      units ? parseFloat(units) : undefined,
      note || ''
    );

    return NextResponse.json({
      message: 'SIP transaction added successfully',
      investment: investment
    });
  } catch (error) {
    console.error('POST /api/investments/[id]/sip error:', error);
    if (error.message === 'Invalid token' || error.message === 'No token provided') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    if (error.message === 'This is not a SIP investment') {
      return NextResponse.json(
        { error: 'This investment is not configured for SIP' },
        { status: 400 }
      );
    }
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: Object.values(error.errors).map(e => e.message) },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to add SIP transaction' },
      { status: 500 }
    );
  }
}

// GET - Get SIP transaction history
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
    const investment = await Investment.findOne({ _id: id, userId });
    if (!investment) {
      return NextResponse.json(
        { error: 'Investment not found or unauthorized' },
        { status: 404 }
      );
    }

    if (!investment.isSIP) {
      return NextResponse.json(
        { error: 'This investment is not configured for SIP' },
        { status: 400 }
      );
    }

    const sipTransactions = investment.sipTransactions.sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    );

    const sipSummary = {
      totalTransactions: sipTransactions.length,
      totalInvested: investment.totalSIPInvested,
      totalUnits: sipTransactions.reduce((sum, t) => sum + t.units, 0),
      averageNav: sipTransactions.length > 0 ? 
        sipTransactions.reduce((sum, t) => sum + t.nav, 0) / sipTransactions.length : 0,
      firstTransaction: sipTransactions[sipTransactions.length - 1]?.date,
      lastTransaction: sipTransactions[0]?.date
    };

    return NextResponse.json({
      investment: {
        _id: investment._id,
        name: investment.name,
        type: investment.type,
        isSIP: investment.isSIP,
        sipAmount: investment.sipAmount,
        sipStartDate: investment.sipStartDate,
        sipFrequency: investment.sipFrequency
      },
      sipTransactions,
      sipSummary
    });
  } catch (error) {
    console.error('GET /api/investments/[id]/sip error:', error);
    if (error.message === 'Invalid token' || error.message === 'No token provided') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch SIP transactions' },
      { status: 500 }
    );
  }
}