import express from "express";
import RestaurantSchema from "../model/restaurants.js";
import RealtimeSeatingSchema from "../model/realtimeSeating.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const allRestaurants = await RestaurantSchema.find({});
    res.status(200).send(allRestaurants);
  } catch (error) {
    res.status(500).send({ message: "Error fetching restaurants", error });
  }
});

router.post("/", async (req, res) => {
  try {
    const restaurant = new RestaurantSchema(req.body);
    const saved = await restaurant.save();
    res.send({ id: saved._id }).status(201);
  } catch (error) {
    res.status(500).send({ message: "Error fetching restaurants", error });
  }
});

router.post("/seating", async (req, res) => {
  try {
    const seating = new RealtimeSeatingSchema(req.body);
    const saved = await seating.save();
    res.send({ id: saved._id }).status(201);
  } catch (error) {
    res.status(500).send({ message: "Error updating realtime seating", error });
  }
});

router.get("/seating/:restaurant_id", async (req, res) => {
  try {
    const seating = await RealtimeSeatingSchema.find({
      restaurant_id: req.params.restaurant_id,
    });

    res.send(seating).status(200);
  } catch (error) {
    res.status(500).send({ message: "Error updating realtime seating", error });
  }
});

export default router;
