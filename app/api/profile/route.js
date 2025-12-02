import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import Expense from "@/lib/models/Expense";
import Income from "@/lib/models/Income";
import Budget from "@/lib/models/Budget";
import Investment from "@/lib/models/Investment";
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper function to get user from request headers
function getUserFromRequest(req) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return null;
  }
  
  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);
    return { userId: decoded.userId, email: decoded.email };
  } catch (error) {
    return null;
  }
}

export async function GET(req) {
  try {
    await connectDB();
    
    const user = getUserFromRequest(req);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user data
    const userData = await User.findById(user.userId).select('-password');
    if (!userData) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate financial overview
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    // Get total expenses for current month
    const totalExpenses = await Expense.aggregate([
      {
        $match: {
          userId: user.userId,
          date: {
            $gte: firstDayOfMonth,
            $lte: lastDayOfMonth
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" }
        }
      }
    ]);

    // Get total income for current month
    const totalIncome = await Income.aggregate([
      {
        $match: {
          userId: user.userId,
          date: {
            $gte: firstDayOfMonth,
            $lte: lastDayOfMonth
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" }
        }
      }
    ]);

    // Get active budgets count
    const activeBudgets = await Budget.countDocuments({
      userId: user.userId,
      startDate: { $lte: lastDayOfMonth },
      endDate: { $gte: firstDayOfMonth },
      isActive: true
    });

    // Get total investments
    const totalInvestments = await Investment.aggregate([
      {
        $match: {
          userId: user.userId
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$currentValue" }
        }
      }
    ]);

    const overview = {
      totalExpenses: totalExpenses[0]?.total || 0,
      totalIncome: totalIncome[0]?.total || 0,
      activeBudgets: activeBudgets || 0,
      totalInvestments: totalInvestments[0]?.total || 0,
      monthlyBudget: userData.monthlyIncome || 0,
      savingsRate: 0
    };

    // Calculate savings rate
    if (overview.totalIncome > 0) {
      const savings = overview.totalIncome - overview.totalExpenses;
      overview.savingsRate = Math.max(0, (savings / overview.totalIncome) * 100);
    }

    return Response.json({ 
      success: true, 
      user: userData,
      overview,
      completionPercentage: userData.completionPercentage
    }, { status: 200 });

  } catch (error) {
    console.error('Profile fetch error:', error);
    return Response.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
