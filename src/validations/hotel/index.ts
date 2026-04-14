import { z } from "zod";

// ================= HELPERS =================

const stringToArray = (val?: string | string[]) => {
  if (!val) return [];
  if (typeof val === "string") {
    return val.split(",").map((i) => i.trim());
  }
  return val;
};

// ================= ENUMS =================
const hotelTypeEnum = z.enum(["hotel", "resort", "apartment", "hostel"]);
const tagsEnum = z.enum(["budget", "luxury", "family", "couple", "business"]);

// ================= SCHEMA =================
export const createHotelSchema = z
  .object({
    userId: z.string().min(1, "UserId is required"),
    name: z.string().min(2, "Name must be at least 2 characters").max(100),
    city: z.string().min(2).max(50),
    country: z.string().min(2).max(50),

    location: z.object({
      type: z.literal("Point").default("Point"),
      coordinates: z
        .array(z.number())
        .length(2, "Coordinates must be [lng, lat]"),
    }),

    description: z.string().max(1000).optional(),
    type: hotelTypeEnum,
    adultsCount: z.coerce.number().int().min(1, "At least 1 adult required"),
    childrenCount: z.coerce.number().int().min(0).optional().default(0),

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

    pricePerNight: z.coerce.number().min(0).optional(),
    discount: z.coerce.number().min(0).max(100).optional().default(0),
    starRating: z.coerce.number().min(0).max(5).optional().default(0),
    images: z
      .array(
        z.object({
          url: z.string().url(),
          public_id: z.string(),
        }),
      )
      .optional(),
    thumbnail: z
      .object({
        url: z.string().url(),
        public_id: z.string(),
      })
      .optional(),
    isAvailable: z.boolean().optional().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.discount && !data.pricePerNight) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Discount requires pricePerNight",
        path: ["discount"],
      });
    }

    if (
      data.location.coordinates[0] < -180 ||
      data.location.coordinates[0] > 180 ||
      data.location.coordinates[1] < -90 ||
      data.location.coordinates[1] > 90
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid longitude/latitude values",
        path: ["location", "coordinates"],
      });
    }
  });

// ================= TYPES =================

export type CreateHotelInput = z.infer<typeof createHotelSchema>;

export type CreateHotelServiceInput = CreateHotelInput & {
  files?: Express.Multer.File[];
};

export const updateHotelSchema = z
  .object({
    name: z.string().min(2).max(100).optional(),
    city: z.string().min(2).max(50).optional(),
    country: z.string().min(2).max(50).optional(),

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
          .length(2, "Coordinates must be [lng, lat]"),
      }),
    ),

    description: z.string().max(1000).optional(),
    type: hotelTypeEnum.optional(),

    adultsCount: z.coerce.number().int().min(1).optional(),
    childrenCount: z.coerce.number().int().min(0).optional(),

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

    pricePerNight: z.coerce.number().min(0).optional(),
    discount: z.coerce.number().min(0).max(100).optional(),
    starRating: z.coerce.number().min(0).max(5).optional(),

    isAvailable: z.preprocess((val) => {
      if (typeof val === "string") {
        return val === "true";
      }
      return val;
    }, z.boolean().optional().default(true)),

    removeImageIds: z.array(z.string()).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.discount && !data.pricePerNight) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Discount requires pricePerNight",
        path: ["discount"],
      });
    }
  });

export type UpdateHotelInput = z.infer<typeof updateHotelSchema>;

export type UpdateHotelServiceInput = UpdateHotelInput & {
  hotelId: string;
  files?: Express.Multer.File[];
};
