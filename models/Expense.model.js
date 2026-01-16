const { Schema, model } = require("mongoose");

const expenseSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    concept: {
      type: String,
      required: true,
      enum: [
        "Housing",
        "Food",
        "Transportation",
        "Utilities",
        "Insurance",
        "Healthcare",
        "Entertainment",
        "Education",
        "Personal Care",
        "Savings",
      ],
    },
    amount: { type: Number, min: 0 },
    group: {
      type: Schema.Types.ObjectId,
      ref: "Group",
    },
    expenseAuthor: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    expenseUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    expensePic: {
      type: String,
      default:
        "https://tgcxojdndrjkwxfwxjvw.supabase.co/storage/v1/object/public/fair-share/profile_picture_6659aedd0ba6e3a417794481_795878.png",
    },
  },
  {
    // this second object adds extra properties: `createdAt` and `updatedAt`
    timestamps: true,
  },
);

module.exports = model("Expense", expenseSchema);
