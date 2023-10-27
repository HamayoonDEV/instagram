import mongoose from "mongoose";

const { Schema } = mongoose;

const likeSchema = new Schema(
  {
    value: { type: Number, required: true },
    blogId: { type: mongoose.SchemaTypes.ObjectId, ref: "Blog" },
    author: { type: mongoose.SchemaTypes.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  }
);
export default mongoose.model("Like", likeSchema, "likes");
