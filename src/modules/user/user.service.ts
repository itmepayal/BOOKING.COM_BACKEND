import { IUser } from "../../models/user";
import { ApiError } from "../../helper/errors";
import { StatusCodes } from "http-status-codes";

export const getCurrentUser = (user: IUser | undefined) => {
  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");
  }

  return user;
};
