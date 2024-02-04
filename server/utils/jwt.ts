require("dotenv").config();
import { Response } from "express";
import { IUser } from "../models/user.model";
import { redis } from "./redis";

// iterface for saving token to our cookies
interface ITokenOptions {
  expires: Date;
  maxAge: number;
  //Protects cookies from being accessed by client-side JavaScript.
  httpOnly: boolean;
  sameSite: "lax" | "strict" | "none" | undefined;
  //Ensures cookies are only transmitted over secure connections (HTTPS).
  secure?: boolean;
}
// parse enviroment variables to integrates with fallback values
// parse enviroment variables to integrates with fallback values
const accessTokenExpire = parseInt(
  process.env.ACCESS_TOKEN_EXPIRE || "300",
  10
);
const refreshTokenExpire = parseInt(
  process.env.REFRESH_TOKEN_EXPIRE || "1200",
  10
);

// options for cookies
export const accessTokenOptions: ITokenOptions = {
  expires: new Date(Date.now() + accessTokenExpire * 60  * 60 * 1000),
  maxAge: accessTokenExpire * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: "none",
  secure:true,
};

export const refreshTokenOptions: ITokenOptions = {
  expires: new Date(Date.now() + refreshTokenExpire * 24 * 60 * 60 * 1000),
  maxAge: refreshTokenExpire * 24 * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: "none",
  secure: true,
};
// cread send token function
export const sendToken = (user: IUser, statusCode: number, res: Response) => {
  // get access and refresh token
  const accessToken = user.SignAccessToken();
  const refreshToken = user.SignRefreshToken();

  // upload session to redis
  // JWTs are stateless, meaning the server doesn't store any session information.
  //By uploading the session (user information or token details) to Redis, the server can efficiently manage the state of tokens and quickly determine if a token is valid or has been revoked.
  redis.set(user._id, JSON.stringify(user) as any);

  // set secure true only when in production
  if (process.env.NODE_ENV === "production") {
    accessTokenOptions.secure = true;
    refreshTokenOptions.secure = true;
  }

  // send tokens to cookies
  res.cookie("access_token", accessToken, accessTokenOptions);
  res.cookie("refresh_token", refreshToken, refreshTokenOptions);

  // send response to client
  res.status(statusCode).json({
    success: true,
    user,
    accessToken,
  });
};
