import express from "express";
import { verifyToken } from "../middleware/jwt.js";
import { getOrders, intent, confirm } from "../controllers/order.controller.js";

const router = express.Router();

// router.post("/:gigId", verifyToken, createOrder);
router.get("/", verifyToken, getOrders); // الحصول على جميع الطلبات
router.post("/create-payment-intent/:gigId", verifyToken, intent); // إنشاء نية دفع
router.put("/confirm-payment", verifyToken, confirm); // تأكيد عملية الدفع
export default router;
