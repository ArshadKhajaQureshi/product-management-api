import { body, query, validationResult } from "express-validator";
import { ApiError } from "../middleware/errorHandler.js";

export const CATEGORY_VALUES = ["electronics", "clothing", "food", "books", "other"];
export const STATUS_VALUES = ["active", "inactive", "discontinued"];

const isPresent = (value) => value !== undefined && value !== "";
const isString = (value) => typeof value === "string";
const isValidSkuFormat = (value) => typeof value === "string" && /^[A-Z0-9]+(-[A-Z0-9]+)*$/.test(value);
const isValidPrice = (value) =>
  typeof value === "number" && value > 0 && /^\d+(\.\d{1,2})?$/.test(value.toString());
const isValidStock = (value) => Number.isInteger(value) && value >= 0;
const isValidNumberQuery = (value) => Number.isFinite(Number(value));

const handleValidationErrors = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  next(new ApiError(422, result.array().map((err) => err.msg).join("; ")));
};

const createFieldRules = [
  body("name").custom(isPresent).withMessage("name is required").bail().custom(isString).withMessage("name must be a string"),
  body("sku").custom(isPresent).withMessage("sku is required").bail().custom(isString).withMessage("sku must be a string").bail().custom(isValidSkuFormat).withMessage("sku must contain only uppercase letters, numbers, and hyphens"),
  body("category").custom(isPresent).withMessage("category is required").bail().isIn(CATEGORY_VALUES).withMessage(`category must be one of: ${CATEGORY_VALUES.join(", ")}`),
  body("price").custom(isPresent).withMessage("price is required").bail().custom(isValidPrice).withMessage("price must be a positive number with up to 2 decimal places"),
  body("stock").custom(isPresent).withMessage("stock is required").bail().custom(isValidStock).withMessage("stock must be a non-negative integer"),
  body("status").optional().isIn(STATUS_VALUES).withMessage(`status must be one of: ${STATUS_VALUES.join(", ")}`),
];

const updateFieldRules = [
  body("name").optional().custom(isString).withMessage("name must be a string"),
  body("category").optional().isIn(CATEGORY_VALUES).withMessage(`category must be one of: ${CATEGORY_VALUES.join(", ")}`),
  body("price").optional().custom(isValidPrice).withMessage("price must be a positive number with up to 2 decimal places"),
  body("stock").optional().custom(isValidStock).withMessage("stock must be a non-negative integer"),
  body("status").optional().isIn(STATUS_VALUES).withMessage(`status must be one of: ${STATUS_VALUES.join(", ")}`),
];

const filterFieldRules = [
  query("category").optional().isIn(CATEGORY_VALUES).withMessage(`category must be one of: ${CATEGORY_VALUES.join(", ")}`),
  query("status").optional().isIn(STATUS_VALUES).withMessage(`status must be one of: ${STATUS_VALUES.join(", ")}`),
  query("minPrice").optional().custom(isValidNumberQuery).withMessage("minPrice must be a number"),
  query("maxPrice").optional().custom(isValidNumberQuery).withMessage("maxPrice must be a number"),
  query("inStock").optional().isIn(["true", "false"]).withMessage("inStock must be true or false"),
  query("search").optional(),
];

export const validateCreate = [...createFieldRules, handleValidationErrors];
export const validateUpdate = [...updateFieldRules, handleValidationErrors];
export const validateFilters = [...filterFieldRules, handleValidationErrors];
