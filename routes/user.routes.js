/**
 * User profile endpoints: read one/all users, update your own profile.
 *
 * Mounted at `/user` behind `isAuthenticated` in app.js — every handler here
 * can assume `req.payload._id` is a valid, verified caller id.
 *
 * Key exports: an Express Router with `GET /:userId`, `GET /`, `PUT /:userId`.
 */
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const router = express.Router();

// importing User.model
const User = require("../models/User.model");

const saltRounds = 10;

// Fields a client is allowed to change on a profile. Spreading `req.body`
// straight into the update let a caller set anything on the schema.
const UPDATABLE_FIELDS = [
  "name",
  "lastName",
  "dateOfBirth",
  "phoneNumber",
  "email",
  "profilePic",
  "password",
];

/**
 * GET /user/:userId
 * Fetches one user's profile.
 *
 * @access Private
 * @param {string} userId - route param, must be a valid MongoDB ObjectId
 * @returns 200 with the user (password never included, via schema `select: false`);
 *   400 for a malformed id; 404 if no such user exists.
 */
router.get("/:userId", async (req, res, next) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400).json({ message: "Specified id is not valid" });
    return;
  }

  const user = await User.findById(userId).lean();

  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  res.status(200).json(user);
});

/**
 * GET /user/
 * Lists every user in the system.
 *
 * @access Private
 * @returns 200 with an array of users (passwords omitted).
 */
router.get("/", async (req, res, next) => {
  const users = await User.find().lean();
  res.status(200).json(users);
});

/**
 * PUT /user/:userId
 * Updates the caller's own profile. A new `password`, if present, is
 * re-hashed here — never persisted verbatim.
 *
 * @access Private — self only; `req.payload._id` must equal `:userId`
 * @param {string} userId - route param, must be a valid MongoDB ObjectId
 * @body {string} [name], [lastName], [dateOfBirth], [phoneNumber], [email],
 *   [profilePic], [password] - only fields in `UPDATABLE_FIELDS` are ever
 *   written, so an unlisted body field (or `_id`, etc.) is silently ignored
 *   rather than triggering mass-assignment onto the schema.
 * @returns 200 with `{ userUpdated, authToken, message }` (a fresh token,
 *   since the payload embeds profile fields that may have just changed);
 *   400 for a blank required field or a malformed id; 403 if `:userId` isn't
 *   the caller's own id; 404 if the user doesn't exist.
 */
router.put("/:userId", async (req, res, next) => {
  const { userId } = req.params;

  if (
    req.body.name === "" ||
    req.body.lastName === "" ||
    req.body.dateOfBirth === "" ||
    req.body.phoneNumber === "" ||
    req.body.email === ""
  ) {
    res.status(400).json({ message: "Please fill all the fields" });
    return;
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400).json({ message: "Specified id is not valid" });
    return;
  }

  // Any logged-in user could previously edit any other user's profile.
  if (userId !== req.payload._id) {
    res.status(403).json({ message: "You can only edit your own profile" });
    return;
  }

  const updates = {};
  for (const field of UPDATABLE_FIELDS) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  // Passwords must never be persisted in plain text
  if (updates.password) {
    updates.password = await bcrypt.hash(updates.password, saltRounds);
  }

  // `findByIdAndUpdate` skips schema validation unless asked, so a bad email or
  // date could be written straight past the model's rules.
  const userUpdated = await User.findByIdAndUpdate(userId, updates, {
    new: true,
    runValidators: true,
  });

  if (!userUpdated) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  const { _id, email, name, profilePic } = userUpdated;

  // Create an object that will be set as the token payload
  const payload = { _id, email, name, profilePic };

  // Create a JSON Web Token and sign it
  const authToken = jwt.sign(payload, process.env.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: "6h",
  });

  res.status(200).json({ userUpdated, authToken, message: "User updated!" });
});

module.exports = router;
