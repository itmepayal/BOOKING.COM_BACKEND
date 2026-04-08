import { Request, Response } from "express";
import { asyncHandler } from "../../helper/handler";
import { ApiResponse } from "../../helper/response";
import { StatusCodes } from "http-status-codes";
import { getCurrentUser } from "../user/user.service";

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = getCurrentUser((req as any).user);

  return res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, user, "Current user fetched"));
});
