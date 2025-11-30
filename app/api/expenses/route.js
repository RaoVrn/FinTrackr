import { connectDB } from "@/lib/db";
import Expense from "@/lib/models/Expense";

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const expense = await Expense.create(body);
    return Response.json(expense, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectDB();
    const data = await Expense.find().sort({ createdAt: -1 });
    return Response.json(data, { status: 200 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
