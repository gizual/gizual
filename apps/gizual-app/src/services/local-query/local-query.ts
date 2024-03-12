import dayjs from "dayjs";
import { action, computed, makeObservable, observable, toJS } from "mobx";

import { QueryError } from "@giz/maestro";
import { SearchQueryType } from "@giz/query";
import { DATE_FORMAT, GizDate } from "@giz/utils/gizdate";

/**
 * This class is used to encapsulate access to the SearchQuery within the
 * view layer. During the lifetime of this object, the `initialQuery` must
 * be equal to the current `query`.
 *
 * All view components should use this class to manipulate the query.
 */
class LocalQueryManager {
  @observable _localQuery!: SearchQueryType;
  @observable _errors: QueryError[] | undefined;
  @observable _setQueryFn: (query: SearchQueryType) => void;

  _initialQuery!: SearchQueryType;

  constructor(
    query: SearchQueryType,
    setQueryFn: (query: SearchQueryType) => void,
    errors?: QueryError[],
  ) {
    this.loadQuery(query);
    this._setQueryFn = setQueryFn;
    this._errors = errors;

    makeObservable(this, undefined, { autoBind: true });
  }

  /** Replaces the current state of `localQuery` with the specified `query`. */
  @action.bound
  loadQuery(query: SearchQueryType) {
    this._localQuery = query;
    this._initialQuery = query;
  }

  @action.bound
  updateLocalQuery(partial: Partial<SearchQueryType>) {
    this._localQuery = { ...Object.assign(this._localQuery, partial) };
  }

  @action.bound
  resetLocalQuery() {
    this.loadQuery(this._initialQuery);
  }

  @action.bound
  publishLocalQuery() {
    this._setQueryFn(toJS(this._localQuery));
  }

  get errors() {
    return this._errors;
  }

  get localQuery() {
    return this._localQuery;
  }

  @computed
  get rangeByDate(): GizDate[] | undefined {
    if (this.localQuery && this.localQuery.time && "rangeByDate" in this.localQuery.time) {
      if (Array.isArray(this.localQuery.time.rangeByDate)) {
        return this.localQuery.time.rangeByDate.map(
          (d) => new GizDate(dayjs(d, DATE_FORMAT).toDate()),
        );
      }
      return undefined;
    }
  }
}

export { LocalQueryManager };
