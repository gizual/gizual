import { Callback, ExplorerI, Methods, Params } from "@giz/explorer";
import { Module } from "../build";

export class Explorer implements ExplorerI {
  private module: Module;

  constructor() {
    this.module = new Module();
  }
  send<M extends Methods>(method: M, params: Params<M>, cb: Callback<M>): void {
    const payload = JSON.stringify({
      method,
      params,
    });

    this.module.handle(payload, (error, payload) => {
      if (error) {
        cb({
          error,
        });
        return;
      }

      const data = JSON.parse(payload);

      if (data.error) {
        cb({
          error: data.error,
        });
        return;
      }

      if (data.end) {
        cb({
          data: data.data,
          end: true,
        });
      } else {
        cb({
          data: data.data,
          end: false,
        });
      }
    });
  }
}
