const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

// importing Group.model
const Group = require("../models/Group.model");

// Refs come back either as raw ObjectIds or as populated documents depending on
// the query, so normalise before comparing against the token's user id.
const idOf = (ref) => {
  if (!ref) return null;
  return ref._id ? ref._id.toString() : ref.toString();
};

const isMember = (group, userId) =>
  idOf(group.groupAuthor) === userId ||
  (group.groupUsers || []).some((user) => idOf(user) === userId);

// Fields a client may set. `req.body` was previously written through verbatim,
// which let a caller forge `groupAuthor` or overwrite `groupExpenses`.
const WRITABLE_FIELDS = ["name", "description", "groupUsers", "groupPic"];

const pickWritable = (body) => {
  const picked = {};
  for (const field of WRITABLE_FIELDS) {
    if (body[field] !== undefined) picked[field] = body[field];
  }
  return picked;
};

// Gets all groups a user belongs to - Home Page
router.get("/:userId", async (req, res, next) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400).json({ message: "Specified id is not valid" });
    return;
  }

  // This listed any user's groups to any logged-in caller.
  if (userId !== req.payload._id) {
    res.status(403).json({ message: "You can only list your own groups" });
    return;
  }

  const allGroups = await Group.find({ groupUsers: userId })
    .populate("groupExpenses groupUsers")
    .lean();
  res.status(200).json(allGroups);
});

// Creates new group for expenses - Home Page
router.post("/", async (req, res, next) => {
  // The author is whoever is holding the token, never whatever the body claims.
  const groupAuthor = req.payload._id;
  const payload = pickWritable(req.body);

  // The author has to be a member, otherwise the group never shows up in their
  // own list (which is queried by `groupUsers`).
  const groupUsers = Array.isArray(payload.groupUsers) ? payload.groupUsers : [];
  payload.groupUsers = groupUsers.some((user) => idOf(user) === groupAuthor)
    ? groupUsers
    : [...groupUsers, groupAuthor];

  const group = await Group.create({ ...payload, groupAuthor });
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

  // Any group - along with every member's details - used to be readable by any
  // logged-in user who could guess an id.
  if (!isMember(group, req.payload._id)) {
    res.status(403).json({ message: "You are not a member of this group" });
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

  const group = await Group.findById(groupId);

  if (!group) {
    res.status(404).json({ message: "Group not found" });
    return;
  }

  // Any logged-in user could edit any group, including reassigning its author
  // to themselves.
  if (idOf(group.groupAuthor) !== req.payload._id) {
    res
      .status(403)
      .json({ message: "Only the group author can edit this group" });
    return;
  }

  const updates = pickWritable(req.body);

  // Handing the group over to another admin is a legitimate action, but only
  // the current author may do it and only to an existing member.
  if (req.body.groupAuthor !== undefined) {
    const nextAuthor = idOf(req.body.groupAuthor);
    const members = (updates.groupUsers || group.groupUsers).map(idOf);

    if (!nextAuthor || !mongoose.Types.ObjectId.isValid(nextAuthor)) {
      res.status(400).json({ message: "Specified id is not valid" });
      return;
    }

    // Re-sending the current author is a no-op save from the details page, so
    // allow it even for older groups whose author was never added to groupUsers.
    if (nextAuthor !== idOf(group.groupAuthor) && !members.includes(nextAuthor)) {
      res
        .status(400)
        .json({ message: "The new admin must be a member of the group" });
      return;
    }

    updates.groupAuthor = nextAuthor;
  }

  const updatedGroup = await Group.findByIdAndUpdate(groupId, updates, {
    new: true,
    runValidators: true,
  });

  res.status(200).json(updatedGroup);
});

// Adds an expense to a group's groupExpenses list
router.put("/:groupId/:expenseId", async (req, res, next) => {
  const { groupId, expenseId } = req.params;

  if (
    !mongoose.Types.ObjectId.isValid(groupId) ||
    !mongoose.Types.ObjectId.isValid(expenseId)
  ) {
    res.status(400).json({ message: "Specified id is not valid" });
    return;
  }

  const group = await Group.findById(groupId);

  if (!group) {
    res.status(404).json({ message: "Group not found" });
    return;
  }

  // Without this, anyone could attach an expense to any group.
  if (!isMember(group, req.payload._id)) {
    res.status(403).json({ message: "You are not a member of this group" });
    return;
  }

  // `$addToSet` rather than `$push` so a retried request can't list the same
  // expense on the group twice.
  const updatedGroup = await Group.findByIdAndUpdate(
    groupId,
    { $addToSet: { groupExpenses: expenseId } },
    { new: true },
  );

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

  if (idOf(group.groupAuthor) !== req.payload._id) {
    res
      .status(403)
      .json({ message: "Only the group author can delete this group" });
    return;
  }

  await Group.findByIdAndDelete(groupId);
  res.status(200).json({ message: "Group deleted successfully" });
});

module.exports = router;
