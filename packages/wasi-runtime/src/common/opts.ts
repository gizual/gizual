export interface WasiRuntimeOpts {
  moduleUrl: string;
  moduleName: string;
}

export interface WasiRunOpts {
  args: string[];
  env: Record<string, string>;
  awaitExit?: boolean;
}
