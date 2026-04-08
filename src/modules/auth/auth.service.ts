import jwt from "jsonwebtoken";
import User from "../../models/user";
import { ApiError } from "../../helper/errors";
import { StatusCodes } from "http-status-codes";
import TokenBlacklist from "../../models/token";

export const registerUser = async (data: any) => {
  const { firstname, lastname, email, password } = data;

  if (!firstname || !email || !password) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "All fields are required");
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new ApiError(StatusCodes.CONFLICT, "User already exists");
  }

  const user = await User.create({
    firstname,
    lastname,
    email,
    password,
  });

  return user.toJSON();
};

export const loginUser = async (data: any) => {
  const { email, password } = data;

  if (!email || !password) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Email and password are required",
    );
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid credentials");
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid credentials");
  }

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  return {
    user: user.toJSON(),
    accessToken,
    refreshToken,
  };
};

export const logoutUser = async (accessToken: string) => {
  if (!accessToken) return;

  const decoded: any = jwt.decode(accessToken);

  if (decoded?.exp) {
    await TokenBlacklist.create({
      token: accessToken,
      expiresAt: new Date(decoded.exp * 1000),
    });
  }
};

export const refreshAccessTokenUser = async (refreshToken: string) => {
  if (!refreshToken) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "No refresh token");
  }

  const payload: any = jwt.verify(
    refreshToken,
    process.env.JWT_REFRESH_SECRET!,
  );

  const user = await User.findById(payload.userId);
  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "User not found");
  }

  const newAccessToken = user.generateAccessToken();

  return newAccessToken;
};

export const changePasswordUser = async (
  userId: string,
  oldPassword: string,
  newPassword: string,
) => {
  const user = await User.findById(userId).select("+password");

  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "User not found");
  }

  const isMatch = await user.comparePassword(oldPassword);

  if (!isMatch) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Old password is incorrect");
  }

  user.password = newPassword;
  await user.save();

  return;
};
