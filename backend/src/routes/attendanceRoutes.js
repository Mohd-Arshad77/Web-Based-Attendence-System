import express from "express";
import {
  checkIn,
  checkOut,
  getAttendanceHistory,
  getShopInfo,
} from "../controllers/attendanceController.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

router.get("/shop-info", getShopInfo);
router.get("/user/:userId", getAttendanceHistory);
router.post("/checkin", upload.single("image"), checkIn);
router.post("/checkout", upload.single("image"), checkOut);

export default router;
