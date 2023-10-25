import Joi from "joi";
import bcrypt from "bcryptjs";
import User from "../models/user.js";
import JwtServices from "../services/jwtServices.js";
import RefreshToken from "../models/token.js";

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
    });
    const { error } = userRegisterSchema.validate(req.body);
    if (error) {
      return next(error);
    }
    const { username, name, email, password } = req.body;

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
};

export default authController;
