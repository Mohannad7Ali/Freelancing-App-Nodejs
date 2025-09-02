import express from "express";
import { verifyToken } from "../middleware/jwt.js";
import {
  createRequest,
  getRequests,
  deleteRequest,
  
} from "../controllers/request.controller.js";

const router = express.Router();

router.post("/", verifyToken, createRequest )
router.get("/:projectId", getRequests )
router.delete("/:id", deleteRequest)

export default router;
