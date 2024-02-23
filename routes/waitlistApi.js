import express from "express";
import WaitlistSchema from "../model/waitlist.js";

const router = express.Router();

router.get("/:restaurantId", async (req, res) => {
  try {
    const restaurantId = req.params.restaurantId;
    const waitlist = await WaitlistSchema.find({
      restaurant_id: restaurantId,
      status: "active",
    });
    res.status(200).send(waitlist);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Error fetching waitlist", error });
  }
});

router.post("/", async (req, res) => {
  try {
    const sampleReservation = new ReservationSchema(req.body);
    const saved = await sampleReservation.save();

    res.send({ id: saved._id }).status(201);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Error saving reservation", error });
  }
});

// Add other restaurant-related API routes here
// Ex: GET /restaurants/:id, POST /restaurants, etc.

export default router;
