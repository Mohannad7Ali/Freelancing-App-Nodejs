import express from "express";
import { register, login, logout, mobileLogin, mobileLogout , mobileRegister} from "../controllers/auth.controller.js";
import { verifyToken } from "../middleware/jwt.js";

const router = express.Router();

router.post("/register", register)
router.post("/login", login)
router.post("/mobile/login", mobileLogin)
router.post("/mobile/register", mobileRegister)
router.post("/logout",verifyToken , logout )
router.post("/mobile/logout",verifyToken , mobileLogout )

export default router;
