import express from "express";
import {
  activateUser,
  loginUser,
  logoutUser,
  registrationUser,
} from "../controller/user.controller";
import { isAuthenticated } from "../middleware/auth";

const userRouter = express.Router();
userRouter.post("/registration", registrationUser);

userRouter.post("/activate-user", activateUser);
userRouter.post("/login", loginUser);
userRouter.get("/logout", isAuthenticated, logoutUser);
// get(/refresh,updateAccessToken) go to postman
// then go to user.service.ts

// here from service->controller
// get(/me,isAuth,getUserinfo)  go to posman,name it load user
// go to user controlwer

// --here for social auth
// post(/social-auth,socialAuth) go to postman
export default userRouter;
