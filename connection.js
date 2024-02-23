import mongoose from "mongoose";
import { dbConfig } from "./config/database.config.js";

export const connect = async () => {
  await mongoose
    .connect(dbConfig.url, {
      useNewUrlParser: true,
      dbName: "waitinglistdb",
      replicaSet: "rs0",
    })
    .then(() => {
      console.log("Databse Connected Successfully!!");
    })
    .catch((err) => {
      console.log("Could not connect to the database", err);
      process.exit();
    });
};
