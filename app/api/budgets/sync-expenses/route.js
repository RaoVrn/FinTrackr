import { NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db';
import Budget from '../../../lib/models/Budget';
import Expense from '../../../lib/models/Expense';
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

// POST - Sync all expenses with their matching budgets
export async function POST(request) {
  try {
    await connectDB();
    
    // Verify JWT token
    const decoded = verifyToken(request);
    const userId = decoded.userId;

    // Get all budgets for this user (active by default or explicitly active)
    const budgets = await Budget.find({ 
      userId,
      $or: [
        { isActive: true },
        { isActive: { $exists: false } } // Handle budgets created before isActive field was added
      ]
    });

    // Get all expenses for this user for debugging
    const allExpenses = await Expense.find({ userId });
    
    // Also check if there are expenses outside current month
    const currentMonth = new Date();
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    
    const expensesThisMonth = await Expense.find({ 
      userId,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });
    // Reset all budget spent amounts to 0
    await Budget.updateMany(
      { 
        userId,
        $or: [
          { isActive: true },
          { isActive: { $exists: false } }
        ]
      },
      { $set: { spent: 0 } }
    );

    let totalExpensesSynced = 0;
    let budgetsUpdated = 0;
    const syncResults = [];

    // For each budget, find matching expenses and recalculate spent amount
    for (const budget of budgets) {
      // Find expenses that match this budget's category and date range
      // Create multiple search patterns for better matching
      const searchPatterns = [
        { category: budget.category }, // Exact match
        { category: { $regex: new RegExp(`^${budget.category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }, // Case insensitive exact match
      ];
      
      // Add variations for common category formats
      const budgetCatLower = budget.category.toLowerCase();
      
      // Food & Dining variations
      if (budgetCatLower === 'food & dining' || budgetCatLower === 'food') {
        searchPatterns.push({ category: 'Food & Dining' });
        searchPatterns.push({ category: 'food' });
        searchPatterns.push({ category: 'Food' });
        searchPatterns.push({ category: 'FOOD & DINING' });
        searchPatterns.push({ category: 'fooddining' });
      }
      
      // Transportation variations
      if (budgetCatLower === 'transportation' || budgetCatLower === 'transport') {
        searchPatterns.push({ category: 'Transportation' });
        searchPatterns.push({ category: 'Transport' });
        searchPatterns.push({ category: 'TRANSPORTATION' });
        searchPatterns.push({ category: 'transport' });
      }
      
      // Groceries variations
      if (budgetCatLower === 'groceries') {
        searchPatterns.push({ category: 'Groceries' });
        searchPatterns.push({ category: 'GROCERIES' });
        searchPatterns.push({ category: 'groceries' });
      }
      
      // Get all expenses in date range for debugging
      const allExpensesInRange = await Expense.find({
        userId,
        date: {
          $gte: budget.startDate,
          $lte: budget.endDate
        }
      });
      

      
      const matchingExpenses = await Expense.find({
        userId,
        $and: [
          { $or: searchPatterns },
          {
            date: {
              $gte: budget.startDate,
              $lte: budget.endDate
            }
          }
        ]
      });



      if (matchingExpenses.length > 0) {
        // Calculate total spent for this budget
        const totalSpent = matchingExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        
        // Use atomic update to ensure immediate consistency
        await Budget.findByIdAndUpdate(
          budget._id,
          { 
            spent: totalSpent,
            updatedAt: new Date()
          },
          { 
            new: true,
            runValidators: true,
            writeConcern: { w: 'majority', j: true }
          }
        );
        
        // Update the local budget object
        budget.spent = totalSpent;
        
        budgetsUpdated++;
        totalExpensesSynced += matchingExpenses.length;
        
        syncResults.push({
          budgetId: budget._id,
          category: budget.category,
          expensesCount: matchingExpenses.length,
          totalSpent: totalSpent,
          budgetAmount: budget.amount,
          progressPercentage: budget.progressPercentage,
          status: budget.status
        });
        
      }
    }

    // Force database to flush all writes before completing
    if (budgetsUpdated > 0) {
      // Wait for all writes to be committed
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Force refresh of all updated budgets to ensure consistency
      await Budget.find({ userId }).lean(false).exec();
    }

    return NextResponse.json({
      success: true,
      message: 'Expenses synced with budgets successfully',
      summary: {
        budgetsUpdated,
        totalExpensesSynced,
        budgetsProcessed: budgets.length
      },
      syncResults
    });

  } catch (error) {
    console.error('POST /api/budgets/sync-expenses error:', error);
    
    if (error.message === 'Invalid token' || error.message === 'No token provided') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to sync expenses with budgets' },
      { status: 500 }
    );
  }
}