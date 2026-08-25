/**
 * A registered account. The only entity that authenticates — Groups and
 * Expenses reference a User by id but never embed one, so this is the sole
 * place profile data (name, contact info, password hash) lives.
 *
 * Referenced by: `Group.groupAuthor`/`groupUsers`, `Expense.expenseAuthor`/`expenseUsers`.
 *
 * Key exports: the `User` model.
 */
const { Schema, model } = require("mongoose");

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    lastName: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    phoneNumber: { type: String, required: true },
    profilePic: {
      type: String,
      default:
        "https://tgcxojdndrjkwxfwxjvw.supabase.co/storage/v1/object/public/fair-share/profile_picture_6659aedd0ba6e3a417794481_4391.png",
    },
    email: { type: String, unique: true, required: true },
    // `select: false` hides the hash from every query by default — including
    // populated `groupUsers`/`expenseUsers`/`expenseAuthor`/`groupAuthor` docs
    // elsewhere — so no route can accidentally leak it. auth.routes.js's login
    // handler is the one place that opts back in via `.select("+password")`.
    password: { type: String, required: true, select: false },
  },
  {
    // this second object adds extra properties: `createdAt` and `updatedAt`
    timestamps: true,
  },
);

module.exports = model("User", userSchema);
