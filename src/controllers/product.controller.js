import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../models/product.model.js";
import { successResponse, errorResponse } from "../utils/response.js";

export const getProducts = async (req, res) => {
  res.status(200).json(successResponse(getAllProducts()));
};

export const getProduct = async (req, res) => {
  const product = getProductById(req.params.id);
  if (!product) return res.status(404).json(errorResponse("Product not found"));

  res.status(200).json(successResponse(product));
};

export const createProductHandler = async (req, res) => {
  const { name, sku, description, category, price, stock, status } = req.body;
  const product = createProduct({ name, sku, description, category, price, stock, status });
  res.status(201).json(successResponse(product));
};

export const updateProductHandler = async (req, res) => {
  const { name, sku, description, category, price, stock, status } = req.body;
  const updates = Object.fromEntries(
    Object.entries({ name, sku, description, category, price, stock, status }).filter(
      ([, value]) => value !== undefined
    )
  );

  const product = updateProduct(req.params.id, updates);
  if (!product) return res.status(404).json(errorResponse("Product not found"));

  res.status(200).json(successResponse(product));
};

export const deleteProductHandler = async (req, res) => {
  const deleted = deleteProduct(req.params.id);
  if (!deleted) return res.status(404).json(errorResponse("Product not found"));

  res.status(200).json(successResponse(null));
};
