rs.initiate(
  {
    _id: "rs0",
    members: [{ _id: 0, host: "localhost:27017" }],
  },
  { force: true }
);

db = db.getSiblingDB("waitinglistdb");

db.createUser({
  user: "appuser",
  pwd: "apppass",
  roles: [
    {
      role: "readWrite",
      db: "waitinglistdb",
    },
  ],
});

// db = new Mongo().getDB("waitinglistdb");
// db = db.getSiblingDB("waitinglistdb");
db.createCollection("restaurants");
db.createCollection("reservations");
db.createCollection("waitlist");

db.restaurants.insertMany([
  {
    name: "The Burger Spot",
    type: ["American", "Burgers"],
    location: {
      type: "Point",
      coordinates: [-79.396417, 43.650104], // Toronto, Canada (approx)
    },
    address: "123 Main Street, Toronto, ON M5V 1Z9",
    opening_hrs: {
      monday: "11:00 AM - 10:00 PM",
      tuesday: "11:00 AM - 10:00 PM",
      wednesday: "11:00 AM - 10:00 PM",
      thursday: "11:00 AM - 10:00 PM",
      friday: "11:00 AM - 11:00 PM",
      saturday: "11:00 AM - 11:00 PM",
      sunday: "12:00 PM - 9:00 PM",
    },
  },
  {
    name: "Pasta Palace",
    type: ["Italian"],
    location: {
      type: "Point",
      coordinates: [-73.587806, 45.508839], // Montreal, Canada (approx)
    },
    address: "456 Rue Sainte-Catherine Ouest, Montréal, QC H3B 1A7",
    opening_hrs: {
      monday: "Closed",
      tuesday: "5:00 PM - 10:00 PM",
      wednesday: "5:00 PM - 10:00 PM",
      thursday: "5:00 PM - 10:00 PM",
      friday: "5:00 PM - 11:00 PM",
      saturday: "5:00 PM - 11:00 PM",
      sunday: "5:00 PM - 9:00 PM",
    },
  },
  // Add more documents as needed ...
]);
