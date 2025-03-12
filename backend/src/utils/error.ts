// backend/src/utils/error.ts
export class ApiError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = "ApiError";

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(msg: string) {
    return new ApiError(400, msg);
  }

  static notFound(msg: string) {
    return new ApiError(404, msg);
  }

  static internal(msg: string) {
    return new ApiError(500, msg);
  }

  static forbidden(msg: string) {
    return new ApiError(403, msg);
  }

  static unauthorized(msg: string) {
    return new ApiError(401, msg);
  }
}
