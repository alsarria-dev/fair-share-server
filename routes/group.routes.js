/**
 * Group endpoints: list/create/read/update/delete groups, and attach an
 * expense to one.
 *
 * Mounted at `/groups` behind `isAuthenticated` in app.js. Authorization here
 * has two tiers: plain *membership* (in `groupUsers` or the `groupAuthor`)
 * is enough to read a group or attach an expense to it, but editing,
 * deleting, or transferring authorship requires being the `groupAuthor`
 * specifically — see `isMember` vs. the direct `groupAuthor` checks below.
 *
 * Key exports: an Express Router with `GET /:userId`, `POST /`,
 * `GET /details/:groupId`, `PUT /:groupId`, `PUT /:groupId/:expenseId`,
 * `DELETE /:groupId`.
 */
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

// importing Group.model
const Group = require("../models/Group.model");

/**
 * Normalizes a User/Group reference to a plain id string, regardless of
 * whether Mongoose returned it as a raw ObjectId or, via `.populate()`, as a
 * full document.
 *
 * @param {import("mongoose").Types.ObjectId|{_id: import("mongoose").Types.ObjectId}|null|undefined} ref
 * @returns {string|null} the id as a string, or `null` if `ref` is falsy
 */
const idOf = (ref) => {
  if (!ref) return null;
  return ref._id ? ref._id.toString() : ref.toString();
};

/**
 * Whether a user is the group's author or one of its members.
 *
 * @param {{groupAuthor: *, groupUsers?: Array}} group
 * @param {string} userId - a plain id string (typically `req.payload._id`)
 * @returns {boolean}
 */
const isMember = (group, userId) =>
  idOf(group.groupAuthor) === userId ||
  (group.groupUsers || []).some((user) => idOf(user) === userId);

// Fields a client may set. `req.body` was previously written through verbatim,
// which let a caller forge `groupAuthor` or overwrite `groupExpenses`.
const WRITABLE_FIELDS = ["name", "description", "groupUsers", "groupPic"];

/**
 * Filters a request body down to `WRITABLE_FIELDS`, dropping anything else
 * (e.g. a client-supplied `groupAuthor` or `groupExpenses`) before it can
 * reach a create/update call.
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
 * GET /groups/:userId
 * Lists every group the given user belongs to (home page).
 *
 * @access Private — self only; `req.payload._id` must equal `:userId`
 * @param {string} userId - route param, must be a valid MongoDB ObjectId
 * @returns 200 with an array of groups, each populated with its
 *   `groupExpenses` and `groupUsers`; 400 for a malformed id; 403 if
 *   `:userId` isn't the caller's own id.
 */
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

/**
 * POST /groups/
 * Creates a new group, authored by the caller.
 *
 * @access Private
 * @body {string} name, description - required by the schema
 * @body {string[]} [groupUsers] - other member ids; the caller is added
 *   automatically if not already present, since a group must contain its
 *   own author to satisfy the `GET /:userId` "groups I belong to" lookup
 * @body {string} [groupPic]
 * @returns 201 with the created group. `groupAuthor` always comes from the
 *   token, never the request body, even if the body includes one.
 */
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

/**
 * GET /groups/details/:groupId
 * Fetches one group's full details (details page).
 *
 * @access Private — any member (author or `groupUsers`) of the group
 * @param {string} groupId - route param, must be a valid MongoDB ObjectId
 * @returns 200 with the group, populated with `groupExpenses`, `groupUsers`,
 *   and `groupAuthor`; 400 for a malformed id; 403 if the caller isn't a
 *   member; 404 if no such group exists.
 */
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

/**
 * PUT /groups/:groupId
 * Updates a group's editable fields, and optionally transfers authorship.
 *
 * @access Private — `groupAuthor` only
 * @param {string} groupId - route param, must be a valid MongoDB ObjectId
 * @body {string} [name], [description], [groupPic]
 * @body {string[]} [groupUsers]
 * @body {string} [groupAuthor] - to transfer authorship; the new author
 *   must already be a member of the group (or already the current author,
 *   which is a harmless no-op re-save), and only the *current* author may
 *   request the transfer
 * @returns 200 with the updated group; 400 for a malformed id, an invalid
 *   `groupAuthor`, or a `groupAuthor` that isn't an existing member; 403 if
 *   the caller isn't the current author; 404 if no such group exists.
 */
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

/**
 * PUT /groups/:groupId/:expenseId
 * Attaches an already-created expense to a group's `groupExpenses` list.
 *
 * @access Private — any member of the group
 * @param {string} groupId, expenseId - route params, both must be valid MongoDB ObjectIds
 * @returns 200 with the updated group; 400 for a malformed id; 403 if the
 *   caller isn't a member of the group; 404 if the group doesn't exist.
 */
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

/**
 * DELETE /groups/:groupId
 * Deletes a group.
 *
 * @access Private — `groupAuthor` only
 * @param {string} groupId - route param, must be a valid MongoDB ObjectId
 * @returns 200 with `{ message }` on success; 400 for a malformed id; 403 if
 *   the caller isn't the group's author; 404 if no such group exists.
 *
 * Note: this does not cascade-delete the group's expenses (`groupExpenses`) —
 * they're left behind as orphaned documents referencing a deleted group.
 */
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
