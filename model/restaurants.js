import { Schema, model } from "mongoose";

const openingHoursSchema = new Schema(
  {
    monday: String,
    tuesday: String,
    wednesday: String,
    thursday: String,
    friday: String,
    saturday: String,
    sunday: String,
  },
  { _id: false }
);

const preferencesSchema = new Schema(
  {
    max_time_in_advance: Number,
    min_time_in_advance: Number,
    hold_table_for: Number,
    turn_over_rate: Number,
    slots: {
      gap: Number,
    },
  },
  { _id: false }
);

const seatingGroupSchema = new Schema(
  {
    status: {
      type: String,
      enum: ["waitlist", "available", "full"],
      default: "available",
    },
    total: Number,
    available: Number,
    reserved: Number,
  },
  { _id: false }
); // _id is set to false to prevent creation of an unnecessary _id field

// Main schema for Realtime Seating
const realtimeSeatingSchema = new Schema(
  {
    "group-4": seatingGroupSchema,
    "group-6": seatingGroupSchema,
    "group-8": seatingGroupSchema,
    "group-2": seatingGroupSchema,
  },
  { _id: false }
);

const reservationSchema = new Schema(
  {
    current_waitlist: {
      type: Schema.Types.ObjectId,
      ref: "Waitlist", // Referencing Waitlist collection if it exists
    },
  },
  { _id: false }
);

const RestaurantSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    type: {
      type: Array,
      items: { type: String },
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    address: {
      type: String,
      required: true,
    },
    opening_hrs: openingHoursSchema,
    reservation: reservationSchema,
    realtime_seating: realtimeSeatingSchema,
    preferences: preferencesSchema,
  },
  { timestamps: true }
);

export default model("Restaurant", RestaurantSchema);
