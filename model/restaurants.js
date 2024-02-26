import { Schema, model } from "mongoose";

const openCloseSchema = new Schema(
  {
    open: String,
    close: String,
  },
  { _id: false }
);

const slotSchema = new Schema(
  {
    morning: [String],
    lunch: [String],
    dinner: [String],
  },
  { _id: false }
);

const openingHoursSchema = new Schema(
  {
    monday: openCloseSchema,
    tuesday: openCloseSchema,
    wednesday: openCloseSchema,
    thursday: openCloseSchema,
    friday: openCloseSchema,
    saturday: openCloseSchema,
    sunday: openCloseSchema,
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
    // realtime_seating: realtimeSeatingSchema,
    preferences: preferencesSchema,
    slots: slotSchema,
  },
  { timestamps: true }
);

export default model("Restaurant", RestaurantSchema);
