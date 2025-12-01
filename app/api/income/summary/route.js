import { NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db';
import Income from '../../../lib/models/Income';
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

// GET - Income Summary Statistics
export async function GET(request) {
  try {
    await connectDB();
    
    const userId = await getUserFromToken(request);
    
    // Get all income entries for the user
    const allIncomes = await Income.find({ userId, isActive: true })
      .sort({ createdAt: -1 })
      .lean();
    
    // Calculate total income (all time)
    const totalIncome = allIncomes.reduce((sum, income) => sum + income.amount, 0);
    
    // Calculate monthly income (current month)
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const monthlyIncomes = allIncomes.filter(income => {
      const incomeDate = new Date(income.date);
      return incomeDate.getMonth() === currentMonth && 
             incomeDate.getFullYear() === currentYear;
    });
    
    const monthlyIncome = monthlyIncomes.reduce((sum, income) => sum + income.amount, 0);
    
    // Count income sources (unique sources)
    const uniqueSources = new Set(allIncomes.map(income => income.source));
    const incomeSourcesCount = uniqueSources.size;
    
    // Calculate average income per source
    const averageIncomePerSource = incomeSourcesCount > 0 ? totalIncome / incomeSourcesCount : 0;
    
    // Count recurring income
    const recurringIncomes = allIncomes.filter(income => income.isRecurring);
    const recurringIncomeCount = recurringIncomes.length;
    
    // Calculate next expected income (closest next occurrence from recurring incomes)
    let nextExpectedIncome = null;
    if (recurringIncomes.length > 0) {
      const nextOccurrences = recurringIncomes
        .map(income => ({
          ...income,
          nextDate: income.nextOccurrence || income.calculateNextOccurrence?.() || null
        }))
        .filter(income => income.nextDate && income.nextDate > now)
        .sort((a, b) => new Date(a.nextDate) - new Date(b.nextDate));
      
      if (nextOccurrences.length > 0) {
        nextExpectedIncome = {
          title: nextOccurrences[0].title,
          amount: nextOccurrences[0].amount,
          date: nextOccurrences[0].nextDate,
          source: nextOccurrences[0].source,
          frequency: nextOccurrences[0].frequency
        };
      }
    }
    
    // Category breakdown
    const categoryBreakdown = {};
    allIncomes.forEach(income => {
      if (!categoryBreakdown[income.category]) {
        categoryBreakdown[income.category] = {
          amount: 0,
          count: 0
        };
      }
      categoryBreakdown[income.category].amount += income.amount;
      categoryBreakdown[income.category].count += 1;
    });
    
    // Recent income entries (last 5)
    const recentIncomes = allIncomes.slice(0, 5);
    
    const summary = {
      totalIncome,
      monthlyIncome,
      incomeSourcesCount,
      averageIncomePerSource: Math.round(averageIncomePerSource * 100) / 100,
      recurringIncomeCount,
      nextExpectedIncome,
      categoryBreakdown,
      recentIncomes,
      totalEntries: allIncomes.length
    };
    
    return NextResponse.json({ 
      success: true, 
      summary 
    });
    
  } catch (error) {
    console.error('Error fetching income summary:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.message === 'Invalid token' ? 401 : 500 }
    );
  }
}