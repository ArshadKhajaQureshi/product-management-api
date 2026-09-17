import { errorResponse } from "../utils/response.js";

export class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const notFoundHandler = (req, res) => {
  res.status(404).json(errorResponse("Route not found"));
};

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode ?? 500;
  const message = statusCode === 500 ? "Internal server error" : err.message;
  if (statusCode === 500) console.error(err);

  res.status(statusCode).json(errorResponse(message));
};
