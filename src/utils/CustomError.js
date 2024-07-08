// Defining the CustomError class that extends the built-in Error class
class CustomError extends Error {
  constructor(message, statusCode) {
    super(message); // Call the parent class constructor with the message

    this.isOperational = true; // Indicates if the error is operational
    this.statusCode = statusCode; // Sets the status code for the error

    // Sets the status based on the status code (error for 4xx, fail for others)
    this.status = String(statusCode).startsWith("4") ? "error" : "fail";

    // Captures the stack trace to provide detailed error information
    Error.captureStackTrace(this);
  }
}

// Exporting the CustomError class for use in other parts of the application
module.exports = CustomError;
