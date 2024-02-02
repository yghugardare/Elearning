import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/ErrorHandler";

// middleware function to handle errors
export const ErrorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // set default message and status code
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal Server Error";

  // Wrong MongoDB ID error (CastError) at the frontend
  if (err.name === "CastError") {
    const message = `Resource not found. Invalid: ${err.path}`;
    err = new ErrorHandler(message, 400);
  }
  // Duplicate key error - when we try to insert a unique
  // constraint that already exists in db
  // mongo db error code = 11000
  if (err.code === 11000) {
    const message = `Duplicate ${Object.keys(err.keyValue)} entered`;
    err = new ErrorHandler(message, 400);
  }
  // wrong jwt error, when jwt is malformed, invalid or not
  // decodable
  if (err.name === "JsonWebTokenError") {
    const message = "JSON Web token is invalid, try again";
    err = new ErrorHandler(message, 400);
  }
  // when json web token expired
  if (err.name === "TokenExpiredError") {
    const message = "JSON Web token is expired, try again";
    err = new ErrorHandler(message, 400);
  }
  // send response to the client
  // with appropirate status code and message
  res.status(err.statusCode).json({
    // indicates operation was not successfull
    success: false,
    message: err.message,
  });
};
