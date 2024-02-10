import { Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import OrderModel from "../models/order.model";

// create new order
export const newOrder = CatchAsyncError(async (data: any, res: Response) => {
  // create order document
  const order = await OrderModel.create(data);
  res.status(201).json({
    success: true,
    order,
  });
});
// Get All Orders
export const getAllOrdersService = async (res: Response) => {
  const orders = await OrderModel.find().sort({ createdAt: -1 });

  res.status(201).json({
    success: true,
    orders,
  });
};
