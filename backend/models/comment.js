import mongoose from "mongoose";

const { Schema } = mongoose;
const commentSchema = new Schema(
  {
    content: { type: String, required: true },
    author: { type: mongoose.SchemaTypes.ObjectId, ref: "User" },
    blogId: { type: mongoose.SchemaTypes.ObjectId, ref: "Blog" },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Comment", commentSchema, "comments");
