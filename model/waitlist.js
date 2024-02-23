import mongoose from "mongoose";

const { Schema } = mongoose;

const customerNotifiedSchema = new Schema(
  {
    notified_at: Date,
    method: String, // e.g., 'email', 'sms'
    message: String,
  },
  { _id: false }
); // _id is set to false because we don't need a separate id for this subdocument

const userDetailsSchema = new Schema({
  name: String,
  email: String,
  contact_no: String,
});

const membersSchema = new Schema({
  status: {
    type: String,
    enum: ["waiting", "notified", "seated", "cancelled"],
    default: "waiting",
  },
  customer_notified: customerNotifiedSchema,
  userDetails: userDetailsSchema,
  last_updated: {
    type: Date,
    default: Date.now(),
  },
  priority: {
    type: Boolean,
    default: false,
  },
  rank: Number,
  no_of_ppl: Number,
  slot: {
    time: String,
    datetime: Date,
  },
});
const waitlistSchema = new Schema(
  {
    restaurant_id: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    members: [membersSchema],
    current_rank: Number,
    date: Date,
    status: {
      type: String,
      enum: ["active", "expired", "archived", "not_started"],
      default: "active",
    },
  },
  { timestamps: true },
  { Collection: "waitlist" }
);

export default mongoose.model("Waitlist", waitlistSchema, "waitlist");
