import express from "express";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import { createOrder } from "../controller/order.controller";

export const orderRouter = express.Router();

orderRouter.post("/create-order", isAuthenticated, createOrder);

/*
-- go to app.ts then postman
orderRouter.get(
  "/get-orders",
  isAutheticated,
  authorizeRoles("admin"),
  getAllOrders
);

orderRouter.get("/payment/stripepublishablekey", sendStripePublishableKey);

orderRouter.post("/payment", isAutheticated, newPayment);

export default orderRouter;
*/
