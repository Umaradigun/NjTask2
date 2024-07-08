// Importing the Sequelize module
const { Sequelize } = require("sequelize");

// Creating a Sequelize instance with the database URL and specifying the PostgreSQL dialect
const sequelize = new Sequelize(
  process.env.DATABASE_URL,
  { dialectModule: require("pg") }
  // { dialect: "postgres" }
);

// Logging the database URL to the console
console.log(process.env.DATABASE_URL);

// Synchronizing the database models
sequelize
  .sync()
  .then(() => {
    // If successful, log a success message
    console.log("synced successfully");
  })
  .catch((err) => {
    // If there is an error, log the error message
    console.log("error from sequelize: ", err);
  });

// Exporting the sequelize instance for use in other modules
module.exports = sequelize;

/*
  You can add any additional comments or notes here.
*/
