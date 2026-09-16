import axios from "axios";
import { ErrorCode } from "./errorTypes";
import type { AppErrorResponse } from "./errorTypes";
export class ApiError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly reason?: string;
  constructor(error: AppErrorResponse) {
    super(error.message);
    this.name = "ApiError";
    this.code = error.code;
    this.status = error.statusCode;
    this.reason = error.reason;
  }
}

function isAppErrorResponse(responseData: unknown): responseData is AppErrorResponse {
  if (!responseData || !(typeof responseData === "object")) {
    return false;
  }
  const error = responseData as Record<string, unknown>;

  return typeof error.code === "string" && typeof error.statusCode === "number" && typeof error.message === "string";
}

export function parseError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (axios.isAxiosError(error)) {
    if (!error.response)
      return new ApiError({ code: ErrorCode.UNKNOWN_ERROR, statusCode: 0, message: "Network error, Please check your connection" });

    const responseData: unknown = error.response.data;
    if (isAppErrorResponse(responseData)) return new ApiError(responseData);
    return new ApiError({
      code: ErrorCode.UNKNOWN_ERROR,
      statusCode: error.response.status,
      message: "An unexpected server error occured",
    });
  }

  if (error instanceof Error) {
    return new ApiError({ code: ErrorCode.UNKNOWN_ERROR, statusCode: 0, message: error.message });
  }

  return new ApiError({ code: ErrorCode.UNKNOWN_ERROR, statusCode: 0, message: "An unexpected error occured" });
}

export function parseWebSocketError(payload: unknown): ApiError {
  if (payload && typeof payload === "object" && "error" in payload) return parseError(payload.error);
  else return parseError(payload);
}
