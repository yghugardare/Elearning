import express from "express";
import {
  activateUser,
  getUserInfo,
  loginUser,
  logoutUser,
  registrationUser,
  socialAuth,
  updateAccessToken,
} from "../controller/user.controller";
import { isAuthenticated } from "../middleware/auth";

const userRouter = express.Router();
userRouter.post("/registration", registrationUser);

userRouter.post("/activate-user", activateUser);
userRouter.post("/login", loginUser);
userRouter.get("/logout", isAuthenticated, logoutUser);
userRouter.get("/refresh",updateAccessToken);
userRouter.get("/me",isAuthenticated,getUserInfo);
userRouter.post("/social-auth",socialAuth);
// post(/social-auth,socialAuth) go to postman
export default userRouter;
