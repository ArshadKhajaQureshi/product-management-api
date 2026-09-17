import express from "express";
import productsRouter from "./routes/products.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";

export const createApp = () => {
  const app = express();

  app.use(express.json());
  app.use("/products", productsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export default createApp;
