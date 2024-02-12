import express from "express";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import { createLayout, editLayout } from "../controller/layout.controller";

export const layoutRouter = express.Router();
layoutRouter.post(
  "/create-layout",
  isAuthenticated,
  authorizeRoles("admin"),
  createLayout
);
layoutRouter.put(
  "/edit-layout",
  isAuthenticated,
  authorizeRoles("admin"),
  editLayout
);
