import { slowDown } from "express-slow-down";
import { rateLimit, MemoryStore } from "express-rate-limit";

export const RateLimitMiddleware = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes window
  max: 200, // Limit each IP to 100 requests per `window`
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  store: new MemoryStore(),
});

export const RateSlowDownMiddleware = slowDown({
  windowMs: 1 * 60 * 1000, // 1 minute window
  delayAfter: 10, // Allow 5 requests to go at full speed, then...
  delayMs: (hits) => hits * 100, // Add 100 ms of delay to every request
  store: new MemoryStore(),
});
