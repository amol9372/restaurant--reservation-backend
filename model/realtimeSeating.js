import mongoose from "mongoose";

const { Schema } = mongoose;

const seatingGroupSchema = new Schema(
  {
    slot: String,
    status: {
      type: String,
      enum: ["waitlist", "available", "full"],
      default: "available",
    },
    total: Number,
    available: Number,
    seated: Number,
    reserved: Number,
  },
  { _id: false }
);

/**
 * Main Schema
 */
const RealtimeSeatingSchema = new Schema({
  seating: [seatingGroupSchema],
  groupId: {
    type: String,
    enum: ["group-4", "group-2", "group-6", "group-8"],
  },
  restaurant_id: { type: Schema.Types.ObjectId, ref: "Restaurant" },
});

export default mongoose.model("seating", RealtimeSeatingSchema, "seating");
