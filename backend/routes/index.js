import express from "express";
import authController from "../controller/authController.js";
import auth from "../middleWare/auth.js";
import blogController from "../controller/blogController.js";
import commentController from "../controller/commentController.js";

const router = express.Router();
//authController endPoints
router.post("/register", authController.userRegister);
router.post("/login", authController.login);
router.post("/logout", auth, authController.logout);
router.get("/refresh", authController.refresh);
router.get("/getAll", authController.getUser);
router.put("/updateUser", auth, authController.updateUser);

//blogController endPoints
router.post("/blog", blogController.createBlog);
router.get("/blog/all", blogController.getAll);
router.get("/blog/:id", auth, blogController.getBlogById);
router.put("/blog/update", auth, blogController.updateBlog);
router.delete("/blog/:id", auth, blogController.deleteBlog);

//commentController endPoints
router.post("/comment", auth, commentController.createComment);
router.get("/comment/:id", auth, commentController.readComment);
router.delete("/comment/:id", auth, commentController.deleteComment);

export default router;
