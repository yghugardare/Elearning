import express from "express";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import { editCourse, uploadCourse } from "../controller/course.controller";
// create course router
export const courseRouter = express.Router();

courseRouter.post(
  "/create-course",
  isAuthenticated,
  authorizeRoles("admin"),
  uploadCourse
);

courseRouter.put(
  "/edit-course/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  editCourse
);
