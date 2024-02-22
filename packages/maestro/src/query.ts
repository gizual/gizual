import { match, Pattern } from "ts-pattern";

import { Commit } from "@giz/explorer";
import { PoolPortal } from "@giz/explorer-web";
import { SearchQueryType, TimeQueryType } from "@giz/query";
import { GizDate } from "@giz/utils/gizdate";

export type Query = SearchQueryType;
export type TimeQuery = TimeQueryType;

export type QueryError = {
  selector: string; // JSONPath like `time.sinceFirstCommitBy` or `time.rangeByDate[0]`
  message: string;
};

export type PointInTime = {
  date: GizDate;
  commit: Commit;
};

export type EvaluatedRange = {
  since: PointInTime;
  until: PointInTime;
};

export type QueryWithErrors = {
  query: Query;
  errors?: QueryError[];
};

const QueryPattern = {
  time: {
    rangeByDate: {
      rangeByDate: Pattern.union(Pattern.array(Pattern.string), Pattern.string),
    },

    rangeByRef: {
      rangeByRef: Pattern.union(Pattern.array(Pattern.string), Pattern.string),
    },

    sinceFirstCommitBy: {
      sinceFirstCommitBy: Pattern.string,
    },
  },
};

export type Result<T> =
  | {
      result?: undefined;
      errors: QueryError[];
    }
  | {
      result: T;
      errors?: undefined;
    };

export async function evaluateTimeRange(
  time: TimeQuery | undefined,
  pool: PoolPortal,
  branch?: string, // TODO: move this into the time query
): Promise<Result<EvaluatedRange>> {
  return match(time)
    .with(Pattern.nullish, () => ({
      errors: [{ selector: "time", message: "Time query is empty" }],
    }))
    .with(QueryPattern.time.rangeByDate, async ({ rangeByDate }) => {
      if (!branch) {
        return {
          errors: [{ selector: "time", message: "Branch is required for date range" }],
        };
      }

      const { result, errors } = resolveRangeByDate(rangeByDate);

      if (errors) {
        return { errors };
      }

      const [startDate, endDate] = result;

      const { sinceCommit, untilCommit } = await pool.getCommitsForTimeRange({
        branch: branch,
        startSeconds: toSeconds(startDate),
        endSeconds: toSeconds(endDate),
      });

      return {
        result: {
          since: { date: startDate, commit: sinceCommit },
          until: { date: endDate, commit: untilCommit },
        },
      };
    })
    .with(QueryPattern.time.rangeByRef, async ({ rangeByRef }) => {
      //TODO: need to check if rev[0] to rev[1] is a valid range of commits
      const errors: QueryError[] = [];

      if (typeof rangeByRef === "string") {
        return {
          errors: [{ selector: "time", message: "Not implemented" }],
        };
      }

      if (rangeByRef.length !== 2) {
        errors.push({ selector: "time.rangeByRef", message: "Invalid ref range tuple" });
        return {
          errors: [{ selector: "time", message: "Not implemented" }],
        };
      }

      const [startRef, endRef] = rangeByRef;

      const [startRevValid, endRevValid] = await Promise.all([
        pool.isValidRev({ rev: startRef }),
        pool.isValidRev({ rev: endRef }),
      ]);

      if (!startRevValid) {
        errors.push({ selector: "time.rangeByRef[0]", message: "Invalid start ref" });
      }

      if (!endRevValid) {
        errors.push({ selector: "time.rangeByRef[1]", message: "Invalid end ref" });
      }

      if (errors.length > 0) {
        return {
          errors,
        };
      }

      const [sinceCommit, untilCommit] = await Promise.all([
        pool.getCommit({ rev: startRef }),
        pool.getCommit({ rev: endRef }),
      ]);

      return {
        result: {
          since: { date: new GizDate(+sinceCommit.timestamp * 1000), commit: sinceCommit },
          until: { date: new GizDate(+untilCommit.timestamp * 1000), commit: untilCommit },
        },
      };
    })
    .with(QueryPattern.time.sinceFirstCommitBy, async () => {
      return {
        errors: [{ selector: "time.sinceFirstCommitBy", message: "Not implemented" }],
      };
    })
    .otherwise(() => ({
      errors: [{ selector: "time", message: "Invalid time query" }],
    }));
}

function resolveRangeByDate(range: string | string[]): Result<[GizDate, GizDate]> {
  const errors: QueryError[] = [];
  if (typeof range === "string") {
    if (range.length === 0) {
      errors.push({ selector: "time.rangeByDate", message: "Empty date string" });
      return {
        errors,
      };
    }
    return {
      result: [new GizDate(range), new GizDate()],
    };
  }

  if (range.length !== 2) {
    errors.push({ selector: "time.rangeByDate", message: "Invalid date range tuple" });
  }

  if (range[0].length === 0) {
    errors.push({ selector: "time.rangeByDate[0]", message: "Empty date string" });
  }

  if (range[1].length === 0) {
    errors.push({ selector: "time.rangeByDate[1]", message: "Empty date string" });
  }

  if (errors.length > 0) {
    return {
      errors,
    };
  }

  const startDate = new GizDate(range[0]);
  const endDate = new GizDate(range[1]);

  return {
    result: [startDate, endDate],
  };
}

function toSeconds(d: GizDate): number {
  return Math.round(d.getTime() / 1000);
}
