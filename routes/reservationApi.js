import express from "express";
import mongoose from "mongoose";
import ReservationSchema from "../model/reservation.js";
import RestaurantSchema from "../model/restaurants.js";
import WaitlistSchema from "../model/waitlist.js";
import { ReservationUtils } from "../utils.js";
import { addMinutes, format, subMinutes } from "date-fns";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    // const all = await ReservationSchema.find({ no_of_ppl: { $gte: 4 } });
    var reservations = [];
    if (req.query.date) {
      reservations = await getReservations(req.query.date);
    } else {
      reservations = await ReservationSchema.find({});
    }
    res.status(200).send(reservations);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Error fetching reservations", error });
  }
});

/**
 * Find all avaialble slots
 * input [date, time (optional), no_of_ppl]
 * @param restaurant_id
 * @param no_of_ppl
 * @param day
 */
router.get("/slots", async (req, res) => {
  // 4 ppl, 18:00, 2021-02-21

  try {
    const slots = [];
    const restaurant = await RestaurantSchema.findById(req.query.restaurant_id);
    const seatingGroupReservation = getSeatingGroupReservation(
      parseInt(req.query.no_of_ppl),
      restaurant
    );

    const preferences = restaurant.preferences; // turn_over_time, slots.gap, time_in_advance
    const reservations = await getReservations(req.query.date);

    // find eligible slots - slots which are in range of reservation time
    const requestedSlot = new Date(
      0,
      0,
      0,
      req.query.slot.split(":")[0],
      req.query.slot.split(":")[1]
    );

    const startSlot = format(subMinutes(requestedSlot, 60), "HH:mm");
    const endSlot = format(addMinutes(requestedSlot, 60), "HH:mm");

    var slotTime = startSlot;

    while (slotTime <= endSlot) {
      var reservation = reservations.find(
        (item) =>
          item.slot.time === slotTime &&
          item.no_of_ppl === parseInt(req.query.no_of_ppl)
      );

      if (!reservation) {
        slots.push(slotTime);
      }

      slotTime = ReservationUtils.addTime(slotTime, preferences.turn_over_rate);
    }

    res.status(200).send(slots);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Error fetching reservations", error });
  }
});

router.post("/", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const restaurant = await RestaurantSchema.findById(req.body.restaurant_id);

    const seatingGroupReservation = getSeatingGroupReservation(
      req.body.no_of_ppl,
      restaurant
    );

    // check user reservations for the same day
    const userReservations = await getUserReservations(req.body);

    if (userReservations.length > 0) {
      throw new Error("User already has a reserved slot today");
    }

    if (seatingGroupReservation.status === "available") {
      // no need for waitlist, create a confirmed reservation
      const reservation = new ReservationSchema(req.body);
      reservation.status = "confirmed";
      const saved = await reservation.save({ session });
      await session.commitTransaction();
      updateRestaurantSeating(restaurant, req.body.no_of_ppl);

      res.send({ id: saved._id }).status(201);
      await session.endSession();
    } else if (restaurant.reservation.current_waitlist === null) {
      // put request in pending state or a queue
      console.log("Putting the request in the queue");
    }
    // const seating = restaurant.realtime_seating;
  } catch (error) {
    await session.endSession();
    console.log(error);
    res.status(500).send({ code: "reservation_error", message: error.message });
  } finally {
    // End the session
    if (session) {
      session.endSession();
    }
  }
});

router.delete("/", async (req, res) => {
  try {
    // const all = await ReservationSchema.find({ no_of_ppl: { $gte: 4 } });
    const deleted = await ReservationSchema.deleteMany({});
    res.status(202).send({
      recordsDeleted: deleted.deletedCount,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Error fetching reservations", error });
  }
});

async function getReservations(date) {
  const startDate = new Date(date);
  startDate.setUTCHours(0, 0, 0, 0);

  const endDate = new Date(date);
  endDate.setUTCHours(23, 59, 59, 999);

  const reservations = await ReservationSchema.find({
    createdAt: {
      $gte: startDate.toISOString(),
      $lte: endDate.toISOString(),
    },
    status: "confirmed",
  });
  return reservations;
}

function getSeatingGroupReservation(noOfPpl, restaurant) {
  const seatingGroup = ReservationUtils.getValue(noOfPpl);

  if (seatingGroup === null || seatingGroup === undefined) {
    throw new Error("Seating group is not defined in the application");
  }

  if (!restaurant.realtime_seating[seatingGroup]) {
    throw new Error("Seating group is not defined in the restaurant");
  }

  const seatingGroupReservationStatus =
    restaurant.realtime_seating[seatingGroup];
  return seatingGroupReservationStatus;
}

async function updateRestaurantSeating(restaurant, no_of_ppl) {
  const group = ReservationUtils.getValue(no_of_ppl);
  if (restaurant.realtime_seating[group]) {
    const groupSeating = restaurant.realtime_seating[group];

    groupSeating.available = groupSeating.available - 1;
    groupSeating.reserved = groupSeating.reserved + 1;

    // Update the restaurant document
    restaurant.realtime_seating[group] = groupSeating;
    if (groupSeating.available <= 0) {
      groupSeating.status = "full";
    }
    restaurant.save();
  }
}

async function createWaitList(restaurant) {
  try {
    const waitList = new WaitlistSchema({
      members: [],
      restaurant_id: restaurant._id,
      status: "active",
    });

    const savedWaitList = await waitList.save();
    console.log(savedWaitList);
    restaurant.reservation.current_waitlist = savedWaitList._id;
    restaurant.reservation.reservationStatus = "waitlist";
    await restaurant.save();
  } catch (error) {
    console.error("Error in createWaitList:", error);
  }
}

async function getUserReservations(reservationRequest) {
  try {
    const startDate = new Date(reservationRequest.slot.date);
    startDate.setUTCHours(0, 0, 0, 0);

    const endDate = new Date(reservationRequest.slot.date);
    endDate.setUTCHours(23, 59, 59, 999);

    const findRequest = {
      "user_details.email": reservationRequest.user_details.email,
      createdAt: {
        $gte: startDate.toISOString(),
        $lte: endDate.toISOString(),
      },
    };

    console.log("Find user reservations request ::: ", findRequest);

    const reservations = await ReservationSchema.find(findRequest);
    return reservations;
  } catch (error) {
    console.error("Error in gettting User reservations ::: ", error);
  }
}

export default router;
