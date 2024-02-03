import express from "express";
import { activateUser, registrationUser } from "../controller/user.controller";


const userRouter = express.Router();
userRouter.post("/registration", registrationUser);

userRouter.post("/activate-user",activateUser)
// post(/activate-user,activateUser)

// open postman for testing


export default userRouter;



