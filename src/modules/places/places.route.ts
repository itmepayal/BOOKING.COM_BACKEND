import express from "express";
import {
  getCitiesController,
  getCountriesController,
} from "./places.controller";

export const placesRouters = express.Router();

placesRouters.get("/countries", getCountriesController);
placesRouters.post("/cities", getCitiesController);
