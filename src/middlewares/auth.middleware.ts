import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/user";
import { ApiError } from "../helper/errors";
import { StatusCodes } from "http-status-codes";

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req.cookies?.accessToken;

  if (!token) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated");
  }

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "User not found");
    }

    (req as any).user = user;

    next();
  } catch (err) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid or expired token");
  }
};
