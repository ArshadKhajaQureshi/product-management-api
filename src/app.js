import express from "express";
import productRoutes from "./routes/product.routes.js";
import { notFoundHandler, globalErrorHandler } from "./middleware/errorHandler.middleware.js";

const app = express();

app.use(express.json());
app.use("/api/products", productRoutes);

app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
