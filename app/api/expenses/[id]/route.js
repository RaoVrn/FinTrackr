import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../lib/db";
import Expense from "../../../lib/models/Expense";
import Budget from "../../../lib/models/Budget";
import mongoose from "mongoose";
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

// Helper function to validate ObjectId
function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// GET single expense
export async function GET(request, { params }) {
  try {
    await connectDB();
    
    const decoded = verifyToken(request);
    const user = { userId: decoded.userId, email: decoded.email };
    
    const { id } = params;
    
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'Invalid expense ID' },
        { status: 400 }
      );
    }
    
    const expense = await Expense.findOne({
      _id: id,
      userId: user.userId
    });
    
    if (!expense) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ expense });
  } catch (error) {
    console.error('Error fetching expense:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}

// PATCH (update) expense
export async function PATCH(request, { params }) {
  try {
    await connectDB();
    
    const decoded = verifyToken(request);
    const user = { userId: decoded.userId, email: decoded.email };
    
    const { id } = params;
    
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'Invalid expense ID' },
        { status: 400 }
      );
    }
    
    // Check if expense exists and belongs to user
    const existingExpense = await Expense.findOne({
      _id: id,
      userId: user.userId
    });
    
    if (!existingExpense) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      );
    }
    
    const body = await request.json();
    
    // Prepare update data (only include provided fields)
    const updateData = {};
    
    if (body.title !== undefined) {
      if (!body.title.trim()) {
        return NextResponse.json(
          { error: 'Title cannot be empty' },
          { status: 400 }
        );
      }
      updateData.title = body.title.trim();
    }
    
    if (body.amount !== undefined) {
      const amount = parseFloat(body.amount);
      if (amount <= 0) {
        return NextResponse.json(
          { error: 'Amount must be greater than 0' },
          { status: 400 }
        );
      }
      updateData.amount = amount;
    }
    
    if (body.category !== undefined) {
      updateData.category = body.category;
    }
    
    if (body.date !== undefined) {
      const date = new Date(body.date);
      if (isNaN(date.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format' },
          { status: 400 }
        );
      }
      updateData.date = date;
    }
    
    if (body.time !== undefined) {
      if (body.time && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(body.time)) {
        return NextResponse.json(
          { error: 'Time must be in HH:MM format' },
          { status: 400 }
        );
      }
      updateData.time = body.time || undefined;
    }
    
    if (body.paymentMethod !== undefined) {
      updateData.paymentMethod = body.paymentMethod;
    }
    
    if (body.account !== undefined) {
      updateData.account = body.account?.trim() || undefined;
    }
    
    if (body.merchant !== undefined) {
      updateData.merchant = body.merchant?.trim() || undefined;
    }
    
    if (body.notes !== undefined) {
      updateData.notes = body.notes?.trim() || undefined;
    }
    
    if (body.isRecurring !== undefined) {
      updateData.isRecurring = Boolean(body.isRecurring);
      // If setting to not recurring, clear the interval
      if (!updateData.isRecurring) {
        updateData.recurringInterval = undefined;
      }
    }
    
    if (body.recurringInterval !== undefined) {
      if (updateData.isRecurring !== false && (existingExpense.isRecurring || updateData.isRecurring)) {
        updateData.recurringInterval = body.recurringInterval;
      }
    }
    
    if (body.needOrWant !== undefined) {
      updateData.needOrWant = body.needOrWant;
    }
    
    if (body.hasReceipt !== undefined) {
      updateData.hasReceipt = Boolean(body.hasReceipt);
    }
    
    if (body.receiptUrl !== undefined) {
      updateData.receiptUrl = body.receiptUrl || undefined;
    }
    
    if (body.currency !== undefined) {
      updateData.currency = body.currency;
    }
    
    // Handle budget synchronization for updates
    let budgetUpdates = [];
    
    try {
      // Find old budget and reverse the expense
      const oldBudget = await Budget.findForExpense(user.userId, existingExpense.category, existingExpense.date);
      if (oldBudget) {
        await oldBudget.removeExpense(existingExpense.amount);
        budgetUpdates.push({
          budgetId: oldBudget._id,
          category: oldBudget.category,
          action: 'removed',
          amount: existingExpense.amount,
          newSpent: oldBudget.spent,
          remaining: oldBudget.remaining
        });
      }
    } catch (budgetError) {
      console.error('Error removing from old budget:', budgetError);
    }
    
    const updatedExpense = await Expense.findOneAndUpdate(
      { _id: id, userId: user.userId },
      updateData,
      { new: true, runValidators: true }
    );
    
    try {
      // Find new budget and apply the updated expense
      const newBudget = await Budget.findForExpense(user.userId, updatedExpense.category, updatedExpense.date);
      if (newBudget) {
        await newBudget.addExpense(updatedExpense.amount);
        budgetUpdates.push({
          budgetId: newBudget._id,
          category: newBudget.category,
          action: 'added',
          amount: updatedExpense.amount,
          newSpent: newBudget.spent,
          remaining: newBudget.remaining,
          status: newBudget.calculateStatus()
        });
      }
    } catch (budgetError) {
      console.error('Error adding to new budget:', budgetError);
    }
    
    return NextResponse.json({
      message: 'Expense updated successfully',
      expense: updatedExpense,
      budgetUpdates
    });
  } catch (error) {
    console.error('Error updating expense:', error);
    
    if (error.message === 'Invalid token' || error.message === 'No token provided') {
      return NextResponse.json(
        { error: 'Unauthorized. Please login to continue.' },
        { status: 401 }
      );
    }
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = {};
      Object.keys(error.errors).forEach(key => {
        validationErrors[key] = error.errors[key].message;
      });
      return NextResponse.json(
        { error: 'Validation failed', details: validationErrors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}

// DELETE expense
export async function DELETE(request, { params }) {
  try {
    await connectDB();
    
    const decoded = verifyToken(request);
    const user = { userId: decoded.userId, email: decoded.email };
    
    const { id } = params;
    
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'Invalid expense ID' },
        { status: 400 }
      );
    }
    
    // Get expense data before deletion
    const expense = await Expense.findOne({
      _id: id,
      userId: user.userId
    });
    
    if (!expense) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      );
    }
    
    // Delete the expense
    const deletedExpense = await Expense.findOneAndDelete({
      _id: id,
      userId: user.userId
    });
    
    // Update related budget
    let budgetUpdate = null;
    
    try {
      const relatedBudget = await Budget.findForExpense(user.userId, expense.category, expense.date);
      if (relatedBudget) {
        await relatedBudget.removeExpense(expense.amount);
        budgetUpdate = {
          budgetId: relatedBudget._id,
          category: relatedBudget.category,
          amount: expense.amount,
          newSpent: relatedBudget.spent,
          remaining: relatedBudget.remaining,
          status: relatedBudget.calculateStatus()
        };
      }
    } catch (budgetError) {
      console.error('Error updating budget after deletion:', budgetError);
    }
    
    return NextResponse.json({
      message: 'Expense deleted successfully',
      deletedExpense: {
        id: deletedExpense._id,
        title: deletedExpense.title,
        amount: deletedExpense.amount
      },
      budgetUpdate
    });
  } catch (error) {
    console.error('Error deleting expense:', error);
    
    if (error.message === 'Invalid token' || error.message === 'No token provided') {
      return NextResponse.json(
        { error: 'Unauthorized. Please login to continue.' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}