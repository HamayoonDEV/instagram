import Joi from "joi";
import Blog from "../models/blog.js";
import { BACKEND_URL } from "../config/index.js";
import fs from "fs";
import BlogDto from "../Dto/blogDto.js";
import Comment from "../models/comment.js";

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
  //get all blogs
  async getAll(req, res, next) {
    //fetching all blogs from database
    try {
      const blogs = await Blog.find({}).populate("author");
      const blogArr = [];
      for (let i = 0; i < blogs.length; i++) {
        const blog = new BlogDto(blogs[i]);
        blogArr.push(blog);
      }
      //sending response
      return res.status(200).json({ blogs: blogArr });
    } catch (error) {
      return next(error);
    }
  },
  //getBlog by id
  async getBlogById(req, res, next) {
    const getBlogByIdSchema = Joi.object({
      id: Joi.string().regex(mongoIdPattern).required(),
    });
    const { error } = getBlogByIdSchema.validate(req.params);
    if (error) {
      return next(error);
    }
    const { id } = req.params;
    let blog;
    try {
      blog = await Blog.findOne({ _id: id }).populate("author");
      if (!blog) {
        const error = {
          status: 404,
          message: "blog not found!",
        };
        return next(error);
      }
    } catch (error) {
      return next(error);
    }
    const blogDto = new BlogDto(blog);
    //sending response
    res.status(200).json({ blog: blogDto });
  },
  //update blog
  async updateBlog(req, res, next) {
    const updateBlogSchema = Joi.object({
      content: Joi.string(),
      title: Joi.string(),
      photopath: Joi.string(),
      blogId: Joi.string().regex(mongoIdPattern).required(),
      author: Joi.string().regex(mongoIdPattern).required(),
    });
    const { error } = updateBlogSchema.validate(req.body);
    if (error) {
      return next(error);
    }
    const { content, title, photopath, author, blogId } = req.body;
    try {
      const blog = await Blog.findOne({ _id: blogId });
      if (photopath) {
        let previous = blog.photopath;
        if (previous) {
          previous = previous.split("/").at(-1);
          fs.linkSync(`storage/blogImages/${previous}`);
        }
        //allocate photo a random name
        const imagePath = `${Date.now()}-${author}.png`;
        //store locally
        fs.writeFileSync(`storage/blogImages/${imagePath}`, buffer);

        //update data base
        await Blog.updateOne(
          { _id: blogId },
          { content, title, photopath, author }
        );
      } else {
        await Blog.updateOne({ _id: blogId }, { content, title, author });
      }
    } catch (error) {
      return next(error);
    }
    //sending response
    res.status(200).json({ message: "blog has been updated!" });
  },

  //blog delete method
  async deleteBlog(req, res, next) {
    const deleteBlogSchema = Joi.object({
      id: Joi.string().regex(mongoIdPattern).required(),
    });
    const { error } = deleteBlogSchema.validate(req.params);
    if (error) {
      return next(error);
    }
    const { id } = req.params;
    try {
      await Blog.deleteOne({ _id: id });
      await Comment.deleteMany({});
    } catch (error) {
      return next(error);
    }
    //sending response
    res.status(200).json({ message: "blog has been deleted!" });
  },
};

export default blogController;
