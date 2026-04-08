import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { asyncHandler } from "../../helper/handler";
import { ApiResponse } from "../../helper/response";
import { ApiError } from "../../helper/errors";
import { createHotelService } from "./hotel.service";

export const createHotelController = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user?._id) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized access");
    }

    const {
      name,
      city,
      country,
      type,
      childrenCount,
      adultsCount,
      amenities,
      facilities,
      starRating,
      pricePerNight,
    } = req.body;

    const userId = req.user._id;

    const files = Array.isArray(req.files)
      ? (req.files as Express.Multer.File[])
      : [];

    const hotelData = {
      userId,
      name: name,
      city: city,
      country: country,
      type: type,
      adultsCount: Number(adultsCount),
      childrenCount: childrenCount ? Number(childrenCount) : undefined,
      amenities:
        typeof amenities === "string" ? amenities.split(",") : amenities,
      facilities:
        typeof facilities === "string" ? facilities.split(",") : facilities,
      starRating: starRating ? Number(starRating) : undefined,
      pricePerNight: pricePerNight ? Number(pricePerNight) : undefined,
      files,
    };

    const hotel = await createHotelService(hotelData);

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
