import { isEqual } from "lodash";
import { action, makeObservable, observable, when } from "mobx";

export interface PromiseObserverOptions<T> {
  /**
   * The initial value of the promise.
   */
  initialValue?: T;

  /**
   * If true, the `loading` state is initially true.
   * @default false
   */
  initiallyLoading?: boolean;

  /**
   * If provided, the promise will be executed immediately with the provided
   * arguments.
   */
  initialPromise?: PromiseOrigin<T>;

  /**
   * If true, the promise will be cached, and subsequent updates will not be
   * executed if the promise has already been fulfilled with the same arguments.
   * @default true
   */
  cache?: boolean;

  /**
   * The name of the promise observer. Used for debugging purposes.
   */
  name?: string;
}

export type PromiseOrigin<T> = {
  args: any[];
  create: (...args: any[]) => Promise<T>;
};

export type ExecutedPromise<T> = {
  promise: Promise<T>;
} & PromiseOrigin<T>;

function executePromise<T>(parts: PromiseOrigin<T>): ExecutedPromise<T> {
  const promise = parts.create(...parts.args);
  return {
    promise,
    ...parts,
  };
}

function hasEqualPromiseOrigin<T>(a: PromiseOrigin<T>, b: PromiseOrigin<T>): boolean {
  return isEqual(a.create, b.create) && isEqual(a.args, b.args);
}

function isEqualPromise<T>(a: ExecutedPromise<T>, b: ExecutedPromise<T>): boolean {
  return hasEqualPromiseOrigin(a, b) && a.promise === b.promise;
}

function createPromiseOrigin<T>(create: () => Promise<T>, args: any[]): PromiseOrigin<T> {
  return {
    create,
    args,
  };
}

type PromiseStatus = "pending" | "fulfilled" | "rejected" | "initial";
type FunctionArgs<F extends (...args: any[]) => any> = F extends (...args: infer A) => any
  ? A
  : never;

export class PromiseObserver<T> {
  status: PromiseStatus = "initial";
  loading = false;
  value: T | undefined;
  error: any;

  private cache: boolean;
  private name: string;
  private pending?: ExecutedPromise<T>;
  private fulfilled?: ExecutedPromise<T>;

  constructor(options: PromiseObserverOptions<T> = {}) {
    const {
      initialValue,
      initiallyLoading,
      cache = true,
      name = "unnamed",
      initialPromise,
    } = options;
    this.status = "initial";
    this.loading = initiallyLoading ?? false;
    this.value = initialValue;
    this.error = undefined;
    this.cache = cache;
    this.name = name;

    makeObservable(this, {
      status: observable,
      value: observable,
      error: observable,
      loading: observable,
    });

    if (initialPromise) {
      const { create, args } = initialPromise;
      this.update(create, ...args);
    }
  }

  private setStatus(loading?: boolean, status?: PromiseStatus) {
    action(
      `PromiseObserver<${this.name}>-setStatus`,
      (loading?: boolean, status?: PromiseStatus) => {
        if (loading !== undefined) {
          this.loading = loading;
        }
        if (status !== undefined) {
          this.status = status;
        }
      },
    )(loading, status);
  }

  private setValue(value: T | undefined) {
    action(`PromiseObserver<${this.name}>-setValue`, (value: T | undefined) => {
      this.value = value;
    })(value);
  }

  private setError(error: any) {
    action(`PromiseObserver<${this.name}>-setError`, (error: any) => {
      this.error = error;
    })(error);
  }

  // function which takes a function for a promise with arguments and returns a promise
  update<F extends (...args: any[]) => Promise<T>>(fn: F, ...args: FunctionArgs<F>): Promise<void> {
    const promiseOrigin = createPromiseOrigin(fn, args);

    if (this.cache) {
      if (this.pending && hasEqualPromiseOrigin(promiseOrigin, this.pending)) {
        this.setStatus(true);
        // already pending with these args, no need to update
        return this.pending.promise.then(() => {});
      }

      if (this.fulfilled && hasEqualPromiseOrigin(promiseOrigin, this.fulfilled)) {
        // already fulfilled with these args, no need to update
        if (!this.value) {
          this.fulfilled.promise.then((v) => {
            this.setValue(v);
          });
        }
        return Promise.resolve();
      }
    }
    return this.enqueuePending(promiseOrigin);
  }

  private enqueuePending(promiseOrigin: PromiseOrigin<T>): Promise<void> {
    this.setStatus(true, "pending");

    const currentPromise = executePromise(promiseOrigin);
    this.pending = currentPromise;

    const onFulfilled = action(`PromiseObserver<${this.name}>-onFulfilled`, (result: T) => {
      if (this.pending && isEqualPromise(this.pending, currentPromise)) {
        // only update if this is still the pending promise, otherwise
        // another update has already been queued
        this.fulfilled = this.pending;
        this.pending = undefined;
        this.setStatus(false, "fulfilled");
        this.setValue(result);
        this.setError(undefined);
        return;
      }
    });

    const onRejected = action(`PromiseObserver<${this.name}>-onRejected`, (error: any) => {
      if (this.pending && isEqualPromise(this.pending, currentPromise)) {
        // only update if this is still the pending promise, otherwise
        // another update has already been queued
        this.pending = undefined;
        this.setStatus(false, "rejected");
        this.setValue(undefined);
        this.setError(error);
        return;
      }
    });

    return currentPromise.promise.then(onFulfilled, onRejected);
  }

  isNotPending(timeout?: number) {
    return when(() => this.status !== "pending" && !this.loading, {
      name: `PromiseObserver<${this.name}>-isNotPending`,
      timeout,
    });
  }
}
