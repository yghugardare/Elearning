import express from "express";
import { registrationUser } from "../controller/user.controller";


const userRouter = express.Router();
userRouter.post("/registration", registrationUser);

export default userRouter;



