import { connectDB } from "@/lib/db";
import Expense from "@/lib/models/Expense";

export async function DELETE(req, { params }) {
  try {
    await connectDB();
    await Expense.findByIdAndDelete(params.id);
    return Response.json({ message: "Deleted" });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
