import { ReasonPhrases, StatusCodes } from "http-status-codes";

export class ApiError extends Error {
  statusCode: number;

  constructor(statusCode: number, message?: string) {
    const reason =
      message ||
      (ReasonPhrases as Record<string, string>)[statusCode.toString()];
    super(reason);

    this.statusCode = statusCode;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}
