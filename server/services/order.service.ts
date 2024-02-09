/*
import { NextFunction, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import OrderModel from "../models/order.Model";

-- here from controller

// create new order
export const newOrder = CatchAsyncError(async(data:any,res:Response) => {
    const order = await OrderModel.create(data);
    next(order)
    // res.status(201).json({
    //     succcess:true,
    //     order,
    // })

});

// Get All Orders
export const getAllOrdersService = async (res: Response) => {
    const orders = await OrderModel.find().sort({ createdAt: -1 });
  
    res.status(201).json({
      success: true,
      orders,
    });
  };
  

*/