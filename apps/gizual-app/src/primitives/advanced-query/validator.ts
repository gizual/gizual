import Ajv from "ajv";
import addFormats from "ajv-formats";

import { SearchQuery } from ".";

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
  validate: function (input?: string) {
    if (!input) return false;
    let parsedInput = "";

    try {
      parsedInput = JSON.parse(input);
    } catch (error) {
      console.warn("Failed to parse advanced query:", error);
      return false;
    }

    console.log("Validating input:", input, _validationFunction(parsedInput));

    return _validationFunction(parsedInput);
  },
};
