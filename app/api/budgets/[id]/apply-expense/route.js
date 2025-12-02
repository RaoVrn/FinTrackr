import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import Budget from '../../../../lib/models/Budget';
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

// POST - Apply expense to budget (increase spent amount)
export async function POST(request, { params }) {
  try {
    await connectDB();
    
    // Verify JWT token
    const decoded = verifyToken(request);
    const userId = decoded.userId;
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Budget ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { expense } = body;

    if (!expense) {
      return NextResponse.json(
        { success: false, error: 'Expense object is required' },
        { status: 400 }
      );
    }

    const { amount, category, date } = expense;

    // Validate expense data
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid expense amount is required' },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Expense category is required' },
        { status: 400 }
      );
    }

    if (!date) {
      return NextResponse.json(
        { success: false, error: 'Expense date is required' },
        { status: 400 }
      );
    }

    // Find budget (ensure user owns it)
    const budget = await Budget.findOne({ _id: id, userId });
    
    if (!budget) {
      return NextResponse.json(
        { success: false, error: 'Budget not found or unauthorized' },
        { status: 404 }
      );
    }

    // Check if expense category matches budget category
    if (category.toLowerCase() !== budget.category) {
      return NextResponse.json(
        { success: false, error: `Expense category '${category}' does not match budget category '${budget.category}'` },
        { status: 400 }
      );
    }

    // Check if expense date is within budget period
    const expenseDate = new Date(date);
    if (!budget.isWithinPeriod(expenseDate)) {
      return NextResponse.json(
        { success: false, error: 'Expense date is outside budget period' },
        { status: 400 }
      );
    }

    // Store previous state for alert checking
    const previousSpent = budget.spent;
    const previousPercentage = budget.progressPercentage;

    // Apply expense to budget
    await budget.addExpense(parseFloat(amount));

    // Check for threshold alerts
    const alerts = [];
    const newPercentage = budget.progressPercentage;

    // Check if any thresholds were crossed
    if (budget.alert50 && previousPercentage < 50 && newPercentage >= 50) {
      alerts.push({ type: '50', message: '50% of budget used', percentage: 50 });
    }
    
    if (budget.alert75 && previousPercentage < 75 && newPercentage >= 75) {
      alerts.push({ type: '75', message: '75% of budget used', percentage: 75 });
    }
    
    if (budget.alert100 && previousPercentage < 100 && newPercentage >= 100) {
      alerts.push({ type: '100', message: 'Budget fully used', percentage: 100 });
    }
    
    if (budget.alertExceeded && !budget.isOverBudget && (previousSpent < budget.amount && budget.spent > budget.amount)) {
      alerts.push({ type: 'exceeded', message: 'Budget exceeded!', percentage: newPercentage });
    }

    // Calculate progress info
    const progressInfo = {
      progressPercentage: budget.progressPercentage,
      remaining: budget.remaining,
      isOverBudget: budget.isOverBudget,
      status: budget.status,
      progressColor: budget.getProgressColor()
    };

    return NextResponse.json({
      success: true,
      budget: {
        ...budget.toObject(),
        ...progressInfo
      },
      alerts,
      message: 'Expense applied to budget successfully'
    });

  } catch (error) {
    console.error('POST /api/budgets/[id]/apply-expense error:', error);
    if (error.message === 'Invalid token' || error.message === 'No token provided') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to apply expense to budget' },
      { status: 500 }
    );
  }
}