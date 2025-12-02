import { NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db';
import Budget from '../../../lib/models/Budget';
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

// POST - Force refresh budgets with guaranteed fresh data
export async function POST(request) {
  try {
    await connectDB();
    
    // Verify JWT token
    const decoded = verifyToken(request);
    const userId = decoded.userId;

    // Force complete refresh - bypass all MongoDB caching mechanisms
    const budgets = await Budget.aggregate([
      {
        $match: {
          userId,
          $or: [
            { isActive: true },
            { isActive: { $exists: false } }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]);

    // Calculate summary
    const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);
    const totalSpent = budgets.reduce((sum, budget) => sum + (budget.spent || 0), 0);
    const totalRemaining = totalBudget - totalSpent;

    const summary = {
      totalBudget,
      totalSpent,
      totalRemaining,
      categoriesCount: new Set(budgets.map(budget => budget.category)).size,
      budgetsCount: budgets.length
    };

    return NextResponse.json({
      success: true,
      budgets,
      summary,
      message: 'Budgets refreshed with guaranteed fresh data'
    });

  } catch (error) {
    console.error('POST /api/budgets/refresh error:', error);
    if (error.message === 'Invalid token' || error.message === 'No token provided') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to refresh budgets' },
      { status: 500 }
    );
  }
}