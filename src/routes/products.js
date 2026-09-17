import { Router } from "express";
import {
  getProducts,
  getProduct,
  createProduct,
  patchProduct,
  deleteProduct,
  restoreProduct,
} from "../controllers/productController.js";
import { validateCreate, validateUpdate, validateFilters } from "../validators/productValidator.js";

const router = Router();

router.get("/", validateFilters, getProducts);
router.get("/:id", getProduct);
router.post("/", validateCreate, createProduct);
router.patch("/:id", validateUpdate, patchProduct);
router.delete("/:id/restore", restoreProduct);
router.delete("/:id", deleteProduct);

export default router;
