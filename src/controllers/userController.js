// Importing necessary modules and dependencies
const jwt = require("jsonwebtoken");
const { User, Organisation } = require("../model/userModel");
const { promisify } = require("util");
const bcrypt = require("bcrypt");
const sequelize = require("../db-config/db-config");
const CustomError = require("../utils/CustomError");

// Function to create a JWT token
const createToken = async (id) => {
  const generate_jwt = promisify(jwt.sign);
  return await generate_jwt(
    { id }, // Payload
    process.env.JWT_SECRET, // Secret key
    { expiresIn: process.env.JWT_EXPIRES_IN } // Token expiration time
  );
};

// Signup a new user
exports.signupUser = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, phone, description } = req.body;

    // Check if required fields are provided
    if (!firstName || !lastName || !email || !password) {
      return next(
        new CustomError("firstName, lastName, email, password is required field", 422)
      );
    }

    // Check if user already exists
    const existing_user = await User.findOne({ where: { email } });
    if (existing_user) {
      return next(
        new CustomError("User with this email address already exists", 400)
      );
    }

    // Encrypt the password
    const encrypted_pass = await bcrypt.hash(password, 12);
    await sequelize.sync({});
    
    // Create the user
    const user = await User.create({
      firstName,
      lastName,
      email,
      phone,
      password: encrypted_pass,
    });

    // If user is created, create an organisation under the user
    let organisation;
    if (user) {
      try {
        const name = `${user.firstName}'s Organisation`;
        organisation = await Organisation.create({
          org_owner_id: user.user_id,
          name,
          description,
        });
        await user.addOrganisation(organisation);
      } catch (err) {
        return next(err);
      }
    }

    // Create an access token for the user
    const accessToken = await createToken(user.user_id);

    // Respond with success message and user details
    res.status(201).json({
      status: "success",
      message: "Registration successful",
      data: {
        accessToken,
        organisation,
        user: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone || null,
        },
      },
    });
  } catch (err) {
    console.log("err", err);
    return res
      .status(400)
      .json({ message: "Registration unsuccessful", status: "Bad request" });
  }
};

// Login a user
exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
      return next(
        new CustomError("Please provide your email and password", 401)
      );
    }

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        message: "There is no user with this email address",
        status: "Bad request",
      });
    }

    // Check if password is correct
    const check_pass = await bcrypt.compare(password, user.password);
    if (!check_pass) {
      return res.status(401).json({
        message: "Authentication failed",
        status: "Bad request",
      });
    }

    // Create an access token for the user
    const accessToken = await createToken(user.user_id);

    // Respond with success message and user details
    res.status(200).json({
      status: "success",
      message: "Login in successful",
      data: {
        accessToken,
        user: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone || null,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// Middleware to protect routes
exports.protectedUser = async (req, res, next) => {
  try {
    const user_token =
      req.headers.authorization?.split(" ")[1] || req?.cookies?.jwt;

    // Check if token is provided
    if (!user_token) {
      return next(
        new CustomError(
          `Unauthorized access. Please login your account to access this page`,
          401
        )
      );
    }

    // Verify the token
    const user_verified = await promisify(jwt.verify)(
      user_token,
      process.env.JWT_SECRET
    );

    // Find user by ID from the token
    const user = await User.findOne({ where: { user_id: user_verified.id } });
    if (!user) {
      return next(
        new CustomError(`There is no user found with this token`, 404)
      );
    }

    req.currentUser = user;
    return next();
  } catch (err) {
    next(err);
  }
};

// Get a specific user
exports.getSpecificUser = async (req, res, next) => {
  try {
    const { user_id } = req.currentUser;
    const { id } = req.params;

    // Check if user is trying to access their own data
    if (String(user_id) !== String(id)) {
      return next(new CustomError("You cannot get another user's record", 400));
    }

    // Find user by ID
    const user = await User.findOne({ where: { user_id: id } });

    if (!user) {
      return next(new CustomError("There is no user with this id", 404));
    }

    // Respond with user details
    res.status(200).json({
      status: "success",
      message: "User successfully retrieved",
      data: {
        user_id: user.user_id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || null,
      },
    });
  } catch (err) {
    next(err);
  }
};

// Get organisations of a specific user
exports.getSpecificUserOrganisations = async (req, res, next) => {
  try {
    const { user_id } = req.currentUser;
    const ownOrgs = await Organisation.findAll({
      where: { org_owner_id: user_id },
    });
    const curUser = await User.findOne({ where: { user_id } });
    const org = await curUser.getOrganisations();

    // Respond with organisation details
    res.status(200).json({
      status: "success",
      message: "Organisations successfully retrieved",
      data: { org, ownOrgs },
    });
  } catch (err) {
    next(err);
  }
};

// Get a specific organisation by ID
exports.getSpecificOrganisation = async (req, res, next) => {
  try {
    const { org_id } = req.params;
    const org = await Organisation.findOne({
      where: { org_id },
    });
    if (!org) {
      return next(
        new CustomError("There is no organisation with this ID", 404)
      );
    }

    // Respond with organisation details
    res.status(200).json({
      status: "success",
      message: "Organisation successfully retrieved",
      data: { org },
    });
  } catch (err) {
    next(err);
  }
};

// Create a new organisation
exports.createOrganisation = async (req, res, next) => {
  try {
    const { description, name } = req.body;
    const user = req.currentUser;

    // Check if organisation name is provided
    if (!name) {
      return next(new CustomError("Organisation must have a name", 422));
    }

    await sequelize.sync({});
    
    // Create the organisation
    const organisation = await Organisation.create({
      org_owner_id: user.user_id,
      name,
      description,
    });
    await user.addOrganisation(organisation);

    // Respond with success message and organisation details
    res.status(200).json({
      status: "success",
      message: "Organisation created successfully",
      data: organisation,
    });
  } catch (err) {
    next(err);
  }
};

// Add a user to an organisation
exports.addUserToOrganisation = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const user = req.currentUser;
    const { org_id } = req.params;

    // Find the organisation by ID and owner ID
    const organisation = await Organisation.findOne({
      where: { org_id, org_owner_id: user.user_id },
    });

    // Find the user to be added by ID
    const user_to_add = await User.findByPk(userId);

    if (!user_to_add) {
      return next(new CustomError("There is no user with this ID", 404));
    }

    if (!organisation) {
      return next(
        new CustomError(
          "There is no organisation with this ID or you are not the owner of this organisation",
          404
        )
      );
    }

    await user.addOrganisation(organisation);

    // Respond with success message
    res.status(200).json({
      status: "success",
      message: "User added to organisation successfully",
    });
  } catch (err) {
    next(err);
  }
};
