export type Job = {
  id: number;
  priority: number;
  method: string;
  params: any[];
};

export type JobWithOrigin = Job & {
  origin: MessagePort;
};

export type DataResponse = {
  id: number;
  data: any;
  end?: boolean;
};

export type ErrorResponse = {
  id: number;
  error: string;
  end: true;
};

export type PoolResponse = DataResponse | ErrorResponse;

export type PoolTask_NewJob = {
  type: "new";
  job: Job;
};

export type PoolTask_UpdateJob = {
  type: "update";
  jobId: number;
  priority: number;
};

export type PoolTask_RemoveJob = {
  type: "remove";
  jobId: number;
};

export type PoolTask_ClosePort = {
  type: "close";
};

export type PoolTask =
  | PoolTask_NewJob
  | PoolTask_UpdateJob
  | PoolTask_RemoveJob
  | PoolTask_ClosePort;
