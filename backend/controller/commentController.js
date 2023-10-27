import Joi from "joi";
import Blog from "../models/blog.js";
import Comment from "../models/comment.js";
import CommentDto from "../Dto/commentDto.js";

const mongoIdPattern = /^[0-9a-fA-F]{24}$/;

const commentController = {
  //create comment
  async createComment(req, res, next) {
    const createCommentSchema = Joi.object({
      content: Joi.string().required(),
      author: Joi.string().regex(mongoIdPattern).required(),
      blogId: Joi.string().regex(mongoIdPattern),
    });
    const { error } = createCommentSchema.validate(req.body);
    if (error) {
      return next(error);
    }

    const { content, author, blogId } = req.body;
    try {
      await Blog.findOne({ _id: blogId });
    } catch (error) {
      return next(error);
    }
    //store comment in database
    try {
      const newComment = new Comment({
        content,
        author,
        blogId,
      });
      await newComment.save();
    } catch (error) {
      return next(error);
    }
    //sending response
    res.status(201).json({ message: "comment has been created!" });
  },
  //read comment method
  async readComment(req, res, next) {
    const readCommentSchema = Joi.object({
      id: Joi.string().regex(mongoIdPattern).required(),
    });
    const { error } = readCommentSchema.validate(req.params);
    if (error) {
      return next(error);
    }
    const { id } = req.params;
    try {
      const comments = await Comment.find({ blogId: id }).populate("author");
      const commentArr = [];
      for (let i = 0; i < comments.length; i++) {
        const comment = new CommentDto(comments[i]);
        commentArr.push(comment);
      }
      return res.status(200).json({ comments: commentArr });
    } catch (error) {
      return next(error);
    }
  },
  //delete comment method
  async deleteComment(req, res, next) {
    const deleteCommentSchema = Joi.object({
      id: Joi.string().regex(mongoIdPattern).required(),
    });
    const { error } = deleteCommentSchema.validate(req.params);
    if (error) {
      return next(error);
    }

    const { id } = req.params;
    try {
      await Comment.deleteOne({ _id: id });
    } catch (error) {
      return next(error);
    }
    //sending response
    res.status(200).json({ message: "comment has been deleted!" });
  },
};

export default commentController;
