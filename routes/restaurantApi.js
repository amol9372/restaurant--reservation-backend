import express from "express";
import RestaurantSchema from "../model/restaurants.js";

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

export default router;
