import express from "express";
import RestaurantSchema from "../model/restaurants.js";
import RealtimeSeatingSchema from "../model/realtimeSeating.js";
import ReservationSchema from "../model/reservation.js";
import { ReservationUtils } from "../utils.js";
import mongoose from "mongoose";

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

router.post("/seating/update", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // update reservation
    const reservation = await ReservationSchema.findById(
      req.body.reservation_id
    );
    reservation.status = req.body.event;
    reservation.status_tree.addToSet({
      status: req.body.event,
      date: new Date(),
    });

    await reservation.save({ session });

    // update realtime seating
    const seating = await RealtimeSeatingSchema.findOne({
      restaurant_id: reservation.restaurant_id,
      groupId: req.body.seating_type,
    });

    const restaurant = await RestaurantSchema.findById(
      reservation.restaurant_id
    );

    const allSlots = restaurant.slots["morning"]
      .concat(restaurant.slots["lunch"])
      .concat(restaurant.slots["dinner"]);

    const restaurantSlotTime = ReservationUtils.getTimeSlot(
      allSlots,
      req.body.time
    );

    seating.seating.forEach((item) => {
      if (item.slot === restaurantSlotTime) {
        if (req.body.event === "seated") {
          // item.available -= 1;
          item.reserved -= 1;
          item.seated += 1;
        } else if (req.body.event === "departed") {
          //item.available += 1;
          // slotSeating.reserved -= 1;
          item.seated -= 1;
        }
      }
    });

    await seating.save({ session });
    await session.commitTransaction();
    await session.endSession();
    res
      .status(202)
      .json({ message: "Seating & reservation updated successfully" });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).send({ message: "Error updating realtime seating", error });
  } finally {
    // End the session
    if (session) {
      session.endSession();
    }
  }
});

export default router;
