// Importing the express module
const express = require("express");

// Loading environment variables from a .env file into process.env
require("dotenv").config();

// Importing the Sequelize instance for database configuration
const sequelize = require("../src/db-config/db-config");

// Importing the CustomError class for handling errors
const CustomError = require("../src/utils/CustomError");

// Importing routes for authentication and user-related operations
const authRoute = require("../src/routes/authRoute");
const userRoute = require("../src/routes/userRoute");

// Creating an instance of an Express application
const app = express();

// Middleware to parse JSON request bodies
app.use(express.json());

// Middleware to parse URL-encoded request bodies with a limit of 10kb
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Uncomment the following block to authenticate the database connection
/*
sequelize
  .authenticate()
  .then(() => {
    console.log("Database connected successfully");
  })
  .catch((err) => {
    console.log(err);
  });
*/

// Define the root route
app.get("/", (req, res) => {
  res.send({ status: "success", message: "Welcome to this postgres ORM db" });
});

// Define routes for authentication and user operations
app.use("/auth", authRoute);
app.use("/api", userRoute);

// Handle all undefined routes
app.all("*", (req, res, next) => {
  return next(
    new CustomError(
      `Sorry this route ${req.protocol}://${req.get("host")}${
        req.originalUrl
      } doesn't exist`,
      404
    )
  );
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.log("err", err);
  err.statusCode = err.statusCode || 500;
  let error = Object.assign(err);
  if (error.isOperational) {
    res.status(error.statusCode).json({
      status: error.status,
      message: error.message,
    });
  } else {
    res.status(error.statusCode).json({
      status: "fail",
      message: "Something really went wrong",
    });
  }
});

// Define the port to listen on, using an environment variable or defaulting to 3000
const PORT = process.env.PORT || 3000;

// Start the server and listen on the specified port
app.listen(PORT, () => {
  console.log("Listening on port ", PORT);
});

// Export the app module
module.exports = app;
