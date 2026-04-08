import { Request, Response, NextFunction } from "express";
import { ApiError } from "../helper/errors";
import { StatusCodes } from "http-status-codes";

export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(
        new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized access"),
      );
    }

    const { role } = req.user;

    if (role === "admin") {
      return next();
    }

    if (!allowedRoles.includes(role)) {
      return next(
        new ApiError(StatusCodes.FORBIDDEN, "Forbidden: Access denied"),
      );
    }

    next();
  };
};
