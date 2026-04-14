import express from "express";
import { upload } from "../../middlewares/multer.middleware";
import { requireAuth } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/role.middleware";
import {
  createHotelController,
  deleteHotelController,
  getAllHotelsController,
  getHotelByIdController,
  updateHotelController,
  getAllHotelsAdminController,
} from "./hotel.controller";

export const hotelRouters = express.Router();

/* ================= ADMIN ROUTES ================= */
hotelRouters.get(
  "/admin",
  requireAuth,
  authorize("owner"),
  getAllHotelsAdminController,
);

/* ================= OWNER ROUTES ================= */
hotelRouters.post(
  "/",
  requireAuth,
  authorize("owner"),
  upload.array("images", 20),
  createHotelController,
);

hotelRouters.patch(
  "/:id",
  requireAuth,
  authorize("owner"),
  upload.array("images", 20),
  updateHotelController,
);

hotelRouters.delete(
  "/:id",
  requireAuth,
  authorize("owner"),
  deleteHotelController,
);

/* ================= PUBLIC / USER ROUTES ================= */
hotelRouters.get("/", requireAuth, getAllHotelsController);
hotelRouters.get("/:id", requireAuth, getHotelByIdController);
