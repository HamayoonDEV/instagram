import Joi from "joi";
import bcrypt from "bcryptjs";
import User from "../models/user.js";
import JwtServices from "../services/jwtServices.js";
import RefreshToken from "../models/token.js";
import fs from "fs";
import { BACKEND_URL } from "../config/index.js";

const mongoIdPattern = /^[0-9a-fA-F]{24}$/;
const passwordPattren =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[ -/:-@\[-`{-~]).{6,64}$/;

const authController = {
  //create user Register method
  async userRegister(req, res, next) {
    const userRegisterSchema = Joi.object({
      username: Joi.string().min(5).max(30).required(),
      name: Joi.string().max(30).required(),
      email: Joi.string().email().required(),
      password: Joi.string().pattern(passwordPattren).required(),
      photopath: Joi.string(),
    });
    const { error } = userRegisterSchema.validate(req.body);
    if (error) {
      return next(error);
    }
    const { username, name, email, password, photopath } = req.body;
    //hasing password
    const hashedPassword = await bcrypt.hash(password, 10);
    //handle username and email conflict
    try {
      const emailInUse = await User.exists({ email });
      const usernameInUse = await User.exists({ username });
      if (emailInUse) {
        const error = {
          status: 409,
          message: "email is already Registered!",
        };
        return next(error);
      }
      if (usernameInUse) {
        const error = {
          status: 409,
          message: "email is already Registered!",
        };
        return next(error);
      }
    } catch (error) {
      return next(error);
    }

    //save registration in database
    let user;
    if (photopath) {
      //read photo in buffer
      const buffer = Buffer.from(
        photopath.replace(/^data:image\/(png|jpg|jpeg);base64,/, ""),
        "base64"
      );
      //allocate photo a random name
      const imagePath = `${Date.now()}-${username}.png`;
      //store locally
      fs.writeFileSync(`storage/userProfile/${imagePath}`, buffer);
      //save to database
      try {
        const userToRegister = new User({
          username,
          name,
          email,
          photopath: `${BACKEND_URL}/storage/userProfile/${imagePath}`,
          password: hashedPassword,
        });
        user = await userToRegister.save();
      } catch (error) {
        return next(error);
      }
    } else {
      try {
        const userToRegister = new User({
          username,
          name,
          email,
          password: hashedPassword,
        });
        user = await userToRegister.save();
      } catch (error) {
        return next(error);
      }
    }

    //genrating tokens
    const accessToken = JwtServices.signAccessToken({ _id: user.id }, "30m");
    const refreshToken = JwtServices.signRefreshToken({ _id: user.id }, "60m");
    //storing tokens to the database
    await JwtServices.storeRefreshToken(user.id, refreshToken);
    //sending tokens to the cookies
    res.cookie("accessToken", accessToken, {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
    });
    res.cookie("refreshToken", refreshToken, {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
    });
    //sending response
    res.status(201).json({ user, auth: true });
  },

  //creating login method
  async login(req, res, next) {
    const loginSchema = Joi.object({
      username: Joi.string().min(5).max(30).required(),
      password: Joi.string().pattern(passwordPattren).required(),
    });
    const { error } = loginSchema.validate(req.body);
    if (error) {
      return next(error);
    }
    const { username, password } = req.body;
    //finding username and password in the database
    let user;
    try {
      user = await User.findOne({ username });
      if (!user) {
        const error = {
          status: 401,
          message: "invalid username!",
        };
        return next(error);
      }
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        const error = {
          status: 401,
          message: "invalid password!",
        };
        return next(error);
      }
    } catch (error) {
      return next(error);
    }
    //genrating tokens
    const accessToken = JwtServices.signAccessToken({ _id: user.id }, "30m");
    const refreshToken = JwtServices.signRefreshToken({ _id: user.id }, "60m");
    //updating tokens to the database
    await RefreshToken.updateOne(
      { _id: user.id },
      { token: refreshToken },
      { upsert: true }
    );
    //sending tokens to the cookies
    res.cookie("accessToken", accessToken, {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
    });
    res.cookie("refreshToken", refreshToken, {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
    });
    // sending response
    res.status(200).json({ user, auth: true });
  },
  //logout method
  async logout(req, res, next) {
    //fetch refreshToken from cookies
    const { refreshToken } = req.cookies;
    //delete refreshToken
    try {
      await RefreshToken.deleteOne({ refreshToken });
    } catch (error) {
      return next(error);
    }
    //clear tokens from cookies
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    //sending response
    res.status(200).json({ user: null, auth: true });
  },

  //refresh method
  async refresh(req, res, next) {
    //fetch refreshToken from cookies
    const originalRefreshToken = req.cookies.refreshToken;
    //verfiy refreshToken
    let id;
    try {
      id = await JwtServices.verifyRefreshToken(originalRefreshToken)._id;
    } catch (error) {
      const e = {
        status: 401,
        message: "unAuthorized!",
      };
      return next(e);
    }
    //match the token authantication
    try {
      const match = await RefreshToken.findOne({
        _id: id,
        token: originalRefreshToken,
      });
      if (!match) {
        const error = {
          status: 401,
          message: "unAuthrozied!",
        };
        return next(error);
      }
    } catch (error) {
      return next(error);
    }
    //genrate new tokens
    const accessToken = JwtServices.signAccessToken({ _id: id }, "30m");
    const refreshToken = JwtServices.signRefreshToken({ _id: id }, "60m");
    //update the refreshToken to the database
    await RefreshToken.updateOne({ _id: id }, { token: refreshToken });
    //sending tokens to the cookies
    res.cookie("accessToken", accessToken, {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
    });
    res.cookie("refreshToken", refreshToken, {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
    });
    const user = await User.findOne({ _id: id });
    //sending response
    res.status(200).json({ user, auth: true });
  },
  //get all users
  async getUser(req, res, next) {
    //get user
    try {
      const users = await User.find({});
      const userArr = [];
      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        userArr.push(user);
      }
      return res.status(200).json({ users: userArr });
    } catch (error) {
      return next(error);
    }
  },

  //update user method
  async updateUser(req, res, next) {
    const userUpdateSchema = Joi.object({
      photopath: Joi.string(),
      userId: Joi.string().regex(mongoIdPattern).required(),
    });
    const { error } = userUpdateSchema.validate(req.body);
    if (error) {
      return next(error);
    }
    const { photopath, userId } = req.body;
    try {
      const user = await User.findOne({ _id: userId });
      if (photopath) {
        let previous = user.photopath;

        if (previous) {
          previous = previous.split("/").at(-1);
          fs.unlinkSync(`storage/userProfile/${previous}`);
        }

        //read photo in buffer
        const buffer = Buffer.from(
          photopath.replace(/^data:image\/(png|jpg|jpeg);base64,/, ""),
          "base64"
        );
        //allocate photo a random name
        const imagePath = `${Date.now()}-${userId}.png`;
        //store locally
        fs.writeFileSync(`storage/userProfile/${imagePath}`, buffer);
        //update database
        try {
          await User.updateOne(
            { _id: userId },
            { photopath: `${BACKEND_URL}/storage/userProfile/${imagePath}` }
          );
        } catch (error) {
          return next(error);
        }
      }
    } catch (error) {
      return next(error);
    }
    //sending response
    res.status(200).json({ message: "Profile picture has been updated!" });
  },
};

export default authController;
