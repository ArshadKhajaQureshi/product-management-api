import Product from "../models/product.js";
import { successResponse } from "../utils/response.js";
import { ApiError } from "../middleware/errorHandler.js";
import { catchAsync } from "../middleware/catchAsync.js";

const ALLOWED_FIELDS = ["name", "sku", "description", "category", "price", "stock", "status"];

const pickAllowedFields = (body) =>
  Object.fromEntries(
    ALLOWED_FIELDS.filter((field) => body[field] !== undefined).map((field) => [field, body[field]])
  );

const buildFiltersFromQuery = (query) => {
  const filters = {};
  if (query.category !== undefined) filters.category = query.category;
  if (query.status !== undefined) filters.status = query.status;
  if (query.minPrice !== undefined) filters.minPrice = Number(query.minPrice);
  if (query.maxPrice !== undefined) filters.maxPrice = Number(query.maxPrice);
  if (query.inStock !== undefined) filters.inStock = query.inStock === "true";
  if (query.search !== undefined) filters.search = String(query.search).trim();
  return filters;
};

export const getProducts = catchAsync(async (req, res) => {
  res.status(200).json(successResponse(Product.findAll(buildFiltersFromQuery(req.query))));
});

export const getProduct = catchAsync(async (req, res, next) => {
  const product = Product.findById(req.params.id);
  if (!product) return next(new ApiError(404, "Product not found"));

  res.status(200).json(successResponse(product));
});

export const createProduct = catchAsync(async (req, res, next) => {
  if (Product.findBySku(req.body.sku)) return next(new ApiError(409, "sku already exists"));

  const product = Product.create(pickAllowedFields(req.body));
  res.status(201).json(successResponse(product));
});

export const patchProduct = catchAsync(async (req, res, next) => {
  const existing = Product.findById(req.params.id);
  if (!existing) return next(new ApiError(404, "Product not found"));

  const patch = pickAllowedFields(req.body);
  if (patch.sku && patch.sku !== existing.sku && Product.findBySku(patch.sku)) {
    return next(new ApiError(409, "sku already exists"));
  }

  const product = Product.update(req.params.id, patch);
  res.status(200).json(successResponse(product));
});

export const deleteProduct = catchAsync(async (req, res, next) => {
  const deleted = Product.delete(req.params.id);
  if (!deleted) return next(new ApiError(404, "Product not found"));

  res.status(200).json(successResponse(null));
});

export const restoreProduct = catchAsync(async (req, res, next) => {
  const product = Product.restore(req.params.id);
  if (!product) return next(new ApiError(404, "Product not found"));

  res.status(200).json(successResponse(product));
});
