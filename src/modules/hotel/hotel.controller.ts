import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { asyncHandler } from "../../helper/handler";
import { ApiResponse } from "../../helper/response";
import { ApiError } from "../../helper/errors";

import {
  createHotelService,
  getAllHotelsService,
  getAllHotelsAdminService,
  getHotelByIdService,
  updateHotelService,
  deleteHotelService,
  deleteMultipleHotelsService,
} from "./hotel.service";

import { createHotelSchema, updateHotelSchema } from "../../validations/hotel";

// ================= CREATE HOTEL =================
export const createHotelController = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user?._id) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized");
    }

    const files = Array.isArray(req.files)
      ? (req.files as Express.Multer.File[])
      : [];

    if (req.body.location) {
      try {
        req.body.location = JSON.parse(req.body.location);
      } catch {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid location format");
      }
    }

    if (req.body.isAvailable !== undefined) {
      req.body.isAvailable = req.body.isAvailable === "true";
    }

    const validatedData = createHotelSchema.parse({
      ...req.body,
      userId: req.user._id.toString(),
    });

    const hotel = await createHotelService({
      ...validatedData,
      files,
    });

    return res
      .status(StatusCodes.CREATED)
      .json(
        new ApiResponse(
          StatusCodes.CREATED,
          hotel,
          "Hotel created successfully",
        ),
      );
  },
);

// ================= GET HOTEL BY ID =================
export const getHotelByIdController = asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    const hotel = await getHotelByIdService(req.params.id);

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(StatusCodes.OK, hotel, "Hotel fetched successfully"),
      );
  },
);

// ================= GET ALL HOTELS =================
export const getAllHotelsController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await getAllHotelsService(req.query);

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(StatusCodes.OK, result, "Hotels fetched successfully"),
      );
  },
);

// ================= GET ALL HOTELS (ADMIN) =================
export const getAllHotelsAdminController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await getAllHotelsAdminService(req.query);

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(StatusCodes.OK, result, "Hotels fetched successfully"),
      );
  },
);

// ================= UPDATE HOTEL =================
export const updateHotelController = asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    if (!req.user?._id) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized");
    }

    const files = Array.isArray(req.files)
      ? (req.files as Express.Multer.File[])
      : [];

    const validatedData = updateHotelSchema.parse(req.body);

    const updatedHotel = await updateHotelService({
      hotelId: req.params.id,
      ...validatedData,
      files,
    });

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          updatedHotel,
          "Hotel updated successfully",
        ),
      );
  },
);

// ================= DELETE HOTEL =================
export const deleteHotelController = asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    const hotel = await deleteHotelService(req.params.id);

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(StatusCodes.OK, hotel, "Hotel deleted successfully"),
      );
  },
);

// ================= DELETE ALL HOTEL =================
export const deleteMultipleHotelsController = asyncHandler(
  async (req: Request, res: Response) => {
    const { hotelIds } = req.body;

    if (!Array.isArray(hotelIds) || hotelIds.length === 0) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "hotelIds must be a non-empty array",
      );
    }

    const result = await deleteMultipleHotelsService(hotelIds);

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          result,
          `${result.modified} hotels deleted successfully`,
        ),
      );
  },
);
