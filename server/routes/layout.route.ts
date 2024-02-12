import express from "express";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import { createLayout } from "../controller/layout.controller";

export const layoutRouter = express.Router();
layoutRouter.post(
  "/create-layout",
  isAuthenticated,
  authorizeRoles("admin"),
  createLayout
);
