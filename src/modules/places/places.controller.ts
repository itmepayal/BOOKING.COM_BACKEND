import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { asyncHandler } from "../../helper/handler";
import { ApiResponse } from "../../helper/response";

import { getCitiesService, getCountriesService } from "./places.service";

/* ================= COUNTRIES CONTROLLER ================= */
export const getCountriesController = asyncHandler(
  async (_req: Request, res: Response) => {
    const countries = await getCountriesService();

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          countries,
          "Countries fetched successfully",
        ),
      );
  },
);

/* ================= CITIES CONTROLLER ================= */
export const getCitiesController = asyncHandler(
  async (req: Request, res: Response) => {
    const { country } = req.body;

    const cities = await getCitiesService(country);

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(StatusCodes.OK, cities, "Cities fetched successfully"),
      );
  },
);
