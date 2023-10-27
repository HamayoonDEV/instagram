import Joi from "joi";
import Blog from "../models/blog.js";

const mongoIdPattern = /^[0-9a-fA-F]{24}$/;
const likeController = {
  //Like method
  async like(req, res, next) {
    const likeSchema = Joi.object({
      value: Joi.number().integer().required(),
      blogId: Joi.string().regex(mongoIdPattern).required(),
      author: Joi.string().regex(mongoIdPattern).required(),
    });
  },
};
