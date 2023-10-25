import mongoose from "mongoose";

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    username: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, requried: true },
    password: { type: String, requried: true },
  },
  {
    timestamps: true,
  }
);
export default mongoose.model("User", userSchema, "users");
