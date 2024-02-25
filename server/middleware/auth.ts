import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "./catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import jwt, { JwtPayload } from "jsonwebtoken";
import { redis } from "../utils/redis";
import { updateAccessToken } from "../controller/user.controller";

// function to check if user is authenticated
export const isAuthenticated = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    // we will extract encrypted access token from our cookies
    const access_token = req.cookies.access_token as string;
    // handle case where the extracted token is not there
    // in that case user is not logged in
    if (!access_token) {
      return next(
        new ErrorHandler("Please login to access this resource", 400)
      );
    }
    // get the decoded token
    const decoded = jwt.decode(access_token) as JwtPayload;
    if (!decoded) {
      return next(new ErrorHandler("access token is not valid", 400));
    }
     // check if the access token is expired
     if (decoded.exp && decoded.exp <= Date.now() / 1000) {
      try {
        await updateAccessToken(req, res, next);
      } catch (error) {
        return next(error);
      }
    } else {
     
    // get user from redis through is id
    const user = await redis.get(decoded.id);
    if (!user) {
      return next(
        new ErrorHandler("Please login [decoded] to access this resource", 400)
      );
    }
    // add user in req
    req.user = JSON.parse(user);
    next();
  }
}
);

// middleware to validate user role
// so that a user with specific role can get access to the
// route
export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user?.role || "")) {
      return next(
        new ErrorHandler(
          `Role: ${req.user?.role} is not allowed to access this resource`,
          404
        )
      );
    }
    // else validate and go further
    next();
  };
};
