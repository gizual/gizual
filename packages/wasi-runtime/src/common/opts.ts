export interface WasiRuntimeOpts {
  moduleUrl: string;
  moduleName: string;
  id?: number;
}

export interface WasiRunOpts {
  args: string[];
  env: Record<string, string>;
  awaitExit?: boolean;
}
