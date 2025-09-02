import express from "express";
import {
  createGig,
  deleteGig,
  getGig,
  getGigs
} from "../controllers/gig.controller.js";
import { verifyToken } from "../middleware/jwt.js";

const router = express.Router();

router.post("/create", verifyToken, createGig);
router.delete("/:id", verifyToken, deleteGig);
router.get("/singleGig/:id", getGig);
router.get("/allGigs", getGigs);

export default router;
