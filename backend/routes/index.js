import express from "express";
import authController from "../controller/authController.js";

const router = express.Router();
//authController endPoints
router.post("/register", authController.userRegister);
router.post("/login", authController.login);

export default router;
