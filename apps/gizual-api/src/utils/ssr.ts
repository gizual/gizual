import express from "express";

export class QueueClient {
  promise: Promise<boolean>;
  constructor(private response: express.Response) {
    this.promise = Promise.resolve(true);
  }

  async send(event: Record<string, unknown>): Promise<boolean> {
    if (this.response.writableEnded) {
      return false;
    }

    this.promise = this.promise.then(
      () =>
        new Promise((resolve) => {
          if (this.response.writableEnded) {
            return false;
          }
          this.response.write(`data: ${JSON.stringify(event)}\n\n`, (error) => {
            if (error) {
              console.error("Error sending event", error);
              resolve(false);
              return;
            }
            resolve(true);
          });
        }),
    );
    return this.promise;
  }

  on(event: "close", listener: () => void) {
    this.response.on(event, listener);
  }

  async end() {
    await this.promise;
    this.send({ type: "end" });
    this.response.end();
  }
}
