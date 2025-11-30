import mongoose, { Schema } from "mongoose";

const ExpenseSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    userId: {
      type: String,
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Expense ||
  mongoose.model("Expense", ExpenseSchema);
