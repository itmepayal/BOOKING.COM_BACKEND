import { Request, Response } from "express";
import { asyncHandler } from "../../helper/handler";
import { ApiResponse } from "../../helper/response";
import { StatusCodes } from "http-status-codes";
import {
  registerUser,
  loginUser,
  logoutUser,
  changePasswordUser,
  refreshAccessTokenUser,
} from "../auth/auth.service";
import {
  setAuthCookies,
  clearAuthCookies,
  setAccessToken,
} from "../../helper/cookies";
import { registerSchema } from "../../validations/auth/register";
import { loginSchema } from "../../validations/auth/login";
import { changePasswordSchema } from "../../validations/auth/password";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const body = registerSchema.parse(req.body);
  const user = await registerUser(body);

  return res
    .status(StatusCodes.CREATED)
    .json(
      new ApiResponse(
        StatusCodes.CREATED,
        user,
        "User registered successfully",
      ),
    );
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const body = loginSchema.parse(req.body);
  const data = await loginUser(body);

  const { user, accessToken, refreshToken } = data;

  setAuthCookies(res, accessToken, refreshToken);

  return res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, { user }, "Login successful"));
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const accessToken = req.cookies?.accessToken;
  await logoutUser(accessToken);
  clearAuthCookies(res);
  return res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, null, "Logged out successfully"));
});

export const refreshToken = asyncHandler(
  async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json(
          new ApiResponse(StatusCodes.UNAUTHORIZED, null, "No refresh token"),
        );
    }

    const newAccessToken = await refreshAccessTokenUser(refreshToken);

    setAccessToken(res, newAccessToken);

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          { accessToken: newAccessToken },
          "Access token refreshed successfully",
        ),
      );
  },
);

export const changePassword = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user._id;

    const body = changePasswordSchema.parse(req.body);

    const { oldPassword, newPassword } = body;

    await changePasswordUser(userId, oldPassword, newPassword);

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(StatusCodes.OK, null, "Password changed successfully"),
      );
  },
);
