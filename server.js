import { connect } from "./connection.js";
import express from "express";
import cors from "cors";
import restaurantRoutes from "./routes/restaurantApi.js";
import reservationRoutes from "./routes/reservationApi.js";

const app = express();

const startServer = async () => {
  await connect();

  const port = 5001; // Use a port of your choice
  app.use(cors());
  app.use(express.json());

  app.use("/health-check", (req, res) => {
    res.send("App running!");
  });

  // API Routes
  app.use("/restaurant", restaurantRoutes);
  app.use("/reservation", reservationRoutes);

  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
};

startServer();
