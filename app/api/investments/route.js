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

// GET - Fetch all investments with portfolio summary
export async function GET(request) {
  try {
    await connectDB();
    
    // Verify JWT token
    const decoded = verifyToken(request);
    const userId = decoded.userId;

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const riskLevel = searchParams.get('riskLevel');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;

    // Build filters
    const filters = { type, riskLevel, category, search };
    Object.keys(filters).forEach(key => {
      if (!filters[key] || filters[key] === 'all') {
        delete filters[key];
      }
    });

    // Get portfolio summary with filters applied
    let portfolioSummary;
    let assetAllocation = [];

    if (typeof Investment.getPortfolioSummary === 'function') {
      portfolioSummary = await Investment.getPortfolioSummary(userId, filters);
      
      if (typeof Investment.getAssetAllocation === 'function') {
        assetAllocation = await Investment.getAssetAllocation(userId);
      }
    } else {
      // Fallback: Manual aggregation if static methods aren't available
      const matchQuery = { userId };
      if (filters.type && filters.type !== 'all') matchQuery.type = filters.type;
      if (filters.riskLevel && filters.riskLevel !== 'all') matchQuery.riskLevel = filters.riskLevel;
      if (filters.search) {
        matchQuery.$or = [
          { name: { $regex: filters.search, $options: 'i' } },
          { tickerSymbol: { $regex: filters.search, $options: 'i' } }
        ];
      }

      const investments = await Investment.find(matchQuery).sort({ createdAt: -1 });
      
      portfolioSummary = {
        totalInvested: investments.reduce((sum, inv) => sum + (inv.investedAmount || 0), 0),
        currentValue: investments.reduce((sum, inv) => sum + (inv.currentValue || 0), 0),
        totalPnL: investments.reduce((sum, inv) => sum + (inv.pnl || 0), 0),
        portfolioCount: investments.length,
        pnlPercent: 0,
        investments: investments
      };

      if (portfolioSummary.totalInvested > 0) {
        portfolioSummary.pnlPercent = (portfolioSummary.totalPnL / portfolioSummary.totalInvested) * 100;
      }
    }
    
    // Apply pagination to investments
    const skip = (page - 1) * limit;
    const investments = portfolioSummary.investments
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(skip, skip + limit);

    return NextResponse.json({
      ...portfolioSummary,
      investments,
      assetAllocation,
      pagination: {
        page,
        limit,
        total: portfolioSummary.portfolioCount,
        pages: Math.ceil(portfolioSummary.portfolioCount / limit)
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
      category,
      sector,
      riskLevel,
      tags,
      purchaseDate,
      investedAmount,
      quantity,
      pricePerUnit,
      fees,
      currentValue,
      isSIP,
      sipAmount,
      sipStartDate,
      sipFrequency,
      expectedSellDate,
      attachmentUrl,
      notes,
      tickerSymbol,
      isin
    } = body;

    // Validate required fields
    if (!name || !type || !purchaseDate || !investedAmount || !currentValue) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type, purchaseDate, investedAmount, and currentValue are required' },
        { status: 400 }
      );
    }

    // Validate SIP fields if isSIP is true
    if (isSIP && (!sipAmount || !sipStartDate || !sipFrequency)) {
      return NextResponse.json(
        { error: 'SIP investments require sipAmount, sipStartDate, and sipFrequency' },
        { status: 400 }
      );
    }

    // Create new investment
    const investmentData = {
      userId,
      name: name.trim(),
      type,
      purchaseDate: new Date(purchaseDate),
      investedAmount: parseFloat(investedAmount),
      currentValue: parseFloat(currentValue),
      riskLevel: riskLevel || 'moderate'
    };

    // Add optional fields
    if (category) investmentData.category = category.trim();
    if (sector) investmentData.sector = sector.trim();
    if (tags && Array.isArray(tags)) investmentData.tags = tags.map(tag => tag.trim());
    if (quantity) investmentData.quantity = parseFloat(quantity);
    if (pricePerUnit) investmentData.pricePerUnit = parseFloat(pricePerUnit);
    if (fees) investmentData.fees = parseFloat(fees);
    if (expectedSellDate) investmentData.expectedSellDate = new Date(expectedSellDate);
    if (attachmentUrl) investmentData.attachmentUrl = attachmentUrl.trim();
    if (notes) investmentData.notes = notes.trim();
    if (tickerSymbol) investmentData.tickerSymbol = tickerSymbol.trim().toUpperCase();
    if (isin) investmentData.isin = isin.trim().toUpperCase();

    // SIP fields
    if (isSIP) {
      investmentData.isSIP = true;
      investmentData.sipAmount = parseFloat(sipAmount);
      investmentData.sipStartDate = new Date(sipStartDate);
      investmentData.sipFrequency = sipFrequency;
    }

    const investment = new Investment(investmentData);
    await investment.save();

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

// PATCH - Update existing investment
export async function PATCH(request) {
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
      if (updateData[field] !== undefined) {
        if (field === 'tags' && Array.isArray(updateData[field])) {
          investment[field] = updateData[field].map(tag => tag.trim());
        } else if (['investedAmount', 'currentValue', 'quantity', 'pricePerUnit', 'fees', 'sipAmount'].includes(field)) {
          investment[field] = parseFloat(updateData[field]);
        } else if (['purchaseDate', 'expectedSellDate', 'sipStartDate'].includes(field)) {
          investment[field] = new Date(updateData[field]);
        } else if (typeof updateData[field] === 'string') {
          investment[field] = updateData[field].trim();
        } else {
          investment[field] = updateData[field];
        }
      }
    });

    await investment.save();

    return NextResponse.json(investment);
  } catch (error) {
    console.error('PATCH /api/investments error:', error);
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
    const investment = await Investment.findOneAndDelete({ _id: id, userId });
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