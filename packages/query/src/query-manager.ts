import { LocalStorage } from "./local-storage";

const LOCAL_STORAGE_QUERY_PREFIX = "gizual.query-manager.query";
const LOCAL_STORAGE_QUERIES = "gizual.query-manager.queries";

type Query = {
  key: string;
  content: string;
};

export class QueryManager {
  currentShortFormQuery = "";
  currentQuery = "{}";

  constructor() {}

  evaluateQuery(query: string) {
    // Forward the query to the SQL backend and return the resulting promise.
    this.currentQuery = query;
  }

  parseShortFormQuery(_filesQuery: string, _timesQuery: string): string {
    const longQuery = "";
    return longQuery;
  }

  translateToShortFormQuery(_query: string): { filesQuery: string; timesQuery: string } {
    return { filesQuery: "", timesQuery: "" };
  }

  storeQuery(key: string, query: string) {
    const sanitizedKey = LocalStorage.sanitizeKey(key);
    const existingQueries = this.loadQueryKeys();
    if (!existingQueries.includes(sanitizedKey)) {
      existingQueries.push(sanitizedKey);
      LocalStorage.setItem(`${LOCAL_STORAGE_QUERIES}`, existingQueries.join(","));
    }

    LocalStorage.setItem(`${LOCAL_STORAGE_QUERY_PREFIX}.${sanitizedKey}`, query);
  }

  loadQueryKeys() {
    return (LocalStorage.getItem(`${LOCAL_STORAGE_QUERIES}`) ?? "").split(",");
  }

  loadQuery(key: string) {
    return LocalStorage.getItem(`${LOCAL_STORAGE_QUERY_PREFIX}.${key}`);
  }

  loadStoredQueries(): Query[] {
    const queries: Query[] = [];
    const existingQueries = this.loadQueryKeys();
    for (const key of existingQueries) {
      const content = this.loadQuery(key) ?? "";
      queries.push({ key, content });
    }
    return queries;
  }
}
