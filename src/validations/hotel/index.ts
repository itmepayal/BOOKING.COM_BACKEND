import { z } from "zod";
import {
  AMENITIES,
  FACILITIES,
  HOTEL_TYPES,
  TAGS,
} from "../../constants/hotel";

// ================= HELPERS =================

const stringToArray = (val?: string | string[]) => {
  if (!val) return [];
  if (typeof val === "string") {
    return val.split(",").map((i) => i.trim());
  }
  return val;
};

// ================= ENUMS =================

const hotelTypeEnum = z
  .enum(HOTEL_TYPES)
  .refine((val) => HOTEL_TYPES.includes(val), {
    message: "Invalid hotel type selected",
  });

const tagsEnum = z.enum(TAGS).refine((val) => TAGS.includes(val), {
  message: "Invalid tag value",
});

const amenitiesEnum = z
  .enum(AMENITIES)
  .refine((val) => AMENITIES.includes(val), {
    message: "Invalid amenity selected",
  });

const facilitiesEnum = z
  .enum(FACILITIES)
  .refine((val) => FACILITIES.includes(val), {
    message: "Invalid facility selected",
  });

// ================= SCHEMA =================

export const createHotelSchema = z
  .object({
    userId: z.string().min(1, "User ID is required"),

    name: z
      .string()
      .min(2, "Hotel name must be at least 2 characters")
      .max(100, "Hotel name cannot exceed 100 characters"),

    city: z
      .string()
      .min(2, "City must be at least 2 characters")
      .max(50, "City cannot exceed 50 characters"),

    country: z
      .string()
      .min(2, "Country must be at least 2 characters")
      .max(50, "Country cannot exceed 50 characters"),

    location: z.object({
      type: z.literal("Point").default("Point"),
      coordinates: z
        .array(z.number())
        .length(2, "Coordinates must contain exactly [longitude, latitude]")
        .refine(
          (coords) => coords.every((c) => typeof c === "number" && !isNaN(c)),
          {
            message: "Coordinates must be valid numbers",
          },
        ),
    }),

    description: z
      .string()
      .max(1000, "Description cannot exceed 1000 characters")
      .optional(),

    type: hotelTypeEnum,

    amenities: z
      .union([z.string(), z.array(amenitiesEnum)])
      .optional()
      .transform(stringToArray),

    facilities: z
      .union([z.string(), z.array(facilitiesEnum)])
      .optional()
      .transform(stringToArray),

    tags: z
      .union([z.string(), z.array(tagsEnum)])
      .optional()
      .transform((val) => stringToArray(val) as any),

    pricePerNight: z.coerce
      .number()
      .min(0, "Price per night cannot be negative")
      .optional(),

    discount: z.coerce
      .number()
      .min(0, "Discount cannot be less than 0%")
      .max(100, "Discount cannot exceed 100%")
      .optional()
      .default(0),

    starRating: z.coerce
      .number()
      .min(0, "Star rating cannot be less than 0")
      .max(5, "Star rating cannot exceed 5")
      .optional()
      .default(0),

    images: z
      .array(
        z.object({
          url: z.string().url("Invalid image URL"),
          public_id: z.string().min(1, "Image public_id is required"),
        }),
      )
      .optional(),

    thumbnail: z
      .object({
        url: z.string().url("Invalid thumbnail URL"),
        public_id: z.string().min(1, "Thumbnail public_id is required"),
      })
      .optional(),

    isAvailable: z.boolean().optional().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.discount && !data.pricePerNight) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Price per night is required when discount is applied",
        path: ["discount"],
      });
    }

    const [lng, lat] = data.location.coordinates;

    if (lng < -180 || lng > 180) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Longitude must be between -180 and 180",
        path: ["location", "coordinates", 0],
      });
    }

    if (lat < -90 || lat > 90) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Latitude must be between -90 and 90",
        path: ["location", "coordinates", 1],
      });
    }
  });

// ================= UPDATE =================

export const updateHotelSchema = z
  .object({
    name: z
      .string()
      .min(2, "Hotel name must be at least 2 characters")
      .max(100, "Hotel name cannot exceed 100 characters")
      .optional(),

    city: z
      .string()
      .min(2, "City must be at least 2 characters")
      .max(50, "City cannot exceed 50 characters")
      .optional(),

    country: z
      .string()
      .min(2, "Country must be at least 2 characters")
      .max(50, "Country cannot exceed 50 characters")
      .optional(),

    location: z.preprocess(
      (val) => {
        if (typeof val === "string") {
          try {
            return JSON.parse(val);
          } catch {
            return val;
          }
        }
        return val;
      },
      z.object({
        type: z.literal("Point").default("Point"),
        coordinates: z
          .array(z.number())
          .length(2, "Coordinates must contain exactly [longitude, latitude]"),
      }),
    ),

    description: z
      .string()
      .max(1000, "Description cannot exceed 1000 characters")
      .optional(),

    type: hotelTypeEnum.optional(),

    amenities: z
      .union([z.string(), z.array(z.string())])
      .optional()
      .transform(stringToArray),

    facilities: z
      .union([z.string(), z.array(z.string())])
      .optional()
      .transform(stringToArray),

    tags: z
      .union([z.string(), z.array(tagsEnum)])
      .optional()
      .transform((val) => stringToArray(val) as any),

    pricePerNight: z.coerce
      .number()
      .min(0, "Price per night cannot be negative")
      .optional(),

    discount: z.coerce
      .number()
      .min(0, "Discount cannot be less than 0%")
      .max(100, "Discount cannot exceed 100%")
      .optional(),

    starRating: z.coerce
      .number()
      .min(0, "Star rating cannot be less than 0")
      .max(5, "Star rating cannot exceed 5")
      .optional(),

    isAvailable: z.preprocess((val) => {
      if (typeof val === "string") return val === "true";
      return val;
    }, z.boolean().optional().default(true)),

    removeImageIds: z.preprocess((val) => {
      if (!val) return [];
      if (typeof val === "string") {
        try {
          const parsed = JSON.parse(val);
          return Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          return val.split(",").map((v) => v.trim());
        }
      }
      return val;
    }, z.array(z.string()).default([])),
  })
  .superRefine((data, ctx) => {
    if (data.discount && !data.pricePerNight) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Price per night is required when discount is applied",
        path: ["discount"],
      });
    }
  });

export type CreateHotelInput = z.infer<typeof createHotelSchema>;

export type CreateHotelServiceInput = CreateHotelInput & {
  files?: Express.Multer.File[];
};

export type UpdateHotelInput = z.infer<typeof updateHotelSchema>;

export type UpdateHotelServiceInput = UpdateHotelInput & {
  hotelId: string;
  files?: Express.Multer.File[];
};
