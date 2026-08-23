const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

// importing models
const Group = require("../models/Group.model");
const Expense = require("../models/Expense.model");

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

  res.status(200).json(expense);
});

// Creates a new expense
router.post("/", async (req, res, next) => {
  const expense = await Expense.create(req.body);
  res.status(200).json(expense);
});

// Deletes an expense and removes it from its group's groupExpenses list.
// Only the expense's author may delete it.
router.delete("/:groupId/:userId/:expenseId", async (req, res, next) => {
  const { expenseId, groupId } = req.params;

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

  if (expense.expenseAuthor.toString() !== req.payload._id) {
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

  const updatedExpense = await Expense.findByIdAndUpdate(
    expenseId,
    req.body,
    { new: true },
  );

  if (!updatedExpense) {
    res.status(404).json({ message: "Expense not found" });
    return;
  }

  res.status(200).json(updatedExpense);
});

module.exports = router;
