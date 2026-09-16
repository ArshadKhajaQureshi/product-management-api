import { errorResponse } from "../utils/response.js";

export const notFoundHandler = (req, res) => {
  res.status(404).json(errorResponse("Route not found"));
};

export const globalErrorHandler = (err, req, res, next) => {
  console.error(err);
  res.status(500).json(errorResponse("Internal server error"));
};
