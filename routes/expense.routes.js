const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

// importing Group.model
const Group = require("../models/Group.model");
const Expense = require("../models/Expense.model");

// Routes for groups without req.params

// Gets all expenses
router.get("/details/:expenseId", (req, res, next) => {
  const { expenseId } = req.params;
  Expense.findById(expenseId)
    .populate("expenseAuthor expenseUsers")
    .then((allExpenses) => res.json(allExpenses))
    .catch((error) => res.json(error));
});

// Creates a new expense and updates group collection that the expense is part of
router.post("/", (req, res, next) => {
  // const { name, concept,description, amount, group, expenseAuthor, expenseUsers } = req.body;

  Expense.create(req.body)
    .then((response) => res.status(200).json(response))
    .catch((error) => res.json(error));
});

// Deletes expense
router.delete("/:groupId/:userId/:expenseId", (req, res, next) => {
  const { expenseId, userId, groupId } = req.params;

  // Checks _id is a valid object type for our model
  if (!mongoose.Types.ObjectId.isValid(expenseId)) {
    res.status(400).json({ message: "Specified id is not valid" });
    return;
  }

  // Only admin can delete group, we sent the userid through the request and check if it is
  // an admin of the group that wants to delete
  Expense.findByIdAndDelete(expenseId)
    .then((response) => {
      // if (response.expenseAuthor !== userId) {
      //     res.status(400).json({ message: [groupId, userId, expenseId] })
      //     return;
      // };

      // return promise here to concatonate next promises
      return Group.findByIdAndUpdate(
        groupId,
        { $pull: { groupExpenses: expenseId } },
        { new: true },
      );
    })
    .then((deletedExpense) => res.status(202).json({ message: "lol" }))
    .catch((error) => res.json(error));
});

// Routes for groups with req.params

// Gets a specific group based on url params from details page - Details page
router.get("/:groupId", (req, res, next) => {
  const { groupId } = req.params;

  // Checks _id is a valid object type for our model
  if (!mongoose.Types.ObjectId.isValid(groupId)) {
    res.status(400).json({ message: "Specified id is not valid" });
    return;
  }

  Group.findById(groupId)
    .populate("groupExpenses groupUsers")
    .then((response) => res.json(response))
    .catch((error) => res.json(error));
});

// Updates group information based on url params from details page - Details page
router.put("/:expenseId", (req, res, next) => {
  const { expenseId } = req.params;

  // Checks _id is a valid object type for our model
  if (!mongoose.Types.ObjectId.isValid(expenseId)) {
    res.status(400).json({ message: "Specified id is not valid" });
    return;
  }

  Expense.findByIdAndUpdate(expenseId, req.body, { new: true })
    .then((response) => res.json(response))
    .catch((error) => res.json(error));
});

// Deletes group based on params from details page - Details page
router.delete("/:groupId", (req, res, next) => {
  const { userId } = req.body;
  const { groupId } = req.params;

  // Checks _id is a valid object type for our model
  if (!mongoose.Types.ObjectId.isValid(groupId)) {
    res.status(400).json({ message: "Specified id is not valid" });
    return;
  }

  // Only admin can delete group, we sent the userid through the request and check if it is
  // an admin of the group that wants to delete
  Group.findById(groupId)
    .then((response) => {
      if (response.admin != userId) {
        res
          .status(400)
          .json({ message: "You are not an admin for this group" });
        return;
      }

      return Group.findByIdAndDelete(groupId);
    })
    .then((deletedGroup) => res.status(202).json(deletedGroup))
    .catch((error) => res.json(error));
});

//to dos: put request with expense id, delete request  with expense id, post request group id
router.put("/expense/:expenseId", (req, res, next) => {
  const { expenseId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(expenseId)) {
    res.status(400).json({ message: "Specified id is not valid" });
    return;
  }

  Expense.findByIdAndUpdate(expenseId, req.body, { new: true })
    .then((updatedExpense) => res.json(updatedExpense))
    .catch((error) => res.json(error));
});

router.delete("/expense/:expenseId", (req, res, next) => {
  const { expenseId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(expenseId)) {
    res.status(400).json({ message: "Specified id is not valid" });
    return;
  }

  Expense.findByIdAndDelete(expenseId)
    .then((deletedExpense) => res.status(202).json(deletedExpense))
    .catch((error) => res.json(error));
});

module.exports = router;
