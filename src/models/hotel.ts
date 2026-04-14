import { model, Schema, Types, Document } from "mongoose";
import { IUser } from "./user";
import { v4 as uuidv4 } from "uuid";
import { HOTEL_TYPES, FACILITIES, AMENITIES, TAGS } from "../constants/hotel";

// ================= TYPES =================
type HotelType = (typeof HOTEL_TYPES)[number];
type FacilityType = (typeof FACILITIES)[number];
type AmenityType = (typeof AMENITIES)[number];
type TagType = (typeof TAGS)[number];

// ================= SUB INTERFACES =================
interface IImage {
  url: string;
  public_id: string;
}

interface ILocation {
  type: "Point";
  coordinates: [number, number];
}

interface IRating {
  average: number;
  count: number;
}

interface IStats {
  totalBookings: number;
  totalViews: number;
  favoritesCount: number;
}

// ================= MAIN INTERFACE =================
export interface IHotel extends Document {
  userId: Types.ObjectId | IUser;
  name: string;
  slug: string;

  city: string;
  country: string;
  location: ILocation;

  description?: string;
  type: HotelType;

  adultsCount: number;
  childrenCount?: number;

  facilities?: FacilityType[];
  amenities?: AmenityType[];
  tags?: TagType[];

  images?: IImage[];
  thumbnail?: IImage | null;

  pricePerNight?: number;
  discount?: number;

  starRating?: number;
  rating: IRating;

  stats: IStats;

  isAvailable: boolean;
  isDeleted: boolean;

  createdAt?: Date;
  lastUpdated?: Date;
}

// ================= SCHEMA =================
const hotelSchema = new Schema<IHotel>(
  {
    userId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    country: {
      type: String,
      required: true,
      trim: true,
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: (val: number[]) => val.length === 2,
          message: "Coordinates must be [lng, lat]",
        },
      },
    },

    description: {
      type: String,
      trim: true,
    },

    type: {
      type: String,
      enum: HOTEL_TYPES,
      required: true,
    },

    adultsCount: {
      type: Number,
      required: true,
      min: 1,
    },

    childrenCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    facilities: {
      type: [String],
      enum: FACILITIES,
      default: [],
      set: (val: any) => (Array.isArray(val) ? val : [val]),
    },

    amenities: {
      type: [String],
      enum: AMENITIES,
      default: [],
      set: (val: any) => (Array.isArray(val) ? val : [val]),
    },

    tags: {
      type: [String],
      enum: TAGS,
      default: [],
    },

    images: {
      type: [
        {
          url: { type: String, required: true },
          public_id: { type: String, required: true },
        },
      ],
      default: [],
    },

    thumbnail: {
      type: {
        url: { type: String },
        public_id: { type: String },
      },
      default: null,
    },

    pricePerNight: {
      type: Number,
      min: 0,
    },

    discount: {
      type: Number,
      default: 0,
    },

    starRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },

    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
      },
    },

    stats: {
      totalBookings: { type: Number, default: 0 },
      totalViews: { type: Number, default: 0 },
      favoritesCount: { type: Number, default: 0 },
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: {
      createdAt: "createdAt",
      updatedAt: "lastUpdated",
    },
    versionKey: false,
  },
);

// ================= INDEXES =================
hotelSchema.index({ city: 1, type: 1, pricePerNight: 1 });
hotelSchema.index({ location: "2dsphere" });
hotelSchema.index({
  name: "text",
  description: "text",
  city: "text",
});

// ================= HOOKS =================
hotelSchema.pre("save", function (next) {
  if (this.isModified("name") && !this.slug) {
    const baseSlug = this.name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "");
    const uniqueId = uuidv4().split("-")[0];
    this.slug = `${baseSlug}-${uniqueId}`;
  }
  this.thumbnail = this.images?.[0] || null;
});

// ================= MODEL =================
export const Hotel = model<IHotel>("Hotel", hotelSchema);
