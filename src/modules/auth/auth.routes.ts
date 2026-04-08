import { Router } from "express";
import {
  changePassword,
  login,
  logout,
  refreshToken,
  register,
} from "./auth.controller";

export const authRoutes = Router();

authRoutes.post("/register", register);
authRoutes.post("/login", login);
authRoutes.post("/logout", logout);
authRoutes.post("/refresh", refreshToken);
authRoutes.post("/change-password", changePassword);
