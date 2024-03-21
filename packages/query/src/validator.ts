import Ajv from "ajv";
import addFormats from "ajv-formats";

import { createLogger } from "@giz/logging";

import { SearchQuery, SearchQueryType } from ".";

// Recommended `ajv` setup from `typebox` docs:
const ajv = addFormats(new Ajv({}), [
  "date-time",
  "time",
  "date",
  "email",
  "hostname",
  "ipv4",
  "ipv6",
  "uri",
  "uri-reference",
  "uuid",
  "uri-template",
  "json-pointer",
  "relative-json-pointer",
  "regex",
]);

const _validationFunction = ajv.compile(SearchQuery);

export const Validator = {
  logger: createLogger("query-validator"),
  validate: function (input?: string) {
    if (!input) return;
    let parsedInput = "";

    try {
      parsedInput = JSON.parse(input);
      const isValid = _validationFunction(parsedInput);

      this.logger.log("Validating input:", input, isValid);

      // If the validation is successful, return the parsed JSON object
      if (isValid) {
        return parsedInput as SearchQueryType;
      } else {
        // You might want to log or handle the validation errors
        const errors = _validationFunction.errors;
        this.logger.warn("Validation errors:", errors);
        return;
      }
    } catch (error) {
      this.logger.warn("Failed to parse advanced query:", error);
      return;
    }
  },
};
