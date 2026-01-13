const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const router = express.Router();

// importing User.model
const User = require("../models/User.model")

// Gets user details
router.get("/:userId", (req, res, next) => {
    const {userId} = req.params;
    User.findById(userId)
        // .populate("expenses users")
        .then((User) => res.json(User))
        .catch((error) => res.json(error));
});

// Gets user details
router.get("/", (req, res, next) => {
    User.find()
        // .populate("expenses users")
        .then((User) => res.json(User))
        .catch((error) => res.json(error));
});

// Updates user details
router.put("/:userId", (req, res, next) => {
    const {userId} = req.params;

    if(req.body.name === "" | req.body.lastName === "" | req.body.dateOfBirth === "" | req.body.phoneNumber === "" | req.body.email === "" ){
        res.status(400).json({message: "Please fill all the fields"})
        return;
    };

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        res.status(400).json({ message: "Specified id is not valid" });
        return;
      };

    User.findByIdAndUpdate(userId, req.body, {new: true})
    .then((userUpdated) => {
        const { _id, email, name, profilePic } = userUpdated;

        // Create an object that will be set as the token payload
        const payload = { _id, email, name, profilePic };

        // Create a JSON Web Token and sign it
        const authToken = jwt.sign(payload, process.env.JWT_SECRET, {
          algorithm: "HS256",
          expiresIn: "6h",
        });
        res.status(202).json({userUpdated, authToken, message: "User updated!"});
    })
    .catch((error) => res.status(400).json(error));
})

module.exports = router;