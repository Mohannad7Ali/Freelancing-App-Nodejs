import express from "express";
import { deleteUser, getUser , updateUser , searchUsers  } from "../controllers/user.controller.js";
import { verifyToken } from "../middleware/jwt.js";

const router = express.Router();

router.delete("/deleteUser", verifyToken, deleteUser);
router.get("/search", verifyToken,searchUsers);
router.put("/:id", verifyToken, updateUser);
router.get("/:id", verifyToken , getUser ) ;


export default router 