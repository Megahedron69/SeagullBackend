import { body } from "express-validator";

export const signupSchema = [
  body("mobileNumber")
    .trim()
    .escape()
    .matches(/^\d{10}$/)
    .withMessage("Mobile number must be exactly 10 digits"),
  ,
  body("email")
    .trim()
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail()
    .escape(),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/\d/)
    .withMessage("Password must contain at least one number")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .escape(),
];

export const loginSchema = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail()
    .escape(),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/\d/)
    .withMessage("Password must contain at least one number")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .escape(),
];
