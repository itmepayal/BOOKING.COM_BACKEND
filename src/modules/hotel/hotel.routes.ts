import express from "express";
import { upload } from "../../middlewares/multer.middleware";
import { requireAuth } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/role.middleware";
import { createHotelController } from "./hotel.controller";

export const hotelRouters = express.Router();

hotelRouters.post(
  "/",
  requireAuth,
  authorize("owner"),
  upload.array("images", 20),
  createHotelController,
);
