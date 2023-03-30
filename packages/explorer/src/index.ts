import * as backend from "@giz/explorer-backend-libgit2";

export const createMsg = (name: string) => {
  return backend.create_msg(name);
};
