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

import {
  HOTEL_TYPES,
  FACILITIES,
  AMENITIES,
  TAGS,
} from "../../constants/hotel";

// ================= HELPERS =================
const normalizeArray = (val: any) =>
  Array.isArray(val) ? val : val ? [val] : [];

const validateEnumArray = (arr: string[], validList: readonly string[]) =>
  arr.every((item) => validList.includes(item));

// ================= CREATE HOTEL =================
export const createHotelService = async (data: CreateHotelServiceInput) => {
  const session = await mongoose.startSession();
  let uploadedImages: { secure_url: string; public_id: string }[] = [];

  try {
    session.startTransaction();

    if (!HOTEL_TYPES.includes(data.type)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid hotel type");
    }

    const facilities = normalizeArray(data.facilities);
    const amenities = normalizeArray(data.amenities);
    const tags = normalizeArray(data.tags);

    if (!validateEnumArray(facilities, FACILITIES)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid facilities");
    }

    if (!validateEnumArray(amenities, AMENITIES)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid amenities");
    }

    if (!validateEnumArray(tags, TAGS)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid tags");
    }

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

      amenities,
      facilities,
      tags,

      pricePerNight: data.pricePerNight ?? 0,
      discount: data.discount ?? 0,

      starRating: data.starRating ?? 0,

      images: uploadedImages.map((img) => ({
        url: img.secure_url,
        public_id: img.public_id,
      })),

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

// ================= GET HOTEL BY ID =================
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

// ================= GET ALL HOTELS =================
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
    facilities,
    amenities,
    tags,
    search,
    sort = "-createdAt",
    lat,
    lng,
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
  if (type && HOTEL_TYPES.includes(type)) filter.type = type;

  if (starRating) {
    filter.starRating = { $gte: Number(starRating) };
  }

  if (minPrice || maxPrice) {
    filter.pricePerNight = {};
    if (minPrice) filter.pricePerNight.$gte = Number(minPrice);
    if (maxPrice) filter.pricePerNight.$lte = Number(maxPrice);
  }

  if (facilities) {
    filter.facilities = { $all: facilities.split(",") };
  }

  if (amenities) {
    filter.amenities = { $all: amenities.split(",") };
  }

  if (tags) {
    filter.tags = { $in: tags.split(",") };
  }

  if (lat && lng) {
    filter.location = {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [Number(lng), Number(lat)],
        },
        $maxDistance: 5000,
      },
    };
  }

  const allowedSort = ["pricePerNight", "starRating", "createdAt"];
  if (!allowedSort.includes(sort.replace("-", ""))) {
    sort = "-createdAt";
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

// ================= GET ALL ADMIN HOTELS =================
export const getAllHotelsAdminService = async (query: any) => {
  let {
    page = 1,
    limit = 10,
    city,
    country,
    type,
    minPrice,
    maxPrice,
    starRating,
    facilities,
    amenities,
    tags,
    search,
    sort = "-createdAt",
    lat,
    lng,
  } = query;

  page = Number(page) || 1;
  limit = Number(limit) || 10;

  const filter: any = {
    isDeleted: false,
  };

  if (search) {
    filter.$text = { $search: search };
  }

  if (city) filter.city = { $regex: city, $options: "i" };
  if (country) filter.country = { $regex: country, $options: "i" };
  if (type && HOTEL_TYPES.includes(type)) filter.type = type;

  if (starRating) {
    filter.starRating = { $gte: Number(starRating) };
  }

  if (minPrice || maxPrice) {
    filter.pricePerNight = {};
    if (minPrice) filter.pricePerNight.$gte = Number(minPrice);
    if (maxPrice) filter.pricePerNight.$lte = Number(maxPrice);
  }

  if (facilities) {
    filter.facilities = { $all: facilities.split(",") };
  }

  if (amenities) {
    filter.amenities = { $all: amenities.split(",") };
  }

  if (tags) {
    filter.tags = { $in: tags.split(",") };
  }

  if (lat && lng) {
    filter.location = {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [Number(lng), Number(lat)],
        },
        $maxDistance: 5000,
      },
    };
  }

  const allowedSort = ["pricePerNight", "starRating", "createdAt"];
  if (!allowedSort.includes(sort.replace("-", ""))) {
    sort = "-createdAt";
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

// ================= UPDATE HOTEL =================
export const updateHotelService = async (data: UpdateHotelServiceInput) => {
  const { hotelId, files, removeImageIds, ...updateData } = data;

  if (!Types.ObjectId.isValid(hotelId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid hotel ID");
  }

  type UpdateHotelFields = Omit<
    UpdateHotelServiceInput,
    "hotelId" | "files" | "removeImageIds"
  >;

  const updateFields = updateData as UpdateHotelFields;

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

    if (updateFields.type && !HOTEL_TYPES.includes(updateFields.type)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid hotel type");
    }

    if (updateFields.facilities !== undefined) {
      const facilities = normalizeArray(updateFields.facilities);

      if (!validateEnumArray(facilities, FACILITIES)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid facilities");
      }

      hotel.facilities = facilities;
    }

    if (updateFields.amenities !== undefined) {
      const amenities = normalizeArray(updateFields.amenities);

      if (!validateEnumArray(amenities, AMENITIES)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid amenities");
      }

      hotel.amenities = amenities;
    }

    if (updateFields.tags !== undefined) {
      const tags = normalizeArray(updateFields.tags);

      if (!validateEnumArray(tags, TAGS)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid tags");
      }

      hotel.tags = tags;
    }

    const allowedFields: (keyof UpdateHotelFields)[] = [
      "name",
      "city",
      "country",
      "description",
      "type",
      "adultsCount",
      "childrenCount",
      "pricePerNight",
      "discount",
      "starRating",
      "isAvailable",
      "location",
    ];

    allowedFields.forEach((field) => {
      const value = updateFields[field];

      if (value !== undefined) {
        (hotel as any)[field] = value;
      }
    });

    hotel.thumbnail = hotel.images?.[0] || null;

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

// ================= DELETE HOTEL =================
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

// ================= DELETE ALL HOTEL =================
export const deleteMultipleHotelsService = async (hotelIds: string[]) => {
  if (!hotelIds || hotelIds.length === 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "No hotel IDs provided");
  }

  const invalidIds = hotelIds.filter((id) => !Types.ObjectId.isValid(id));

  if (invalidIds.length > 0) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `Invalid hotel IDs: ${invalidIds.join(", ")}`,
    );
  }

  const result = await Hotel.updateMany(
    { _id: { $in: hotelIds } },
    { $set: { isDeleted: true } },
  );

  if (result.matchedCount === 0) {
    throw new ApiError(StatusCodes.NOT_FOUND, "No hotels found");
  }

  return {
    matched: result.matchedCount,
    modified: result.modifiedCount,
  };
};
