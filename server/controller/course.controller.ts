import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import cloudinary from "cloudinary";
import { url } from "inspector";
import { createCourse, getAllCoursesService } from "../services/course.service";
import CourseModel from "../models/course.model";
import { redis } from "../utils/redis";
import mongoose from "mongoose";
import path from "path";
import ejs from "ejs";
import sendMail from "../utils/sendMail";
import NotificationModel from "../models/notification.model";
import axios from "axios";
import { AIModel } from "../models/ai.model";
// upload course
export const uploadCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const thumbnail = data.thumbnail;
      if (thumbnail) {
        const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: "courses",
        });
        // add thumbnail to the data
        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }
      createCourse(data, res, next);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// edit the course
export const editCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;

      const thumbnail = data.thumbnail;

      const courseId = req.params.id;

      const courseData = (await CourseModel.findById(courseId)) as any;

      if (thumbnail && !thumbnail.startsWith("https")) {
        await cloudinary.v2.uploader.destroy(courseData.thumbnail.public_id);

        const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: "courses",
        });

        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }

      if (thumbnail.startsWith("https")) {
        data.thumbnail = {
          public_id: courseData?.thumbnail.public_id,
          url: courseData?.thumbnail.url,
        };
      }

      const course = await CourseModel.findByIdAndUpdate(
        courseId,
        {
          $set: data,
        },
        { new: true }
      );

      res.status(201).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get single course w/o purchasing
