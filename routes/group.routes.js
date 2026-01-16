const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

// importing Group.model
const Group = require("../models/Group.model");
const Expense = require("../models/Expense.model");

// Routes for groups without req.params

// Gets all projects - Home Page
router.get("/:userId", (req, res, next) => {
  const { userId } = req.params;
  Group.find({ groupUsers: userId })
    .populate("groupExpenses groupUsers")
    .then((allGroups) => res.json(allGroups))
    .catch((error) => res.json(error));
});

// Creates new group for expenses - Home Page
router.post("/", (req, res, next) => {
  Group.create(req.body)
    .then((response) => res.status(201).json(response))
    .catch((error) => res.json(error));
});

// Deletes group - Home Page
router.delete("/:groupId", (req, res, next) => {
  const { groupId } = req.params;
  Group.findByIdAndDelete(groupId)
    .then((response) => res.json(response))
    .catch((error) => res.json(error));
});

// Routes for groups with req.params

// Gets a specific group based on url params from details page - Details page
router.get("/details/:groupId", (req, res, next) => {
  const { groupId } = req.params;

  // Checks _id is a valid object type for our model
  if (!mongoose.Types.ObjectId.isValid(groupId)) {
    res.status(400).json({ message: "Specified id is not valid" });
    return;
  }

  Group.findById(groupId)
    .populate("groupExpenses groupUsers groupAuthor")
    .then((response) => res.json(response))
    .catch((error) => res.json(error));
});

// Updates group information based on url params from details page - Details page
router.put("/:groupId", (req, res, next) => {
  const { groupId } = req.params;

  // Checks _id is a valid object type for our model
  if (!mongoose.Types.ObjectId.isValid(groupId)) {
    res.status(400).json({ message: "Specified id is not valid" });
    return;
  }

  Group.findByIdAndUpdate(groupId, req.body, { new: true })
    .then((response) => res.json(response))
    .catch((error) => res.json(error));
});

router.put("/:groupId/:expenseId", (req, res, next) => {
  const { groupId, expenseId } = req.params;

  Group.findByIdAndUpdate(
    groupId,
    { $push: { groupExpenses: expenseId } },
    { new: true },
  )
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

module.exports = router;
