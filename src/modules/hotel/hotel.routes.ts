import express from "express";
import { upload } from "../../middlewares/multer.middleware";
import { requireAuth } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/role.middleware";
import {
  createHotelController,
  deleteHotelController,
  getAllHotelsController,
} from "./hotel.controller";

export const hotelRouters = express.Router();

hotelRouters.post(
  "/",
  requireAuth,
  authorize("owner"),
  upload.array("images", 20),
  createHotelController,
);

hotelRouters.get("/", requireAuth, getAllHotelsController);
hotelRouters.delete("/:id", requireAuth, deleteHotelController);
