import { StatusCodes, getReasonPhrase } from "http-status-codes";

export class ApiResponse<T = any> {
  statusCode: number;
  success: boolean;
  message: string;
  data: T;

  constructor(statusCode: number, data: T, message?: string) {
    this.statusCode = statusCode;
    this.success = statusCode < 400;
    this.message = message || getReasonPhrase(statusCode) || "Success";
    this.data = data;
  }
}
