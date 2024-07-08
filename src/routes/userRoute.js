// Importing the Express router
const router = require("express").Router();

// Importing the controller functions for user and organisation operations
const {
  getSpecificUserOrganisations,
  getSpecificUser,
  protectedUser,
  createOrganisation,
  addUserToOrganisation,
} = require("../controllers/userController");

// Middleware to protect routes, ensuring only authenticated users can access them
router.use(protectedUser);

// Route to get a specific user by ID
router.get("/users/:id", getSpecificUser);

// Route to get organisations of the authenticated user
router.get("/organisations", getSpecificUserOrganisations);

// Route to create a new organisation
router.post("/organisations", createOrganisation);

// Route to get specific organisations by organisation ID
router.get("/organisations/:orgId", getSpecificUserOrganisations);

// Route to add a user to a specific organisation
router.post("/organisations/:orgId/users", addUserToOrganisation);

// Exporting the router to be used in other parts of the application
module.exports = router;
