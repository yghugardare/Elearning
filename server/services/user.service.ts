import { Response } from "express";
import userModel from "../models/user.model";

export const getUserById = async (id: string, res: Response) => {
  // get user from db
  // console.log("id-",id)
  const user = await userModel.findById(id);
  // console.log(user)
  // return user as resonse
  res.status(201).json({
    success: true,
    user,
  });
};

/*
import { Response } from "express";
import { redis } from "../utils/redis";
import userModel from "../models/user.model";
-- here froum route
// get user by id
export const getUserById = async (id: string, res: Response) => {
//   const userJson = await redis.get(id);
user = await usermodel.findbyid(id)

//   if (userJson) {
//     const user = JSON.parse(userJson);
    res.status(201).json({
      success: true,
      user,
    });
//   }
}; -- go to controller

// Get All users
export const getAllUsersService = async (res: Response) => {
  const users = await userModel.find().sort({ createdAt: -1 });

  res.status(201).json({
    success: true,
    users,
  });
};

// update user role
export const updateUserRoleService = async (res:Response,id: string,role:string) => {
  const user = await userModel.findByIdAndUpdate(id, { role }, { new: true });

  res.status(201).json({
    success: true,
    user,
  });
}

*/