import express from "express";

const isProduction = process.env.NODE_ENV === "production";

function hasStatusCode(err: unknown): err is { statusCode: number } {
  return (
    !!err && typeof err === "object" && "statusCode" in err && typeof err.statusCode === "number"
  );
}

function hasErrorMessage(err: unknown): err is { message: string } {
  return !!err && typeof err === "object" && "message" in err && typeof err.message === "string";
}

function hasStack(err: unknown): err is { stack: unknown } {
  return !!err && typeof err === "object" && "stack" in err;
}

export function ErrorHandlerMiddleware(
  err: unknown,
  _req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  console.log("HERE");
  if (res.headersSent) {
    return next(err);
  }

  const errStatus = hasStatusCode(err) ? err.statusCode : 500;
  const errMsg = hasErrorMessage(err) ? err.message : "Something went wrong";
  res.status(errStatus).json({
    success: false,
    status: errStatus,
    message: errMsg,
    stack: isProduction && hasStack(err) ? err.stack : undefined,
  });
}
