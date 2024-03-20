import dayjs from "dayjs";
import { action, computed, makeObservable, observable, reaction, toJS } from "mobx";

import { Maestro } from "@giz/maestro";
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

  _initialQuery!: SearchQueryType;

  dispose?: () => void;

  constructor(private maestro: Maestro) {
    this._localQuery = { ...maestro.query.get() };
    this._initialQuery = { ...this._localQuery };
    makeObservable(this, undefined, { autoBind: true });

    this.dispose = reaction(
      () => maestro.query.get(),
      (query) => {
        this.loadQuery(query);
      },
      {
        name: "keep-local-query-updated-with-maestro-query",
      },
    );
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
    this.maestro.setQuery(toJS(this._localQuery));
  }

  get errors() {
    return this.maestro.queryErrors.get();
  }

  get localQuery() {
    return this._localQuery;
  }

  /* ---------------------- Query quick access functions ---------------------- */
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

  @computed
  get type() {
    if (this.localQuery && this.localQuery.type) return this.localQuery.type;
  }

  @computed
  get preset() {
    if (this.localQuery && this.localQuery.preset) return this.localQuery.preset;
  }

  @computed
  get presetKey() {
    if (this.localQuery && this.localQuery.preset) {
      if ("gradientByAge" in this.localQuery.preset) return "gradientByAge";
      if ("paletteByAuthor" in this.localQuery.preset) return "paletteByAuthor";
      throw new Error("Encountered unknown preset key in LocalQueryManager.");
    }
  }

  @computed
  get styles() {
    if (this.localQuery && this.localQuery.styles) return this.localQuery.styles;
  }

  @computed
  get colors() {
    if (this.localQuery && this.localQuery.preset) {
      if ("gradientByAge" in this.localQuery.preset) return this.localQuery.preset.gradientByAge;
      if ("paletteByAuthor" in this.localQuery.preset)
        return this.localQuery.preset.paletteByAuthor;
    }
  }
}

export { LocalQueryManager };
