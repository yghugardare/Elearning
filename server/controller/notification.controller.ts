import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import NotificationModel from "../models/notification.model";

export const getNotifications = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // get the notfication based on the newest one at the top
      const notifications = await NotificationModel.find().sort({
        createdAt: -1,
      });
      // send a response
      res.status(201).json({
        success: true,
        notifications,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
// update the notification status to "read"
// only for admin
export const updateNotification = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // find the notification that you read
      const notification = await NotificationModel.findById(req.params.id);
      // handle case
      if (!notification) {
        return next(new ErrorHandler("Notification not found", 404));
      } else {
        notification.status
          ? (notification.status = "read")
          : notification.status;
      }
      // save to db
      await notification.save();

      // after saving again sort, so at frontend updating state becomes easy
      const notifications = await NotificationModel.find().sort({
        createdAt: -1,
      });
      // send response
      res.status(201).json({
        success: true,
        notifications,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

/*
import NotificationModel from "../models/notification.Model";
import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import cron from "node-cron";

);
-- go to route
-- add notification to course model
-- add question , add notification when user does both asks question and ask replies
- install node crone
// delete notification --- only admin
cron.schedule("0 0 0 * * *", async() => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  await NotificationModel.deleteMany({status:"read",createdAt: {$lt: thirtyDaysAgo}});
  console.log('Deleted read notifications');
});

*/
