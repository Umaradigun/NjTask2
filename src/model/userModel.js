// Importing required modules and dependencies
const { DataTypes } = require("sequelize");
const sequelize = require("../db-config/db-config");
const { Sequelize } = require("sequelize");
const CustomError = require("../utils/CustomError");
const validator = require("email-validator");
const phone = require("phone");

// Defining the User model
const User = sequelize.define(
  "user",
  {
    user_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true, // Primary key for the User model
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isNotEmpty(value) {
          if (value === "" || value === null) {
            throw new CustomError("First name is a required field", 422);
          }
        },
      },
      trim: true, // Trim whitespace
    },
    lastName: {
      type: DataTypes.STRING,
      // allowNull: false, // Uncomment if lastName should be required
      validate: {
        isNotEmpty(value) {
          if (value === "" || value === null) {
            throw new CustomError("Last name is a required field", 422);
          }
        },
      },
      trim: true, // Trim whitespace
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, // Ensure email is unique
      validate: {
        isNotEmail(value) {
          if (!validator.validate(value)) {
            throw new CustomError(`${value} is not a valid email address`, 422);
          }
        },
      },
      trim: true, // Trim whitespace
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isNotPassword(value) {
          if (String(value).length < 8) {
            throw new CustomError(
              `Password must be at least 8 characters`,
              422
            );
          }
        },
      },
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
      trim: true, // Trim whitespace
    },
  },
  { freezeTableName: true } // Use the same table name as the model name
);

// Defining the Organisation model
const Organisation = sequelize.define(
  "organisation",
  {
    org_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true, // Primary key for the Organisation model
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isNotEmpty(value) {
          if (value === "") {
            throw new CustomError("First name is a required field", 422);
          }
        },
      },
      trim: true, // Trim whitespace
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    org_owner_id: {
      type: DataTypes.UUID,
      allowNull: false, // ID of the user who owns the organisation
    },
  },
  { freezeTableName: true } // Use the same table name as the model name
);

// Defining many-to-many relationships between User and Organisation
User.belongsToMany(Organisation, {
  through: "User_and_Organisations", // Join table for the relationship
  foreignKey: "creator_id", // Foreign key in the join table
});
Organisation.belongsToMany(User, {
  through: "User_and_Organisations", // Join table for the relationship
  foreignKey: "org_id", // Foreign key in the join table
});

// Exporting the models for use in other modules
exports.User = User;
exports.Organisation = Organisation;
