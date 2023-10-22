export type GroupEntry = {
  groupName: string;
};

export type ControlType = "select" | "colour" | "number" | "checkbox" | "text";
export type SettingsValue = number | string | boolean;

export type SettingsEntry<T extends SettingsValue, C extends ControlType> = {
  name: string;
  description: string;
  value: T;
  controlType: C;
  defaultValue: T;
  availableValues?: { value: T; label: T | string }[];
};

export function isSettingsEntry(obj: unknown): obj is SettingsEntry<SettingsValue, ControlType> {
  return typeof obj === "object" && obj !== null && obj !== undefined && "name" in obj;
}

export function isGroupEntry(obj: unknown): obj is GroupEntry {
  return typeof obj === "object" && obj !== null && obj !== undefined && "groupName" in obj;
}

function createSetting<T extends SettingsValue, C extends ControlType>(
  name: string,
  description: string,
  value: T,
  controlType: C,
  availableValues?: { value: T; label: T | string }[],
): SettingsEntry<T, C> {
  return {
    name,
    description,
    value,
    controlType,
    defaultValue: value,
    availableValues,
  };
}

// Specific factory functions for different control types:
export const createColourSetting = (name: string, description: string, value: string) =>
  createSetting<string, "colour">(name, description, value, "colour");
export const createSelectSetting = <T extends string>(
  name: string,
  description: string,
  value: T,
  availableValues: { value: T; label: T | string }[],
) => createSetting<T, "select">(name, description, value, "select", availableValues);
export const createNumberSetting = (name: string, description: string, value: number) =>
  createSetting<number, "number">(name, description, value, "number");
export const createCheckboxSetting = (name: string, description: string, value: boolean) =>
  createSetting<boolean, "checkbox">(name, description, value, "checkbox");
export const _createTextSetting = (name: string, description: string, value: string) =>
  createSetting<string, "text">(name, description, value, "text");
