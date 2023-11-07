const LOCAL_STORAGE_PRE = "gizual-app";

export const LocalStorage = {
  setItem(key: string, value: string) {
    if (typeof Storage === "undefined") return;
    localStorage.setItem(`${LOCAL_STORAGE_PRE}.${key}`, value);
  },
  getItem(key: string): string | undefined {
    if (typeof Storage === "undefined") return undefined;
    return localStorage.getItem(`${LOCAL_STORAGE_PRE}.${key}`) ?? undefined;
  },
  getBoolean(key: string): boolean {
    return this.getItem(key) === "true";
  },
  sanitizeKey(key: string) {
    return key.replaceAll(/[^\w.-]/g, "");
  },
};
