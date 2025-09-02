import express from "express";
import {
  createProject,
  deleteProject,
  getProject,
  getProjects,
  contractProject,
} from "../controllers/project.controller.js";
import { verifyToken } from "../middleware/jwt.js";

const router = express.Router();

router.post("/create", verifyToken, createProject);
router.delete("/:id", verifyToken, deleteProject);
router.get("/singleProject/:id", getProject);
router.get("/allProjects", getProjects);
router.put("/contract/:id", verifyToken, contractProject);

export default router;
