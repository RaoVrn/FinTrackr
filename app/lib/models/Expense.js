import mongoose, { Schema } from "mongoose";

const ExpenseSchema = new Schema(
  {
    title: String,
    amount: Number,
    category: String,
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Expense ||
  mongoose.model("Expense", ExpenseSchema);
