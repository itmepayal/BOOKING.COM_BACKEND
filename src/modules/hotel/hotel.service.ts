import mongoose, { Types } from "mongoose";
import { StatusCodes } from "http-status-codes";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../../config/cloudinary";
import { Hotel } from "../../models/hotel";
import { ApiError } from "../../helper/errors";
import {
  CreateHotelServiceInput,
  UpdateHotelServiceInput,
} from "../../validations/hotel";

// ================= CREATE HOTEL =================
export const createHotelService = async (data: CreateHotelServiceInput) => {
  const session = await mongoose.startSession();
  let uploadedImages: { secure_url: string; public_id: string }[] = [];

  try {
    session.startTransaction();

    if (data.files?.length) {
      uploadedImages = await Promise.all(
        data.files.map((file) => uploadToCloudinary(file)),
      );
    }

    const hotelPayload = {
      userId: new Types.ObjectId(data.userId),

      name: data.name.trim(),
      city: data.city.trim(),
      country: data.country.trim(),

      location: data.location,

      description: data.description,

      type: data.type,

      adultsCount: data.adultsCount,
      childrenCount: data.childrenCount ?? 0,

      amenities: data.amenities ?? [],
      facilities: data.facilities ?? [],
      tags: data.tags ?? [],

      pricePerNight: data.pricePerNight ?? 0,
      discount: data.discount ?? 0,

      starRating: data.starRating ?? 0,

      images: uploadedImages.map((img) => ({
        url: img.secure_url,
        public_id: img.public_id,
      })),

      thumbnail: uploadedImages[0]
        ? {
            url: uploadedImages[0].secure_url,
            public_id: uploadedImages[0].public_id,
          }
        : undefined,

      isAvailable: data.isAvailable ?? true,
    };

    const hotel = await new Hotel(hotelPayload).save({ session });

    await session.commitTransaction();
    return hotel;
  } catch (error: any) {
    await session.abortTransaction();

    if (uploadedImages.length > 0) {
      await Promise.allSettled(
        uploadedImages.map((img) => deleteFromCloudinary(img.public_id)),
      );
    }

    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      error?.message || "Failed to create hotel",
    );
  } finally {
    session.endSession();
  }
};

// ================= GET HOTEL BY ID SERVICES =================
export const getHotelByIdService = async (hotelId: string) => {
  if (!Types.ObjectId.isValid(hotelId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid hotel ID");
  }

  const hotel = await Hotel.findOne({
    _id: hotelId,
    isDeleted: false,
  }).populate("userId", "name email");

  if (!hotel) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Hotel not found");
  }

  return hotel;
};

// ================= GET ALL HOTELS SERVICES =================
export const getAllHotelsService = async (query: any) => {
  let {
    page = 1,
    limit = 10,
    city,
    country,
    type,
    minPrice,
    maxPrice,
    starRating,
    search,
    sort = "-createdAt",
  } = query;

  page = Number(page) || 1;
  limit = Number(limit) || 10;

  const filter: any = {
    isDeleted: false,
    isAvailable: true,
  };

  if (search) {
    filter.$text = { $search: search };
  }

  if (city) filter.city = { $regex: city, $options: "i" };
  if (country) filter.country = { $regex: country, $options: "i" };
  if (type) filter.type = type;

  if (starRating) {
    filter.starRating = { $gte: Number(starRating) };
  }

  if (minPrice || maxPrice) {
    filter.pricePerNight = {};
    if (minPrice) filter.pricePerNight.$gte = Number(minPrice);
    if (maxPrice) filter.pricePerNight.$lte = Number(maxPrice);
  }

  const skip = (page - 1) * limit;

  const [hotels, total] = await Promise.all([
    Hotel.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("userId", "name email")
      .lean(),

    Hotel.countDocuments(filter),
  ]);

  return {
    hotels,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};

// ================= DELETE HOTEL SERVICES =================
export const deleteHotelService = async (hotelId: string) => {
  if (!Types.ObjectId.isValid(hotelId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid hotel ID");
  }

  const hotel = await Hotel.findByIdAndUpdate(
    hotelId,
    { isDeleted: true },
    { new: true },
  );

  if (!hotel) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Hotel not found");
  }

  return hotel;
};

// ================= UPDATE HOTEL SERVICES =================
export const updateHotelService = async (data: UpdateHotelServiceInput) => {
  const { hotelId, files, removeImageIds, ...updateData } = data;

  if (!Types.ObjectId.isValid(hotelId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid hotel ID");
  }

  const session = await mongoose.startSession();
  let uploadedImages: any[] = [];

  try {
    session.startTransaction();

    const hotel = await Hotel.findById(hotelId).session(session);

    if (!hotel || hotel.isDeleted) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Hotel not found");
    }

    if (removeImageIds?.length) {
      hotel.images = hotel.images?.filter(
        (img) => !removeImageIds.includes(img.public_id),
      );

      await Promise.allSettled(
        removeImageIds.map((id) => deleteFromCloudinary(id)),
      );
    }

    if (files?.length) {
      uploadedImages = await Promise.all(
        files.map((file) => uploadToCloudinary(file)),
      );

      const newImages = uploadedImages.map((img) => ({
        url: img.secure_url,
        public_id: img.public_id,
      }));

      hotel.images = [...(hotel.images || []), ...newImages];
    }

    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined) {
        (hotel as any)[key] = value;
      }
    });

    if (hotel.images?.length) {
      hotel.thumbnail = hotel.images[0];
    }

    await hotel.save({ session });

    await session.commitTransaction();

    return hotel;
  } catch (error: any) {
    await session.abortTransaction();

    if (uploadedImages.length > 0) {
      await Promise.allSettled(
        uploadedImages.map((img) => deleteFromCloudinary(img.public_id)),
      );
    }

    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      error?.message || "Failed to update hotel",
    );
  } finally {
    session.endSession();
  }
};
