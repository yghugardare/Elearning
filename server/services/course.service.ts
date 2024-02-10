import { Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import CourseModel from "../models/course.model";

export const createCourse = CatchAsyncError(
  async (data: any, res: Response) => {
    // create document in courses collection
    const course = await CourseModel.create(data);
    // send the response
    res.status(201).json({
      success: true,
      course,
    });
  }
);
// get all course service
export const getAllCoursesService = async (res: Response) => {
  const courses = await CourseModel.find().sort({ createdAt: -1 });
  res.status(201).json({
    success: true,
    courses,
  });
};
