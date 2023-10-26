import mongoose from "mongoose";

const { Schema } = mongoose;

const blogSchema = new Schema(
  {
    content: { type: String, required: true },
    title: { type: String, required: true },
    photopath: { type: String },
    author: { type: mongoose.SchemaTypes.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Blog", blogSchema, "blogs");
