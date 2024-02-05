import express from "express";
import {
  activateUser,
  getUserInfo,
  loginUser,
  logoutUser,
  registrationUser,
  socialAuth,
  updateAccessToken,
  updatePassword,
  updateUserInfo,
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
userRouter.put("/update-user-info",isAuthenticated,updateUserInfo)
userRouter.put("/update-user-password",isAuthenticated,updatePassword)

// -- go to user controller
// -- here 3
// put(update-user-avatar.isAuth,updateuserProfilepicture)


export default userRouter;
