import mongoose from "mongoose";

const { Schema } = mongoose;

const userDetailsSchema = new Schema({
  name: String,
  email: String,
  contact_no: String,
});

/**
 * Main Schema
 */
const reservationSchema = new Schema(
  {
    slot: {
      time: String,
      date: Date,
    },
    no_of_ppl: Number,
    restaurant_id: { type: Schema.Types.ObjectId, ref: "Restaurant" },
    user_details: userDetailsSchema,
    status: {
      type: String,
      enum: ["waitlist", "confirmed", "pending", "cancelled"],
      default: "pending",
    },
    waitlist: {
      type: Schema.Types.ObjectId,
      ref: "Waitlist",
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Reservation", reservationSchema);
