import mongoose, { Types } from "mongoose";
import { StatusCodes } from "http-status-codes";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../../config/cloudinary";
import { Hotel } from "../../models/hotel";
import { ApiError } from "../../helper/errors";

interface CreateHotelInput {
  userId: Types.ObjectId;
  name: string;
  city: string;
  country: string;
  type: "hotel" | "resort" | "apartment" | "hostel";
  adultsCount: number;
  childrenCount?: number;
  amenities?: string[];
  facilities?: string[];
  starRating?: number;
  pricePerNight?: number;
  files?: Express.Multer.File[];
}

export const createHotelService = async (data: CreateHotelInput) => {
  let uploadedImages: { secure_url: string; public_id: string }[] = [];

  if (!data.userId) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "User ID is required");
  }

  if (!data.name?.trim()) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Hotel name is required");
  }

  if (!data.city?.trim() || !data.country?.trim()) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "City and country are required",
    );
  }

  if (!data.adultsCount || data.adultsCount <= 0) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Adults count must be greater than 0",
    );
  }

  if (data.pricePerNight !== undefined && data.pricePerNight < 0) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Price per night cannot be negative",
    );
  }

  if (
    data.starRating !== undefined &&
    (data.starRating < 1 || data.starRating > 5)
  ) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Star rating must be between 1 and 5",
    );
  }

  try {
    if (data.files?.length) {
      uploadedImages = await Promise.all(
        data.files.map((file) => uploadToCloudinary(file)),
      );
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const hotelPayload = {
        userId: data.userId,
        name: data.name.trim(),
        city: data.city.trim(),
        country: data.country.trim(),
        type: data.type,
        adultsCount: data.adultsCount,
        childrenCount: data.childrenCount ?? 0,
        amenities: data.amenities ?? [],
        facilities: data.facilities ?? [],
        starRating: data.starRating ?? 0,
        pricePerNight: data.pricePerNight ?? 0,
        images: uploadedImages.map((img) => img.secure_url),
        imagePublicIds: uploadedImages.map((img) => img.public_id),
      };

      const hotel = await new Hotel(hotelPayload).save({ session });

      await session.commitTransaction();
      return hotel;
    } catch (err: any) {
      await session.abortTransaction();

      throw new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        err?.message || "Failed to create hotel",
      );
    } finally {
      session.endSession();
    }
  } catch (error: any) {
    if (uploadedImages.length > 0) {
      await Promise.allSettled(
        uploadedImages.map((img) => deleteFromCloudinary(img.public_id)),
      );
    }

    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      error?.message || "Something went wrong while creating hotel",
    );
  }
};
