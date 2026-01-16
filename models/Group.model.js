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
