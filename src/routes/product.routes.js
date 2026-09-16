import { Router } from "express";
import {
  getProducts,
  getProduct,
  createProductHandler,
  updateProductHandler,
  deleteProductHandler,
} from "../controllers/product.controller.js";
import {
  productIdValidator,
  createProductValidators,
  updateProductValidators,
} from "../validators/product.validators.js";
import { validate } from "../middleware/validate.middleware.js";

const router = Router();

router.get("/", getProducts);
router.get("/:id", productIdValidator, validate, getProduct);
router.post("/", createProductValidators, validate, createProductHandler);
router.put("/:id", [...productIdValidator, ...updateProductValidators], validate, updateProductHandler);
router.delete("/:id", productIdValidator, validate, deleteProductHandler);

export default router;
