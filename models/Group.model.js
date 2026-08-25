/**
 * An expense-sharing group: a set of members (`groupUsers`) plus the expenses
 * logged against them (`groupExpenses`). `groupAuthor` is both the creator and
 * the only member authorized to edit/delete the group or transfer authorship
 * (see group.routes.js) — membership alone is not enough for those actions.
 *
 * References: `groupAuthor`/`groupUsers` → User; `groupExpenses` → Expense.
 * Referenced by: `Expense.group`.
 *
 * Key exports: the `Group` model.
 */
const { Schema, model } = require("mongoose");

const groupSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    groupExpenses: [
      {
        type: Schema.Types.ObjectId,
        ref: "Expense",
      },
    ],
    groupAuthor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    groupUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        // Supports `Group.find({ groupUsers: userId })` in group.routes.js —
        // the "groups I belong to" lookup runs on nearly every authenticated request.
        index: true,
      },
    ],
    groupPic: {
      type: String,
      default:
        "https://tgcxojdndrjkwxfwxjvw.supabase.co/storage/v1/object/public/fair-share/profile_picture_6659aedd0ba6e3a417794481_388493.png",
    },
  },
  {
    // this second object adds extra properties: `createdAt` and `updatedAt`
    timestamps: true,
  },
);

module.exports = model("Group", groupSchema);
