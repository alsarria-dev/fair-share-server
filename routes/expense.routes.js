/**
 * Expense endpoints: read/create/update/delete expenses.
 *
 * Mounted at `/expenses` behind `isAuthenticated` in app.js. Unlike groups,
 * access here is NOT decided by `expenseAuthor` (that field is just "who
 * paid" — a business fact chosen from the group's members, so it's writable
 * by the caller). Reading or creating an expense instead requires membership
 * of the *group* it belongs to; editing/deleting are the one exception,
 * restricted to the expense's author specifically.
 *
 * Key exports: an Express Router with `GET /details/:expenseId`, `POST /`,
 * `DELETE /:groupId/:userId/:expenseId`, `PUT /:expenseId`.
 */
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

// importing models
const Group = require("../models/Group.model");
const Expense = require("../models/Expense.model");

/**
 * Normalizes a User/Group reference to a plain id string, regardless of
 * whether Mongoose returned it as a raw ObjectId or, via `.populate()`, as a
 * full document. (Duplicated from group.routes.js rather than shared, since
 * there's no common `utils/` module for route helpers in this codebase yet.)
 *
 * @param {import("mongoose").Types.ObjectId|{_id: import("mongoose").Types.ObjectId}|null|undefined} ref
 * @returns {string|null} the id as a string, or `null` if `ref` is falsy
 */
const idOf = (ref) => {
  if (!ref) return null;
  return ref._id ? ref._id.toString() : ref.toString();
};

/**
 * Whether a user is a group's author or one of its members.
 *
 * @param {{groupAuthor: *, groupUsers?: Array}} group
 * @param {string} userId - a plain id string (typically `req.payload._id`)
 * @returns {boolean}
 */
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

/**
 * Filters a request body down to `WRITABLE_FIELDS` before it can reach a
 * create/update call.
 *
 * @param {Record<string, *>} body - raw `req.body`
 * @returns {Record<string, *>} only the keys present in `WRITABLE_FIELDS`
 */
const pickWritable = (body) => {
  const picked = {};
  for (const field of WRITABLE_FIELDS) {
    if (body[field] !== undefined) picked[field] = body[field];
  }
  return picked;
};

/**
 * Confirms the caller belongs to the group an expense sits in — the actual
 * access check for reading/creating expenses (see the file header).
 *
 * @param {{group: *, expenseAuthor?: *, expenseUsers?: Array}} expense
 * @param {string} userId - a plain id string (typically `req.payload._id`)
 * @returns {Promise<boolean>}
 */
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

/**
 * GET /expenses/details/:expenseId
 * Fetches one expense's full details.
 *
 * @access Private — any member of the expense's group (see `callerMayAccess`)
 * @param {string} expenseId - route param, must be a valid MongoDB ObjectId
 * @returns 200 with the expense, populated with `expenseAuthor` and
 *   `expenseUsers`; 400 for a malformed id; 403 if the caller isn't a member
 *   of the expense's group; 404 if no such expense exists.
 */
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

/**
 * POST /expenses/
 * Creates a new expense on a group the caller belongs to.
 *
 * @access Private — any member of the target group
 * @body {string} name, description, concept, group - required (`concept`
 *   must be one of the schema's fixed category enum; `group` is the target
 *   group's id)
 * @body {number} [amount], {string} [expenseAuthor] (payer, chosen from the
 *   group's members), {string[]} [expenseUsers], {string} [expensePic]
 * @returns 201 with the created expense; 400 if `group` is missing/invalid;
 *   403 if the caller isn't a member of that group; 404 if the group doesn't exist.
 *
 * Note: this does not also add the new expense to the group's
 * `groupExpenses` list — that's a separate step via
 * `PUT /groups/:groupId/:expenseId`.
 */
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

/**
 * DELETE /expenses/:groupId/:userId/:expenseId
 * Deletes an expense and pulls it from its group's `groupExpenses` list.
 *
 * @access Private — `expenseAuthor` only
 * @param {string} groupId - the expense's group, used only to pull the
 *   deleted expense's id back out of `groupExpenses`
 * @param {string} userId - accepted but currently unused by the handler
 * @param {string} expenseId - route param, must be a valid MongoDB ObjectId
 * @returns 200 with `{ message }` on success; 400 for a malformed
 *   `expenseId`/`groupId`; 403 if the caller isn't the expense's author;
 *   404 if no such expense exists.
 */
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

/**
 * PUT /expenses/:expenseId
 * Updates an expense's editable fields.
 *
 * @access Private — `expenseAuthor` only
 * @param {string} expenseId - route param, must be a valid MongoDB ObjectId
 * @body {string} [name], [description], [concept], [group], [expenseAuthor],
 *   [expensePic]; {number} [amount]; {string[]} [expenseUsers]
 * @returns 200 with the updated expense; 400 for a malformed id; 403 if the
 *   caller isn't the expense's author; 404 if no such expense exists.
 */
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
