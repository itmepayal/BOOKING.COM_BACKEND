import { model, Schema, Types, Document } from "mongoose";
import { IHotel } from "./hotel";

type RoomType = "standard" | "deluxe" | "suite" | "family" | "presidential";

interface IImage {
  url: string;
  public_id: string;
}

interface ICapacity {
  adults: number;
  children: number;
}

export interface IRoom extends Document {
  hotelId: Types.ObjectId | IHotel;

  name: string;
  slug: string;

  type: RoomType;

  capacity: ICapacity;

  pricePerNight: number;
  discount?: number;

  totalRooms: number;

  amenities: string[];

  images: IImage[];

  isAvailable: boolean;
}

const roomSchema = new Schema<IRoom>(
  {
    hotelId: { type: Types.ObjectId, ref: "Hotel", required: true },

    name: { type: String, required: true },

    slug: { type: String, unique: true },

    type: {
      type: String,
      enum: ["standard", "deluxe", "suite", "family", "presidential"],
      required: true,
    },

    capacity: {
      adults: { type: Number, required: true },
      children: { type: Number, default: 0 },
    },

    pricePerNight: { type: Number, required: true },

    discount: { type: Number, default: 0 },

    totalRooms: { type: Number, required: true },

    amenities: { type: [String], default: [] },

    images: { type: [{ url: String, public_id: String }], default: [] },

    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true },
);

roomSchema.pre("save", function (next) {
  if (!this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "");
  }
});

export const Room = model<IRoom>("Room", roomSchema);
