import { Request, Response, NextFunction } from "express";
import { ApiError } from "../helper/errors";
import { StatusCodes, ReasonPhrases } from "http-status-codes";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;

  return res.status(statusCode).json({
    success: false,
    message: err.message || ReasonPhrases.INTERNAL_SERVER_ERROR,
  });
};
