import { connectDB } from "@/lib/db";
import Expense from "@/lib/models/Expense";

// Helper function to get user from request headers
function getUserFromRequest(req) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return null;
  }
  
  try {
    // Simple token format: "Bearer {userId}:{email}"
    const token = authHeader.replace('Bearer ', '');
    const [userId, email] = token.split(':');
    return { userId, email };
  } catch (error) {
    return null;
  }
}

export async function POST(req) {
  try {
    await connectDB();
    
    // Get user from auth header
    const user = getUserFromRequest(req);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    const expense = await Expense.create({
      ...body,
      userId: user.userId,
      userEmail: user.email,
    });
    
    return Response.json(expense, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    await connectDB();
    
    // Get user from auth header
    const user = getUserFromRequest(req);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Only return expenses for the authenticated user
    const data = await Expense.find({ userId: user.userId }).sort({ createdAt: -1 });
    return Response.json(data, { status: 200 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
