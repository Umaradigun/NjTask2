// Importing the Express router
const router = require("express").Router();

// Importing the controller functions for user login and signup
const { loginUser, signupUser } = require("../controllers/userController");

// Route for user registration
router.post("/register", signupUser);

// Route for user login
router.post("/login", loginUser);

// Exporting the router to be used in other parts of the application
module.exports = router;
