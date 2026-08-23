const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

// importing Group.model
const Group = require("../models/Group.model");

// Gets all groups a user belongs to - Home Page
router.get("/:userId", async (req, res, next) => {
  const { userId } = req.params;
  const allGroups = await Group.find({ groupUsers: userId })
    .populate("groupExpenses groupUsers")
    .lean();
  res.status(200).json(allGroups);
});

// Creates new group for expenses - Home Page
router.post("/", async (req, res, next) => {
  const group = await Group.create(req.body);
  res.status(201).json(group);
});

// Gets a specific group based on url params from details page - Details page
router.get("/details/:groupId", async (req, res, next) => {
  const { groupId } = req.params;

  // Checks _id is a valid object type for our model
  if (!mongoose.Types.ObjectId.isValid(groupId)) {
    res.status(400).json({ message: "Specified id is not valid" });
    return;
  }

  const group = await Group.findById(groupId)
    .populate("groupExpenses groupUsers groupAuthor")
    .lean();

  if (!group) {
    res.status(404).json({ message: "Group not found" });
    return;
  }

  res.status(200).json(group);
});

// Updates group information based on url params from details page - Details page
router.put("/:groupId", async (req, res, next) => {
  const { groupId } = req.params;

  // Checks _id is a valid object type for our model
  if (!mongoose.Types.ObjectId.isValid(groupId)) {
    res.status(400).json({ message: "Specified id is not valid" });
    return;
  }

  const updatedGroup = await Group.findByIdAndUpdate(groupId, req.body, {
    new: true,
  });

  if (!updatedGroup) {
    res.status(404).json({ message: "Group not found" });
    return;
  }

  res.status(200).json(updatedGroup);
});

// Adds an expense to a group's groupExpenses list
router.put("/:groupId/:expenseId", async (req, res, next) => {
  const { groupId, expenseId } = req.params;

  const updatedGroup = await Group.findByIdAndUpdate(
    groupId,
    { $push: { groupExpenses: expenseId } },
    { new: true },
  );

  if (!updatedGroup) {
    res.status(404).json({ message: "Group not found" });
    return;
  }

  res.status(200).json(updatedGroup);
});

// Deletes a group - only the group's author may delete it
router.delete("/:groupId", async (req, res, next) => {
  const { groupId } = req.params;

  // Checks _id is a valid object type for our model
  if (!mongoose.Types.ObjectId.isValid(groupId)) {
    res.status(400).json({ message: "Specified id is not valid" });
    return;
  }

  const group = await Group.findById(groupId);

  if (!group) {
    res.status(404).json({ message: "Group not found" });
    return;
  }

  if (group.groupAuthor.toString() !== req.payload._id) {
    res
      .status(403)
      .json({ message: "Only the group author can delete this group" });
    return;
  }

  await Group.findByIdAndDelete(groupId);
  res.status(200).json({ message: "Group deleted successfully" });
});

module.exports = router;
