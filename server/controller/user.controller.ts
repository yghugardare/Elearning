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
import { getUserById } from "../services/user.service";

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
      console.log("this done");
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
      res.status(200).json({
        success: true,
        accessToken,
      });
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
      if(!user){
        const newUser = await userModel.create({name,email,avatar});
        sendToken(newUser,200,res)
      }else{
        sendToken(user,200,res)
      }

    } catch (error: any) {
      throw next(new ErrorHandler(error.message, 400));
    }
  }
);

/*

export const registrationUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password } = req.body;

      const isEmailExist = await userModel.findOne({ email });
      if (isEmailExist) {
        return next(new ErrorHandler("Email already exist", 400));
      }

      const user: IRegistrationBody = {
        name,
        email,
        password,
      };

      const activationToken = createActivationToken(user);

      const activationCode = activationToken.activationCode;

      const data = { user: { name: user.name }, activationCode };
      const html = await ejs.renderFile(
        path.join(__dirname, "../mails/activation-mail.ejs"),
        data
      );

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

export const createActivationToken = (user: any): IActivationToken => {
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString();

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

export const activateUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { activation_token, activation_code } =
        req.body as IActivationRequest;

      const newUser: { user: IUser; activationCode: string } = jwt.verify(
        activation_token,
        process.env.ACTIVATION_SECRET as string
      ) as { user: IUser; activationCode: string };

      if (newUser.activationCode !== activation_code) {
        return next(new ErrorHandler("Invalid activation code", 400));
      }

      const { name, email, password } = newUser.user;

      const existUser = await userModel.findOne({ email });

      if (existUser) {
        return next(new ErrorHandler("Email already exist", 400));
      }
      const user = await userModel.create({
        name,
        email,
        password,
      });

      res.status(201).json({
        success: true,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Login user
interface ILoginRequest {
  email: string;
  password: string;
}

export const loginUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body as ILoginRequest;

      if (!email || !password) {
        return next(new ErrorHandler("Please enter email and password", 400));
      }

      const user = await userModel.findOne({ email }).select("+password");

      if (!user) {
        return next(new ErrorHandler("Invalid email or password", 400));
      }

      const isPasswordMatch = await user.comparePassword(password);
      if (!isPasswordMatch) {
        return next(new ErrorHandler("Invalid email or password", 400));
      }
      // GO To utils and create jwt.ts
      sendToken(user, 200, res);  // import this
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  } // to user.route.ts
);

// logout user
export const logoutUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.cookie("access_token", "", { maxAge: 1 });
      res.cookie("refresh_token", "", { maxAge: 1 });
      const userId = req.user?._id || ""; // NO NEED
      redis.del(userId);  //NO NEED
      res.status(200).json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
 );

--- start  here
// update access token, which will simply update our access token
export const updateAccessToken = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refresh_token = req.cookies.refresh_token as string;
      const decoded = jwt.verify(
        refresh_token,
        process.env.REFRESH_TOKEN as string
      ) as JwtPayload;

      const message = "Could not refresh token";
      if (!decoded) {
        return next(new ErrorHandler(message, 400));
      }
      const session = await redis.get(decoded.id as string);
         
      if (!session) {
        return next(
          new ErrorHandler("Please login for access this resources!", 400)
        );
      }
      
      const user = JSON.parse(session);

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

      req.user = user;
        -- go to jwt.ts and add 60*60*1000, cut and paste it outside so we can export it
      res.cookie("access_token", accessToken, accessTokenOptions);
      res.cookie("refresh_token", refreshToken, refreshTokenOptions);
      res.status(200) -- 11:10 go to user.route.ts
      // await redis.set(user._id, JSON.stringify(user), "EX", 604800); // 7days

      // return next();
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);
-- here from service
// get user info
export const getUserInfo = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      getUserById(userId, res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
); // go to route

// here from routes
interface ISocialAuthBody {
  email: string;
  name: string;
  avatar: string;
}

// social auth
export const socialAuth = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, name, avatar } = req.body as ISocialAuthBody;
      const user = await userModel.findOne({ email });
      if (!user) {
        const newUser = await userModel.create({ email, name, avatar });
        // create new user
        sendToken(newUser, 200, res);
      } else {
        sendToken(user, 200, res);
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  } -- we are validating everything from frontend nextAuth
); -- go to route

// update user info
interface IUpdateUserInfo {
  name?: string;
  email?: string;
}

export const updateUserInfo = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name } = req.body as IUpdateUserInfo;

      const userId = req.user?._id;
      const user = await userModel.findById(userId);

      if (name && user) {
        user.name = name;
      }

      await user?.save();

      await redis.set(userId, JSON.stringify(user));

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
        return next(new ErrorHandler("Please enter old and new password", 400));
      }

      const user = await userModel.findById(req.user?._id).select("+password");

      if (user?.password === undefined) {
        return next(new ErrorHandler("Invalid user", 400));
      }

      const isPasswordMatch = await user?.comparePassword(oldPassword);

      if (!isPasswordMatch) {
        return next(new ErrorHandler("Invalid old password", 400));
      }

      user.password = newPassword;

      await user.save();

      await redis.set(req.user?._id, JSON.stringify(user));

      res.status(201).json({
        success: true,
        user,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

interface IUpdateProfilePicture {
  avatar: string;
}

// update profile picture
export const updateProfilePicture = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { avatar } = req.body as IUpdateProfilePicture;

      const userId = req.user?._id;

      const user = await userModel.findById(userId).select("+password");

      if (avatar && user) {
        // if user have one avatar then call this if
        if (user?.avatar?.public_id) {
          // first delete the old image
          await cloudinary.v2.uploader.destroy(user?.avatar?.public_id);

          const myCloud = await cloudinary.v2.uploader.upload(avatar, {
            folder: "avatars",
            width: 150,
          });
          user.avatar = {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
          };
        } else {
          const myCloud = await cloudinary.v2.uploader.upload(avatar, {
            folder: "avatars",
            width: 150,
          });
          user.avatar = {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
          };
        }
      }

      await user?.save();

      await redis.set(userId, JSON.stringify(user));

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// get all users --- only for admin
export const getAllUsers = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      getAllUsersService(res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// update user role --- only for admin
export const updateUserRole = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, role } = req.body;
      const isUserExist = await userModel.findOne({ email });
      if (isUserExist) {
        const id = isUserExist._id;
        updateUserRoleService(res,id, role);
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

// Delete user --- only for admin
export const deleteUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const user = await userModel.findById(id);

      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }

      await user.deleteOne({ id });

      await redis.del(id);

      res.status(200).json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);


*/
