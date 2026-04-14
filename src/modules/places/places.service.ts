import { ApiError } from "../../helper/errors";
import { StatusCodes } from "http-status-codes";

/* ================= COUNTRIES ================= */
export const getCountriesService = async () => {
  try {
    const countryRes = await fetch(
      "https://countriesnow.space/api/v0.1/countries/positions",
    );

    if (!countryRes.ok) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Failed to fetch countries");
    }

    const countryData = await countryRes.json();

    const countries = countryData.data.map((c: any) => ({
      label: c.name,
      value: c.name,
    }));

    return [{ label: "All Countries", value: "" }, ...countries];
  } catch (error: any) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      error.message || "Country service failed",
    );
  }
};

/* ================= CITIES (DYNAMIC) ================= */
export const getCitiesService = async (country: string) => {
  try {
    if (!country) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Country is required");
    }

    const res = await fetch(
      "https://countriesnow.space/api/v0.1/countries/cities",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country }),
      },
    );

    if (!res.ok) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Failed to fetch cities API");
    }

    const data = await res.json();

    if (!data?.data || !Array.isArray(data.data)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid cities response");
    }

    const cities = data.data;

    return [
      { label: "All Cities", value: "" },
      ...cities.map((city: string) => ({
        label: city,
        value: city,
      })),
    ];
  } catch (error: any) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      error?.message || "City service failed",
    );
  }
};
