/**
 * Authentication endpoints: signup, login, and token verification.
 *
 * Mounted at `/auth` in app.js WITHOUT the `isAuthenticated` gate — these
 * routes are the only way to obtain a token in the first place, so they must
 * be reachable by anyone. `/verify` is the one exception that still requires
 * a token, applied inline below rather than at the router level.
 *
 * Key exports: an Express Router with `POST /signup`, `POST /login`, `GET /verify`.
 */
const express = require("express");
const router = express.Router();

// ℹ️ Handles password encryption
const bcrypt = require("bcrypt");

// ℹ️ Handles password encryption
const jwt = require("jsonwebtoken");

// Require the User model in order to interact with the database
const User = require("../models/User.model");

// Require necessary (isAuthenticated) middleware in order to control access to specific routes
const { isAuthenticated } = require("../middleware/jwt.middleware.js");

// How many rounds should bcrypt run the salt (default - 10 rounds)
const saltRounds = 10;

/**
 * POST /auth/signup
 * Creates a new user account.
 *
 * @access Public
 * @body {string} name, lastName, dateOfBirth, phoneNumber, email, password - all required, non-empty
 * @returns 201 with `{ user }` (password omitted); 400 for a missing/blank
 *   field, an invalid email, a password failing the strength regex, or an
 *   email already in use (checked up front, and again via the unique index
 *   if two signups race).
 */
router.post("/signup", async (req, res, next) => {
  const { name, lastName, dateOfBirth, phoneNumber, email, password } =
    req.body;

  // Every field must be present and non-empty. Checking only for `""` let a
  // missing key through, and the password regex below then threw on `undefined`.
  const isBlank = (value) => typeof value !== "string" || value.trim() === "";

  if (
    isBlank(name) ||
    isBlank(lastName) ||
    isBlank(dateOfBirth) ||
    isBlank(phoneNumber) ||
    isBlank(email) ||
    isBlank(password)
  ) {
    res
      .status(400)
      .json({ message: "Please, provide information for all the fields" });
    return;
  }

  // This regular expression check that the email is of a valid format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ message: "Provide a valid email address." });
    return;
  }

  // This regular expression checks password for special characters and minimum length
  const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/;
  if (!password.match(passwordRegex)) {
    res.status(400).json({
      message:
        "Password must have at least 8 characters and contain at least one number, one lowercase and one uppercase letter.",
    });
    return;
  }

  // Check the users collection if a user with the same email already exists
  const foundUser = await User.findOne({ email: email });
  if (foundUser) {
    res.status(400).json({ message: "User already exists." });
    return;
  }

  // If email is unique, proceed to hash the password.
  // The async variant keeps the event loop free while bcrypt runs.
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  let createdUser;
  try {
    // Create the new user in the database
    createdUser = await User.create({
      name,
      lastName,
      dateOfBirth,
      phoneNumber,
      email,
      password: hashedPassword,
    });
  } catch (err) {
    // Two concurrent signups can both pass the findOne check above, so the
    // unique index is the real guard - report it the same way.
    if (err.code === 11000) {
      res.status(400).json({ message: "User already exists." });
      return;
    }
    throw err;
  }

  // Deconstruct the newly created user object to omit the password
  // We should never expose passwords publicly
  const { _id } = createdUser;
  const user = { _id, name, lastName, dateOfBirth, phoneNumber, email };

  // Send a json response containing the user object
  res.status(201).json({ user: user });
});

/**
 * POST /auth/login
 * Verifies email + password and returns a 6-hour JWT.
 *
 * @access Public
 * @body {string} email, password - both required
 * @returns 200 with `{ authToken, data: { _id, name } }`; 400 if either field
 *   is missing/blank; 401 for a nonexistent email or a wrong password — both
 *   share the exact same message so a caller can't use this endpoint to probe
 *   which emails are registered.
 */
router.post("/login", async (req, res, next) => {
  const { email, password } = req.body;

  // Both fields must actually be present. A missing `email` used to reach
  // `findOne({ email: undefined })`, which mongoose strips to `findOne({})` -
  // matching an arbitrary user rather than failing.
  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    res.status(400).json({ message: "Email and password are required." });
    return;
  }

  // Check the users collection if a user with the same email exists
  // password has `select: false` on the schema, so it must be re-selected explicitly here
  const foundUser = await User.findOne({ email: email }).select("+password");

  // A distinct "user not found" reply let anyone probe which emails are
  // registered, so both failure modes return the same message.
  if (!foundUser) {
    res.status(401).json({ message: "Invalid email or password." });
    return;
  }

  // Compare the provided password with the one saved in the database
  const passwordCorrect = await bcrypt.compare(password, foundUser.password);

  if (!passwordCorrect) {
    res.status(401).json({ message: "Invalid email or password." });
    return;
  }

  // Deconstruct the user object to omit the password
  const { _id, email: userEmail, name, profilePic } = foundUser;

  // Create an object that will be set as the token payload
  const payload = { _id, email: userEmail, name, profilePic };

  // Create a JSON Web Token and sign it
  const authToken = jwt.sign(payload, process.env.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: "6h",
  });

  // Send the token as the response
  res.status(200).json({ authToken: authToken, data: { _id, name } });
});

/**
 * GET /auth/verify
 * Confirms a client-held token is still valid and returns its payload.
 *
 * @access Private — requires a valid Bearer token (see isAuthenticated middleware)
 * @returns 200 with the decoded token payload (`_id`, `email`, `name`,
 *   `profilePic`); 401 if the token is missing, malformed, or expired.
 */
router.get("/verify", isAuthenticated, (req, res, next) => {
  // If JWT token is valid the payload gets decoded by the
  // isAuthenticated middleware and is made available on `req.payload`

  // Send back the token payload object containing the user data
  res.status(200).json(req.payload);
});

module.exports = router;
