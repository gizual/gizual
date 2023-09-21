import { LINEAR_COLOR_RANGE, SPECIAL_COLORS } from "@app/utils";
import { makeAutoObservable } from "mobx";

type GroupEntry = {
  groupName: string;
};

export type ControlType = "select" | "color" | "number" | "checkbox" | "text";
export type SettingsValue = number | string | boolean | ViewMode;

export type SettingsEntry<T extends SettingsValue, C extends ControlType> = {
  name: string;
  description: string;
  value: T;
  availableValues?: { value: T; label: T }[];
  controlType: C;
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
  availableValues?: { value: T; label: T }[],
): SettingsEntry<T, C> {
  return {
    name,
    description,
    value,
    controlType,
    availableValues,
  };
}

// Specific factory functions for different control types:
const createColorSetting = (name: string, description: string, value: string) =>
  createSetting<string, "color">(name, description, value, "color");
const createSelectSetting = <T extends string>(
  name: string,
  description: string,
  value: T,
  availableValues: { value: T; label: T }[],
) => createSetting<T, "select">(name, description, value, "select", availableValues);
const createNumberSetting = (name: string, description: string, value: number) =>
  createSetting<number, "number">(name, description, value, "number");
const createCheckboxSetting = (name: string, description: string, value: boolean) =>
  createSetting<boolean, "checkbox">(name, description, value, "checkbox");
const createTextSetting = (name: string, description: string, value: string) =>
  createSetting<string, "text">(name, description, value, "text");

const VIEW_MODES = ["block", "flex"] as const;
type ViewMode = (typeof VIEW_MODES)[number];

type VisualisationSettings = {
  colors: {
    old: SettingsEntry<string, "color">;
    new: SettingsEntry<string, "color">;
    notLoaded: SettingsEntry<string, "color">;
  } & GroupEntry;
  canvas: {
    viewMode: SettingsEntry<ViewMode, "select">;
    rootMargin: SettingsEntry<number, "number">;
  } & GroupEntry;
} & GroupEntry;

const GUTTER_STYLES = ["simple", "author"] as const;
type GutterStyle = (typeof GUTTER_STYLES)[number];

type EditorSettings = {
  gutterStyle: SettingsEntry<GutterStyle, "select">;
} & GroupEntry;

export class SettingsController {
  editor: EditorSettings = {
    groupName: "Editor Settings",
    gutterStyle: createSelectSetting(
      "Gutter Style",
      "Modifies the Gutter on the left side of the code view.",
      "simple",
      GUTTER_STYLES.map((s) => {
        return { value: s, label: s };
      }),
    ),
  };
  visualisationSettings: VisualisationSettings = {
    groupName: "Visualisation Settings",
    colors: {
      groupName: "Colors",
      old: createColorSetting(
        "Old",
        "The color that visualises the most distant change.",
        LINEAR_COLOR_RANGE[0],
      ),
      new: createColorSetting(
        "New",
        "The color that visualises the most recent change.",
        LINEAR_COLOR_RANGE[1],
      ),
      notLoaded: createColorSetting(
        "Not loaded",
        "The color that visualises changes that did not load yet or are outside the range.",
        SPECIAL_COLORS.NOT_LOADED,
      ),
    },
    canvas: {
      groupName: "Canvas",
      viewMode: createSelectSetting(
        "View Mode",
        "The view mode of the main canvas. Block assigns a fixed size to each file, while flex tries to allocate space as necessary.",
        "block",
        VIEW_MODES.map((s) => {
          return { value: s, label: s };
        }),
      ),
      rootMargin: createNumberSetting(
        "Root Margin",
        "The margin of the canvas for evaluating file visibility, given in pixels. Positive margins enlarge the bounding box, negative margins shrink it.",
        200,
      ),
    },
  };

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get settings() {
    return {
      editor: this.editor,
      visualisationSettings: this.visualisationSettings,
    };
  }

  applySettings(settings: Partial<SettingsController>) {
    Object.assign(this, settings);
  }

  loadSettings() {
    const settings = localStorage.getItem("gizual-app.settings");
    if (!settings) return;

    const parsed = JSON.parse(settings);
    this.editor = parsed.editor;
    this.visualisationSettings = parsed.visualisationSettings;
  }

  storeSettings() {
    localStorage.setItem("gizual-app.settings", JSON.stringify(this));
  }

  downloadSettingsJSON() {
    const dataStr =
      "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.settings));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "settings.json");
    document.body.append(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }

  importSettingsJSON() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.addEventListener("change", (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files) return;
      const reader = new FileReader();
      reader.addEventListener("load", (e) => {
        if (!e.target) return;
        const result = e.target.result;
        if (typeof result !== "string") return;
        const parsed = JSON.parse(result);
        this.applySettings(parsed);
      });
      // eslint-disable-next-line unicorn/prefer-blob-reading-methods
      reader.readAsText(files[0]);
    });
    input.click();
  }
}
