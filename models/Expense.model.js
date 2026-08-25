/**
 * A single expense: what was spent, its budget category, which group it
 * belongs to, and who paid / who it's split between.
 *
 * References: `group` → Group; `expenseAuthor`/`expenseUsers` → User.
 * Referenced by: `Group.groupExpenses`.
 *
 * Key exports: the `Expense` model.
 *
 * TODO(doc): `amount` has no `required: true`, unlike every other core field
 * on this model and its siblings (User/Group). Unclear whether an
 * amount-less expense is an intentional draft/placeholder state or an
 * oversight — flagging rather than assuming either way.
 */
const { Schema, model } = require("mongoose");

const expenseSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    // Free-text `concept` would let expenses drift into inconsistent
    // categories over time; the fixed enum keeps them groupable/reportable.
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
    // Singular `group`, not `groupId` — some request bodies/older docs use
    // `groupId`, but this schema field is the source of truth.
    group: {
      type: Schema.Types.ObjectId,
      ref: "Group",
    },
    // The payer, chosen from the group's members — a business field, not an
    // ownership flag. It's optional on the schema, so route code normalizes
    // it through the shared `idOf()` helper rather than assuming it's set.
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
