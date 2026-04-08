import { Response } from "express";

const baseOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
};

export const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string,
) => {
  res.cookie("accessToken", accessToken, {
    ...baseOptions,
    maxAge: 30 * 60 * 1000, // 30 minutes
  });

  res.cookie("refreshToken", refreshToken, {
    ...baseOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const setAccessToken = (res: Response, accessToken: string) => {
  res.cookie("accessToken", accessToken, {
    ...baseOptions,
    maxAge: 30 * 60 * 1000,
  });
};

export const setRefreshToken = (res: Response, refreshToken: string) => {
  res.cookie("refreshToken", refreshToken, {
    ...baseOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const clearAuthCookies = (res: Response) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
};
