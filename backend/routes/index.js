import express from "express";
import authController from "../controller/authController.js";
import auth from "../middleWare/auth.js";
import blogController from "../controller/blogController.js";

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

export default router;
