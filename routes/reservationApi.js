import express from "express";
import mongoose from "mongoose";
import ReservationSchema from "../model/reservation.js";
import RestaurantSchema from "../model/restaurants.js";
import WaitlistSchema from "../model/waitlist.js";
import RealtimeSeatingSchema from "../model/realtimeSeating.js";
import { ReservationUtils } from "../utils.js";
import { addMinutes, format, getDay, subMinutes } from "date-fns";

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
    // const allSlots = Object.values(restaurant.slots).flatMap((timeSlots) =>
    //   timeSlots.map((slot) => slot)
    // );
    let allSlots = [];

    allSlots = restaurant.slots["morning"]
      .concat(restaurant.slots["lunch"])
      .concat(restaurant.slots["dinner"]);

    const seating = await RealtimeSeatingSchema.findOne({
      restaurant_id: req.query.restaurant_id,
      groupId: ReservationUtils.getValue(req.query.no_of_ppl),
    });

    const preferences = restaurant.preferences; // turn_over_time, slots.gap, time_in_advance
    const reservations = await getReservations(
      req.query.date,
      req.query.no_of_ppl
    );

    // find eligible slots - slots which are in range of reservation time
    const { startSlot, endSlot } = getStartEndSlot(req.query.slot, restaurant);

    var slotTime = startSlot;

    while (slotTime <= endSlot) {
      // var reservation = reservations.find(
      //   (item) =>
      //     item.slot.time === slotTime &&
      //     item.no_of_ppl === parseInt(req.query.no_of_ppl)
      // );

      const restaurantSlotTime = ReservationUtils.getTimeSlot(
        allSlots,
        req.query.slot
      );
      const groupSeating = seating.seating.find(
        (item) => item.slot === restaurantSlotTime
      );

      if (groupSeating.available > 0) {
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
    const seatingGroup = ReservationUtils.getValue(req.body.no_of_ppl);

    // find slot
    const slots = restaurant.slots[req.body.slot.type];
    const slotTime = ReservationUtils.getTimeSlot(slots, req.body.slot.time);

    const seating = await RealtimeSeatingSchema.findOne({
      restaurant_id: req.body.restaurant_id,
      groupId: seatingGroup,
    });

    const seatingSlot = seating.seating.find((item) => item.slot === slotTime);

    // check user reservations for the same day
    const userReservations = await getUserReservations(req.body);

    if (userReservations.length > 0) {
      throw new Error("User already has a reserved slot today");
    }

    if (seatingSlot.status === "available") {
      // no need for waitlist, create a confirmed reservation
      const reservation = new ReservationSchema(req.body);
      reservation.status = "confirmed";
      reservation.status_tree.addToSet({
        status: "confirmed",
        date: new Date(),
      });
      const saved = await reservation.save({ session });
      await session.commitTransaction();
      updateRestaurantSeating(seating, slotTime);

      res.send({ id: saved._id }).status(201);
      await session.endSession();
    } else if (restaurant.reservation.current_waitlist === null) {
      // put request in pending state or a queue
      console.log("Putting the request in the queue");

      const reservation = new ReservationSchema(req.body);
      reservation.status = "pending";
      reservation.status_tree.addToSet({
        status: "pending",
        date: new Date(),
      });
      const saved = await reservation.save({ session });
      await session.commitTransaction();

      res
        .send({
          id: saved._id,
          code: "reservation_full",
          message: "Putting the request in the queue",
        })
        .status(201);
      await session.endSession();
    }
    // const seating = restaurant.realtime_seating;
  } catch (error) {
    await session.abortTransaction();
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

function getStartEndSlot(slot, restaurant) {
  const requestedSlot = new Date(
    0,
    0,
    0,
    slot.split(":")[0],
    slot.split(":")[1]
  );

  var startSlot = format(subMinutes(requestedSlot, 60), "HH:mm");
  var endSlot = format(addMinutes(requestedSlot, 60), "HH:mm");

  const dayOfWeek = ReservationUtils.getDayOfWeek();
  const openClose = restaurant.opening_hrs[dayOfWeek];

  if (startSlot <= openClose.open) {
    startSlot = openClose.open;
    endSlot = format(
      addMinutes(
        new Date(0, 0, 0, startSlot.split(":")[0], startSlot.split(":")[1]),
        120
      ),
      "HH:mm"
    );
  }

  if (startSlot >= openClose.close) {
    endSlot = openClose.close;
    startSlot = format(
      subMinutes(
        new Date(0, 0, 0, endSlot.split(":")[0], endSlot.split(":")[1]),
        120
      ),
      "HH:mm"
    );
  }

  return { startSlot, endSlot };
}

/**
 *
 * @param {Date} date
 * @param {Number} no_of_ppl
 */
async function getReservations(date, no_of_ppl) {
  const startDate = new Date(date);
  startDate.setUTCHours(0, 0, 0, 0);

  const endDate = new Date(date);
  endDate.setUTCHours(23, 59, 59, 999);

  const getReservationsRequest = {
    createdAt: {
      $gte: startDate.toISOString(),
      $lte: endDate.toISOString(),
    },
    status: "confirmed",
  };

  if (no_of_ppl) {
    getReservationsRequest.no_of_ppl = no_of_ppl;
  }

  const reservations = await ReservationSchema.find(getReservationsRequest);

  return reservations;
}

function getSeatingGroupReservation(noOfPpl, seating) {
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

async function updateRestaurantSeating(seating, slotTime) {
  seating.seating.forEach((element) => {
    if (element.slot === slotTime) {
      element.available = element.available - 1;
      element.reserved = element.reserved + 1;
      if (element.available <= 0) {
        element.status = "full";
      }
    }
  });

  // Update realtime seating
  seating.save();
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
