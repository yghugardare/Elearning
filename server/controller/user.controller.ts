require("dotenv").config();
import { Request, Response, NextFunction } from "express";
import userModel, { IUser } from "../models/user.model";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import path from "path";
import ejs from "ejs";
import sendMail from "../utils/sendMail";
import {
  accessTokenOptions,
  refreshTokenOptions,
  sendToken,
} from "../utils/jwt";
import { redis } from "../utils/redis";
import {
  getAllUsersService,
  getUserById,
  updateUserRoleService,
} from "../services/user.service";
import { stringify } from "querystring";
import cloudinary from "cloudinary";
// register user
interface IRegistrationBody {
  name: string;
  email: string;
  password: string;
  avatar?: string;
}

// function for resgitering the user
export const registrationUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // fetch name , email and password from client request
      const { name, email, password } = req.body;
      // check if the email exists
      const isEmailExist = await userModel.findOne({ email });
      // handle the case
      if (isEmailExist) {
        return next(new ErrorHandler("Email already exists", 400));
      }
      // get user in object
      const user: IRegistrationBody = {
        name,
        email,
        password,
      };
      // create activation token
      const activationToken = createActivationToken(user);

      // get the activation code
      const activationCode = activationToken.activationCode;

      // send user's name and activation code to his mail
      const data = { user: { name: user.name }, activationCode };

      // store in html
      const html = await ejs.renderFile(
        // platform-agnostic path
        path.join(__dirname, "../mails/activation-mail.ejs"),
        data
      );

      // send the mail
      try {
        await sendMail({
          email: user.email,
          subject: "Activate your account",
          template: "activation-mail.ejs",
          data,
        });
        res.status(201).json({
          success: true,
          message: `Please check your email: ${user.email} to activate your account!`,
          activationToken: activationToken.token,
        });
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

interface IActivationToken {
  token: string;
  activationCode: string;
}
// create activation token function
export const createActivationToken = (user: any): IActivationToken => {
  // generate a random code
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
  // encrypt the token
  const token = jwt.sign(
    {
      user,
      activationCode,
    },
    process.env.ACTIVATION_SECRET as Secret,
    {
      expiresIn: "5m",
    }
  );
  return { token, activationCode };
};
// activate user
interface IActivationRequest {
  activation_token: string;
  activation_code: string;
}

// activate user function
export const activateUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // fetch code and token from req.body
      const { activation_code, activation_token } =
        req.body as IActivationRequest;

      // create a new user
      const newUser: { user: IUser; activationCode: string } = jwt.verify(
        activation_token,
        process.env.ACTIVATION_SECRET as string
      ) as { user: IUser; activationCode: string };

      // check activation code of the new user
      if (newUser.activationCode !== activation_code) {
        return next(new ErrorHandler("Invalid Activation Code", 400));
      }

      // fetch name , email and password of the new user
      const { name, email, password } = newUser.user;

      // check if the newUser already exist in the db?
      const existUser = await userModel.findOne({ email });

      // handle case if user already exist
      if (existUser) {
        return next(new ErrorHandler("Email already exists", 400));
      }

      // if user does not exits then create the document for that user
      const user = await userModel.create({
        name,
        email,
        password,
      });

      // send the JSON response
      res.status(201).json({
        success: true,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// login user
interface ILoginRequest {
  email: string;
  password: string;
}
export const loginUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // fetch email and passowrd from client
      const { email, password } = req.body as ILoginRequest;
      // check for both
      if (!email || !password) {
        return next(new ErrorHandler("Please enter email or password", 400));
      }
      // fetch user from db based on the email
      const user = await userModel.findOne({ email }).select("+password");

      // if user is not fetched , the email or passwors is invalid
      if (!user) {
        return next(new ErrorHandler("Invalid email or password", 400));
      }
      // check password
      const isPasswordMatch = await user.comparePassword(password);
      // handle case for wrong password
      if (!isPasswordMatch) {
        return next(new ErrorHandler("Invalid email or password", 400));
      }
      //send the token to cookie and as response to the client and store session in redis
      sendToken(user, 200, res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);
// logout user
export const logoutUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // override the existing key in our cookies to empty value
      // to end session
      res.cookie("access_token", "", { maxAge: 1 });
      res.cookie("refresh_token", "", { maxAge: 1 });

      // get the userID
      const userId = req.user?._id || "";
      redis.del(userId);
      // test postman
      // then go to auth.ts middleware
      res.status(200).json({
        success: true,
        message: "Logged Out Successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// update access token
export const updateAccessToken = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log("getting refresh token");
      // get refresh token from string
      const refresh_token = req.cookies.refresh_token as string;
      console.log("got refresh token- ", refresh_token);
      // verify and get decoded token
      console.log("verifying refresh token");
      const decoded = jwt.verify(
        refresh_token,
        process.env.REFRESH_TOKEN as string
      ) as JwtPayload;
      // handle case
      // console.log("this done");
      const message = "Could not refresh token";
      if (!decoded) {
        return next(new ErrorHandler(message, 400));
      }
      console.log("verified refressh token");
      // get the session from redis
      const session = await redis.get(decoded.id as string);
      if (!session) {
        return next(
          new ErrorHandler("Please login for accessing this resources!", 400)
        );
      }
      // get the user object
      const user = JSON.parse(session);
      // generate new access and refresh tokens
      const accessToken = jwt.sign(
        { id: user._id },
        process.env.ACCESS_TOKEN as string,
        {
          expiresIn: "5m",
        }
      );
      const refreshToken = jwt.sign(
        { id: user._id },
        process.env.REFRESH_TOKEN as string,
        {
          expiresIn: "3d",
        }
      );
      // add user to req body
      req.user = user;

      // set access and refresh token to our cookie
      res.cookie("access_token", accessToken, accessTokenOptions);
      res.cookie("refresh_token", refreshToken, refreshTokenOptions);
      await redis.set(user._id, JSON.stringify(user), "EX", 604800); // 7days

      // res.status(200).json({
      //   success: true,
      //   accessToken,
      // });
      return next();
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);
// get user info
export const getUserInfo = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // get user id from user
      const userId = req.user?._id;
      getUserById(userId, res);
    } catch (error: any) {
      throw next(new ErrorHandler(error.message, 400));
    }
  }
);

// social authentication
interface ISocialAuthBody {
  email: string;
  name: string;
  avatar: string;
}
// social auth
export const socialAuth = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // get name,email and avatar form client
      const { email, name, avatar } = req.body as ISocialAuthBody;
      // get the user
      const user = await userModel.findOne({ email });
      // if user not there then create new account for him
      if (!user) {
        const newUser = await userModel.create({ name, email, avatar });
        sendToken(newUser, 200, res);
      } else {
        sendToken(user, 200, res);
      }
    } catch (error: any) {
      throw next(new ErrorHandler(error.message, 400));
    }
  }
);
// update user info
interface IUpdateUserInfo {
  name?: string;
  email?: string;
}
export const updateUserInfo = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // get name and email from body
      const { name, email } = req.body as IUpdateUserInfo;
      // take the user id
      const userId = req.user?._id;
      const user = await userModel.findById(userId);
      // update email
      if (email && user) {
        const isEmailExist = await userModel.findOne({ email });
        if (!isEmailExist) {
          return next(new ErrorHandler("Email already exists!", 400));
        }
        user.email = email;
      }
      // update name
      if (name && user) {
        user.name = name;
      }
      // save changes to our database
      await user?.save();
      // update user cache
      await redis.set(userId, JSON.stringify(user));
      // send the response
      res.status(201).json({
        success: true,
        user,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);
// update user password
interface IUpdatePassword {
  oldPassword: string;
  newPassword: string;
}
export const updatePassword = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { oldPassword, newPassword } = req.body as IUpdatePassword;
      if (!oldPassword || !newPassword) {
        return next(new ErrorHandler("Please enter old and new Password", 400));
      }
      // get the user with password
      const user = await userModel.findById(req.user?._id).select("+password");
      // handle case in case of social auth
      if (user?.password === undefined) {
        return next(new ErrorHandler("Invalid User", 400));
      }
      // check if password correct or not
      const isPasswordMatch = await user?.comparePassword(oldPassword);
      if (!isPasswordMatch) {
        return next(new ErrorHandler("Invalid old password", 400));
      }
      // reset password
      user.password = newPassword;
      // save in database
      await user.save();
      // save in the cache
      await redis.set(req.user?.id, JSON.stringify(user));
      // send response
      res.status(201).json({
        success: true,
        user,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// update profile picture
interface IUpdateProfilePicture {
  avatar: string;
}
export const updateProfilePicture = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { avatar } = req.body as IUpdateProfilePicture;
      //get user
      const userId = req.user?._id;
      const user = await userModel.findById(userId).select("+avatar");
      // if user and avatar are provided
      // console.log("user", avatar);
      if (user && avatar) {
        // if user already has one avatar
        if (user?.avatar?.public_id) {
          // first delete the old avatar
          await cloudinary.v2.uploader.destroy(user?.avatar?.public_id);
          // upload it to my cloud
          const myCloud = await cloudinary.v2.uploader.upload(avatar, {
            folder: "avatars",
            width: 150,
          });
          // set user's avatar
          user.avatar = {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
          };
          console.log("hey", user.avatar);
        } else {
          // upload new image
          const myCloud = await cloudinary.v2.uploader.upload(avatar, {
            folder: "avatars",
            width: 150,
          });
          user.avatar = {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
          };
          console.log("hello", user.avatar);
        }
      }
      // save user to db
      await user?.save();

      // save it in the cache
      await redis.set(userId, JSON.stringify(user));
      // send the response
      res.status(200).json({
        success: true,
        user,
      });
    } catch (error: any) {
      throw next(new ErrorHandler(error.message, 400));
    }
  }
);
// get all courses only for admin
export const getAllUsers = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      getAllUsersService(res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);
// allow admin to cahnge users roel
export const updateUserRole = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, role } = req.body;
      const isUserExist = await userModel.findOne({ email });
      if (isUserExist) {
        const id = isUserExist._id;
        updateUserRoleService(res, id, role);
      } else {
        res.status(400).json({
          success: false,
          message: "User not found",
        });
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);
// allow admin to delete a user from his course
export const deleteUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // get id from param
      const { id } = req.params;
      // console.log(id);

      const user = await userModel.findById(id);
      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }
      await user.deleteOne({ id });
      await redis.del(id);
      res.status(200).json({
        success: true,
        message: "User deleted succesfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);