export const getSingleCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;
      // get course cache ,JSON
      const isCacheExist = await redis.get(courseId);
      if (isCacheExist) {
        // debug
        // console.log("redis hitt");
        // make it object
        const course = JSON.parse(isCacheExist);
        res.status(200).json({
          success: true,
          course,
        });
      } else {
        // console.log("mongodb hit");
        // get the course
        const course = await CourseModel.findById(courseId).select(
          "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
        );
        // set course to redis , so that next time info is rendered directly from the cache
        // expiration time of 60x60x24x7 = 604800 = 7days, for the course data
        // advance cache
        await redis.set(courseId, JSON.stringify(course), "EX", 604800);
        res.status(200).json({
          success: true,
          course,
        });
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
// get all courses
export const getAllCourses = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // dont store in cache
      const courses = await CourseModel.find().select(
        "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
      );
      res.status(200).json({
        success: true,
        courses,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
// get course content only for those who purchased it
export const getCourseByUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // fetch user course list
      const userCourseList = req.user?.courses;

      // console.log(req.user?.name)
      // console.log(userCourseList)

      // get course id from param url
      const courseId = req.params.id;
      // has the user purchased?

      //if he is user then
      if (req.user?.role === "user") {
        const courseExists = userCourseList?.find(
          (course: any) => course._id.toString() === courseId
        );
        if (!courseExists) {
          return next(
            new ErrorHandler("You are not eligible to access this course", 404)
          );
        }
      }
      // get course
      const course = await CourseModel.findById(courseId);
      // get constent
      const content = course?.courseData;
      res.status(200).json({
        success: true,
        content,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
// add question to our course
interface IAddQuestionData {
  question: string;
  courseId: string;
  contentId: string;
}
export const addQuestion = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // fetch question from client
      const { question, courseId, contentId }: IAddQuestionData = req.body;
      // get the course from course id
      const course = await CourseModel.findById(courseId);
      // check if the content id is valid or not
      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler("Invalid content Id", 400));
      }

      // get the course content
      const courseContent = course?.courseData?.find((item: any) => {
        return item._id.equals(contentId);
      });

      // if course content not found
      if (!courseContent) {
        return next(new ErrorHandler("Invalid content Id", 400));
      }
      // create a new question
      const newQuestion: any = {
        user: req.user,
        question,
        questionReplies: [],
      };
      // add questionn to course content
      courseContent.questions.push(newQuestion);
      // send notfication for the question to the admin
      await NotificationModel.create({
        user: req.user?._id,
        title: "New Question Received",
        message: `You have a new question in ${courseContent.title}`,
      });

      //save the course conten to mongo db
      await course?.save();
      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
interface IAddAnswerData {
  answer: string;
  courseId: string;
  contentId: string;
  questionId: string;
}
export const addAnwser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // fetch answer for frontend
      const { answer, courseId, contentId, questionId }: IAddAnswerData =
        req.body;
      // get the course from course id
      const course = await CourseModel.findById(courseId);
      // check if the content id is valid or not
      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler("Invalid content Id", 400));
      }
      // get the course content
      const courseContent = course?.courseData?.find((item: any) =>
        item._id.equals(contentId)
      );
      // if course content not found
      if (!courseContent) {
        return next(new ErrorHandler("Invalid content Id", 400));
      }
      // search question
      const question = courseContent?.questions?.find((item: any) =>
        item._id.equals(questionId)
      );
      // handle case
      if (!question) {
        return next(new ErrorHandler("Invalid Question Id", 400));
      }
      // create  a new answer object
      const newAnswer: any = {
        user: req.user,
        answer,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // add answer to course content
      question.questionReplies.push(newAnswer);
      // save to data base
      await course?.save();
      // if i am replying to my own question then no need to send me mail
      if (req.user?._id === question.user?._id) {
        // create a notification
        console.log("Same ho");
        await NotificationModel.create({
          user: req.user?._id,
          title: "New Question Reply Received",
          message: `You have a new question reply in ${courseContent.title}`,
        });
      } else {
        // send mail
        const data = {
          name: question.user.name,
          title: courseContent.title,
        };
        // use ejs to render html file with data
        const html = await ejs.renderFile(
          path.join(__dirname, "../mails/question-reply.ejs"),
          data
        );
        // send mail
        try {
          await sendMail({
            email: question.user.email,
            subject: "Question Reply",
            template: "question-reply.ejs",
            data,
          });
        } catch (error: any) {
          return next(new ErrorHandler(error.message, 500));
        }
      }
      // send response
      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
interface IAddReviewData {
  review: string;

  rating: number;
  userId: string;
}
// add review and ratings in course
export const addReview = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // get course list and course id
      const userCourseList = req.user?.courses;
      const courseId = req.params.id;
      // check if course exist based on course id
      const courseExists = userCourseList?.some(
        (course: any) => course._id.toString() === courseId.toString()
      );
      if (!courseExists) {
        return next(
          new ErrorHandler("You are not eligible to access this course", 404)
        );
      }
      // get gourse
      const course = await CourseModel.findById(courseId);
      const { review, rating } = req.body as IAddReviewData;
      const reviewData: any = {
        user: req.user,
        rating,
        comment: review,
      };
      course?.reviews.push(reviewData);
      let avg = 0;
      course?.reviews.forEach((rev: any) => {
        avg += rev.rating;
      });
      if (course) {
        course.ratings = avg / course.reviews.length;
      }
      await course?.save();
      // const notification = {
      //   // user: req.user?._id,
      //   title: "New Review Received",
      //   message: `${req.user?.name} has given a review in ${course?.name}`,
      // };
      await redis.set(courseId, JSON.stringify(course), "EX", 604800); // 7days

      // create notification
      await NotificationModel.create({
        user: req.user?._id,
        title: "New Review Received",
        message: `${req.user?.name} has given a review in ${course?.name}`,
      });
      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
//add reply to review only for admin
interface IAddReviewData {
  comment: string;
  courseId: string;
  reviewId: string;
}
export const addReplyToReview = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // get data from client
      const { comment, courseId, reviewId } = req.body as IAddReviewData;
      // get course from mongo db
      const course = await CourseModel.findById(courseId);
      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }
      // console.log(course)
      // get review from the course
      const review = course?.reviews?.find(
        (rev: any) => rev._id.toString() === reviewId
      );
      if (!review) {
        return next(new ErrorHandler("Review not found", 404));
      }
      const replyData: any = {
        user: req.user,
        comment,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      if (!review.commentReplies) {
        review.commentReplies = [];
      }
      // push reply to comment replies
      review.commentReplies?.push(replyData);

      // save to ddb
      await course?.save();
      // await redis.set(courseId, JSON.stringify(course), "EX", 604800); // 7days
      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
// get all course related info for admin
export const getAdminAllCourses = CatchAsyncError(
  async (req: Response, res: Response, next: NextFunction) => {
    try {
      getAllCoursesService(res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);
// delete course for admin
export const deleteCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const course = await CourseModel.findById(id);

      if (!course) {
        return next(new ErrorHandler("course not found", 404));
      }

      await course.deleteOne({ id });

      await redis.del(id);

      res.status(200).json({
        success: true,
        message: "course deleted successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// generate video url
export const generateVideoUrl = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { videoId } = req.body;
      const response = await axios.post(
        `https://dev.vdocipher.com/api/videos/${videoId}/otp`,
        { ttl: 300 }, // expiry
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Apisecret ${process.env.VDOCIPHER_API_SECRET}`,
          },
        }
      );
      res.json(response.data);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// function to get transcript and course name from course
export const getTranscript = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { videoName } = req.body;
      // console.log(videoName);
      const course = await CourseModel.findById(id);
      const courseName = course?.name;
      const ai = await AIModel.findOne({ title: videoName });
      // console.log(ai, "ai");
      const transcript = ai?.transcription;
      res.status(200).json({
        success: true,
        transcript,
        courseName
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);
