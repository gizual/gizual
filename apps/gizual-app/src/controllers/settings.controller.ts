import {
  createCheckboxSetting,
  createColorSetting,
  createNumberSetting,
  createSelectSetting,
  GroupEntry,
  SettingsEntry,
} from "@app/utils";
import { makeAutoObservable, toJS } from "mobx";

import { LINEAR_COLOR_RANGE, SPECIAL_COLORS } from "@giz/color-manager";

const TIMELINE_MODES = ["visible", "collapsed"] as const;
type TimelineMode = (typeof TIMELINE_MODES)[number];

const LINE_LENGTH_MODES = ["lineLength", "full"] as const;
type LineLengthMode = (typeof LINE_LENGTH_MODES)[number];

export type VisualizationSettings = {
  colors: {
    old: SettingsEntry<string, "color">;
    new: SettingsEntry<string, "color">;
    notLoaded: SettingsEntry<string, "color">;
  } & GroupEntry;
  canvas: {
    rootMargin: SettingsEntry<number, "number">;
    masonryColumns: SettingsEntry<number, "number">;
  } & GroupEntry;
  style: {
    lineLength: SettingsEntry<LineLengthMode, "select">;
    maxNumLines: SettingsEntry<number, "number">;
  } & GroupEntry;
} & GroupEntry;

const GUTTER_STYLES = ["simple", "author"] as const;
type GutterStyle = (typeof GUTTER_STYLES)[number];

type EditorSettings = {
  gutterStyle: SettingsEntry<GutterStyle, "select">;
} & GroupEntry;

type TimelineSettings = {
  displayMode: SettingsEntry<TimelineMode, "select">;
  snap: SettingsEntry<boolean, "checkbox">;
  defaultRange: SettingsEntry<number, "number">;
  weekModeThreshold: SettingsEntry<number, "number">;
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
  timelineSettings: TimelineSettings = {
    groupName: "Timeline Settings",
    displayMode: createSelectSetting(
      "Display Mode",
      "Controls if the timeline should be always visible or collapsed into the search bar.",
      "collapsed",
      TIMELINE_MODES.map((m) => {
        return { value: m, label: m };
      }),
    ),
    snap: createCheckboxSetting(
      "Snap to grid",
      "Controls if selections on the timeline snap to the nearest grid element.",
      false,
    ),
    defaultRange: createNumberSetting(
      "Default Selection Range",
      "Adjusts the default date range (how many days to visualize, starting from the last commit in the repository).",
      365,
    ),
    weekModeThreshold: createNumberSetting(
      "Week Mode Threshold",
      "Adjusts the threshold (in days) after which the timeline changes to display weeks instead of days.",
      365,
    ),
  };
  visualizationSettings: VisualizationSettings = {
    groupName: "Visualization Settings",
    colors: {
      groupName: "Colors",
      old: createColorSetting(
        "Old",
        "The color that visualizes the most distant change.",
        LINEAR_COLOR_RANGE[0],
      ),
      new: createColorSetting(
        "New",
        "The color that visualizes the most recent change.",
        LINEAR_COLOR_RANGE[1],
      ),
      notLoaded: createColorSetting(
        "Not loaded",
        "The color that visualizes changes that did not load yet or are outside the range.",
        SPECIAL_COLORS.NOT_LOADED,
      ),
    },
    canvas: {
      groupName: "Canvas",
      rootMargin: createNumberSetting(
        "Root Margin",
        "The margin of the canvas for evaluating file visibility, given in pixels. Positive margins enlarge the bounding box, negative margins shrink it.",
        200,
      ),
      masonryColumns: createNumberSetting(
        "Masonry Columns",
        "The amount of columns to show in the main canvas.",
        10,
      ),
    },
    style: {
      groupName: "Style",
      lineLength: createSelectSetting(
        "Line Background Width",
        "Controls the background width for each line within the visualization in file-line mode. It can either be set to represent the line length within the file, or full width.",
        "lineLength",
        [
          { value: "lineLength", label: "By actual line length" },
          { value: "full", label: "Full width" },
        ],
      ),
      maxNumLines: createNumberSetting(
        "Maximum Number of Lines",
        "The maximum number of lines to display per file. If set to 0, all lines will be displayed.",
        200,
      ),
    },
  };

  eventCallbacks: Record<string, ((...args: any[]) => void)[]> = {};

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get settings() {
    return {
      editor: this.editor,
      timelineSettings: this.timelineSettings,
      visualizationSettings: this.visualizationSettings,
    };
  }

  on(
    event: "visualSettings:changed",
    cb: (visualSettings: VisualizationSettings) => void,
    fireImmediately = false,
  ) {
    this.eventCallbacks[event] = this.eventCallbacks[event] || [];
    this.eventCallbacks[event].push(cb);

    if (fireImmediately) {
      cb(toJS(this.visualizationSettings));
    }
  }

  updateValue(entry: SettingsEntry<any, any>, newValue: any) {
    entry.value = newValue;
    this.storeSettings();
  }

  applySettings(settings: Partial<SettingsController>) {
    Object.assign(this, settings);
  }

  loadSettings() {
    const settings = localStorage.getItem("gizual-app.settings");
    if (!settings) return;

    const parsed = JSON.parse(settings);
    this.editor = mergeObj(toJS(this.editor), parsed.editor);
    this.visualizationSettings = mergeObj(
      toJS(this.visualizationSettings),
      parsed.visualizationSettings,
    );
    this.timelineSettings = mergeObj(toJS(this.timelineSettings), parsed.timelineSettings);
  }

  storeSettings() {
    console.log("storeSettings", toJS(this.settings));
    localStorage.setItem("gizual-app.settings", JSON.stringify(toJS(this.settings)));
    for (const cb of this.eventCallbacks["visualSettings:changed"] ?? []) {
      cb(toJS(this.visualizationSettings));
    }
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

function mergeObj(obj1: any, obj2: any) {
  if (!obj2) return obj1;
  for (const key of Object.keys(obj2)) {
    if (key in obj1) {
      obj1[key] = obj2[key];
    }
  }
  return obj1;
}
