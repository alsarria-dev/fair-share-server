const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

// importing models
const Group = require("../models/Group.model");
const Expense = require("../models/Expense.model");

// Refs come back either as raw ObjectIds or as populated documents depending on
// the query, so normalise before comparing against the token's user id.
const idOf = (ref) => {
  if (!ref) return null;
  return ref._id ? ref._id.toString() : ref.toString();
};

const isMember = (group, userId) =>
  idOf(group.groupAuthor) === userId ||
  (group.groupUsers || []).some((user) => idOf(user) === userId);

// `expenseAuthor` is the payer, picked from the group's members, so it stays
// client-supplied - access is decided by group membership instead.
const WRITABLE_FIELDS = [
  "name",
  "description",
  "concept",
  "amount",
  "group",
  "expenseAuthor",
  "expenseUsers",
  "expensePic",
];

const pickWritable = (body) => {
  const picked = {};
  for (const field of WRITABLE_FIELDS) {
    if (body[field] !== undefined) picked[field] = body[field];
  }
  return picked;
};

// Confirms the caller belongs to the group an expense sits in.
const callerMayAccess = async (expense, userId) => {
  const groupId = idOf(expense.group);
  if (!groupId) {
    // Ungrouped expense - fall back to the people named on it.
    return (
      idOf(expense.expenseAuthor) === userId ||
      (expense.expenseUsers || []).some((user) => idOf(user) === userId)
    );
  }

  const group = await Group.findById(groupId).select("groupAuthor groupUsers").lean();
  return group ? isMember(group, userId) : false;
};

// Gets a specific expense
router.get("/details/:expenseId", async (req, res, next) => {
  const { expenseId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(expenseId)) {
    res.status(400).json({ message: "Specified id is not valid" });
    return;
  }

  const expense = await Expense.findById(expenseId)
    .populate("expenseAuthor expenseUsers")
    .lean();

  if (!expense) {
    res.status(404).json({ message: "Expense not found" });
    return;
  }

  // Any expense was readable by any logged-in user who could guess an id.
  if (!(await callerMayAccess(expense, req.payload._id))) {
    res.status(403).json({ message: "You are not a member of this group" });
    return;
  }

  res.status(200).json(expense);
});

// Creates a new expense
router.post("/", async (req, res, next) => {
  const payload = pickWritable(req.body);
  const groupId = idOf(payload.group);

  if (!groupId || !mongoose.Types.ObjectId.isValid(groupId)) {
    res.status(400).json({ message: "Specified id is not valid" });
    return;
  }

  const group = await Group.findById(groupId).select("groupAuthor groupUsers").lean();

  if (!group) {
    res.status(404).json({ message: "Group not found" });
    return;
  }

  // Expenses could previously be created against any group.
  if (!isMember(group, req.payload._id)) {
    res.status(403).json({ message: "You are not a member of this group" });
    return;
  }

  const expense = await Expense.create(payload);
  res.status(201).json(expense);
});

// Deletes an expense and removes it from its group's groupExpenses list.
// Only the expense's author may delete it.
router.delete("/:groupId/:userId/:expenseId", async (req, res, next) => {
  const { expenseId, groupId } = req.params;

  // Checks _id is a valid object type for our model
  if (
    !mongoose.Types.ObjectId.isValid(expenseId) ||
    !mongoose.Types.ObjectId.isValid(groupId)
  ) {
    res.status(400).json({ message: "Specified id is not valid" });
    return;
  }

  const expense = await Expense.findById(expenseId);

  if (!expense) {
    res.status(404).json({ message: "Expense not found" });
    return;
  }

  // `expenseAuthor` is optional on the schema, so calling `.toString()` on it
  // directly threw a TypeError (and a 500) for any expense saved without one.
  if (idOf(expense.expenseAuthor) !== req.payload._id) {
    res
      .status(403)
      .json({ message: "Only the expense author can delete this expense" });
    return;
  }

  await Expense.findByIdAndDelete(expenseId);
  await Group.findByIdAndUpdate(
    groupId,
    { $pull: { groupExpenses: expenseId } },
    { new: true },
  );

  res.status(200).json({ message: "Expense deleted successfully" });
});

// Updates an expense
router.put("/:expenseId", async (req, res, next) => {
  const { expenseId } = req.params;

  // Checks _id is a valid object type for our model
  if (!mongoose.Types.ObjectId.isValid(expenseId)) {
    res.status(400).json({ message: "Specified id is not valid" });
    return;
  }

  const expense = await Expense.findById(expenseId);

  if (!expense) {
    res.status(404).json({ message: "Expense not found" });
    return;
  }

  // Mirrors the delete rule, and the check the client already makes.
  if (idOf(expense.expenseAuthor) !== req.payload._id) {
    res
      .status(403)
      .json({ message: "Only the expense author can edit this expense" });
    return;
  }

  const updatedExpense = await Expense.findByIdAndUpdate(
    expenseId,
    pickWritable(req.body),
    { new: true, runValidators: true },
  );

  res.status(200).json(updatedExpense);
});

module.exports = router;
