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

export async function GET(req, { params }) {
  try {
    await connectDB();
    
    // Get user from auth header
    const user = getUserFromRequest(req);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const expense = await Expense.findOne({ _id: params.id, userId: user.userId });
    if (!expense) {
      return Response.json({ error: 'Expense not found' }, { status: 404 });
    }
    
    return Response.json(expense, { status: 200 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    await connectDB();
    
    // Get user from auth header
    const user = getUserFromRequest(req);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    
    // Only allow updating user's own expenses
    const expense = await Expense.findOneAndUpdate(
      { _id: params.id, userId: user.userId },
      { ...body, userId: user.userId, userEmail: user.email, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!expense) {
      return Response.json({ error: 'Expense not found' }, { status: 404 });
    }
    
    return Response.json(expense, { status: 200 });
  } catch (error) {
    console.error('Error updating expense:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = {};
      Object.keys(error.errors).forEach(key => {
        errors[key] = error.errors[key].message;
      });
      return Response.json({ error: 'Validation failed', details: errors }, { status: 400 });
    }
    
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    await connectDB();
    
    // Get user from auth header
    const user = getUserFromRequest(req);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    const { title, amount, category, description, needOrWant, date } = body;

    // Basic validation
    if (title !== undefined && !title.trim()) {
      return Response.json({ error: 'Title cannot be empty' }, { status: 400 });
    }
    
    if (amount !== undefined && amount <= 0) {
      return Response.json({ error: 'Amount must be greater than 0' }, { status: 400 });
    }

    // Only allow updating user's own expenses
    const expense = await Expense.findOneAndUpdate(
      { _id: params.id, userId: user.userId },
      { 
        ...(title !== undefined && { title: title.trim() }),
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(category !== undefined && { category }),
        ...(description !== undefined && { description: description.trim() }),
        ...(needOrWant !== undefined && { needOrWant }),
        ...(date !== undefined && { date }),
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );
    
    if (!expense) {
      return Response.json({ error: 'Expense not found' }, { status: 404 });
    }
    
    return Response.json(expense, { status: 200 });
  } catch (error) {
    console.error('Error updating expense:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = {};
      Object.keys(error.errors).forEach(key => {
        errors[key] = error.errors[key].message;
      });
      return Response.json({ error: 'Validation failed', details: errors }, { status: 400 });
    }
    
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectDB();
    
    // Get user from auth header
    const user = getUserFromRequest(req);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Only allow deleting user's own expenses
    const expense = await Expense.findOneAndDelete({ _id: params.id, userId: user.userId });
    
    if (!expense) {
      return Response.json({ error: 'Expense not found' }, { status: 404 });
    }
    
    return Response.json({ message: "Expense deleted successfully" }, { status: 200 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
