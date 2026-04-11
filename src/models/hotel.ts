import { model, Schema, Types, Document } from "mongoose";
import { IUser } from "./user";

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
  type: "hotel" | "resort" | "apartment" | "hostel";

  adultsCount: number;
  childrenCount?: number;

  facilities?: string[];
  amenities?: string[];
  tags?: string[];

  images?: IImage[];
  thumbnail?: IImage;

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
      },
    },

    description: {
      type: String,
      trim: true,
    },

    type: {
      type: String,
      enum: ["hotel", "resort", "apartment", "hostel"],
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

    facilities: [
      {
        type: String,
      },
    ],

    amenities: [
      {
        type: String,
      },
    ],

    tags: [
      {
        type: String,
        enum: ["budget", "luxury", "family", "couple", "business"],
      },
    ],

    images: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
      },
    ],

    thumbnail: {
      url: String,
      public_id: String,
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
  if (this.isModified("name")) {
    this.slug = this.name
      .toLowerCase()
      .replace(/ /g, "-")
      .replace(/[^\w-]+/g, "");
  }
});

// ================= MODEL =================
export const Hotel = model<IHotel>("Hotel", hotelSchema);
