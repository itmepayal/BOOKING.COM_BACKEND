import { Router } from "express";
import { getMe } from "./user.controller";
import { requireAuth } from "../../middlewares/auth.middleware";

export const usersRoutes = Router();

usersRoutes.get("/me/", requireAuth, getMe);
