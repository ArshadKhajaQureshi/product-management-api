import { body, param } from "express-validator";

const STATUS_VALUES = ["active", "inactive", "discontinued"];

export const productIdValidator = [param("id").isUUID().withMessage("id must be a valid UUID")];

export const createProductValidators = [
  body("name").isString().trim().notEmpty().withMessage("name is required"),
  body("sku").isString().trim().notEmpty().withMessage("sku is required"),
  body("description").optional().isString().trim(),
  body("category").isString().trim().notEmpty().withMessage("category is required"),
  body("price").isFloat({ min: 0 }).withMessage("price must be a number >= 0"),
  body("stock").isInt({ min: 0 }).withMessage("stock must be an integer >= 0"),
  body("status").optional().isIn(STATUS_VALUES).withMessage(`status must be one of: ${STATUS_VALUES.join(", ")}`),
];

export const updateProductValidators = [
  body("name").optional().isString().trim().notEmpty().withMessage("name cannot be empty"),
  body("sku").optional().isString().trim().notEmpty().withMessage("sku cannot be empty"),
  body("description").optional().isString().trim(),
  body("category").optional().isString().trim().notEmpty().withMessage("category cannot be empty"),
  body("price").optional().isFloat({ min: 0 }).withMessage("price must be a number >= 0"),
  body("stock").optional().isInt({ min: 0 }).withMessage("stock must be an integer >= 0"),
  body("status").optional().isIn(STATUS_VALUES).withMessage(`status must be one of: ${STATUS_VALUES.join(", ")}`),
];
