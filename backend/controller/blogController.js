import Joi from "joi";
import Blog from "../models/blog.js";
import { BACKEND_URL } from "../config/index.js";
import fs from "fs";

const mongoIdPattern = /^[0-9a-fA-F]{24}$/;

const blogController = {
  //create blog
  async createBlog(req, res, next) {
    const createBlogSchema = Joi.object({
      content: Joi.string().required(),
      title: Joi.string().required(),
      photopath: Joi.string(),
      author: Joi.string().regex(mongoIdPattern).required(),
    });
    const { error } = createBlogSchema.validate(req.body);
    let blog;
    if (error) {
      return next(error);
    }

    const { content, title, photopath, author } = req.body;

    if (photopath) {
      //read photo in buffer
      //read photo in buffer
      const buffer = Buffer.from(
        photopath.replace(/^data:image\/(png|jpg|jpeg);base64,/, ""),
        "base64"
      );
      //allocate photo a random name
      const imagePath = `${Date.now()}-${author}.png`;
      //store locally
      fs.writeFileSync(`storage/blogImages/${imagePath}`, buffer);

      //store blog in batabase with photo

      try {
        const newblog = new Blog({
          content,
          title,
          author,
          photopath: `${BACKEND_URL}/storage/blogImages/${imagePath}`,
        });
        blog = await newblog.save();
      } catch (error) {
        return next(error);
      }
    } else {
      const newBlog = new Blog({
        content,
        title,
        author,
      });
      blog = await newBlog.save();
    }

    //sending response
    res.status(201).json({ blog });
  },
};

export default blogController;
