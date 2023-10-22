import {
  createCheckboxSetting,
  createColourSetting,
  createNumberSetting,
  createSelectSetting,
  GroupEntry,
  LINEAR_COLOUR_RANGE,
  SettingsEntry,
  SPECIAL_COLOURS,
} from "@app/utils";
import { makeAutoObservable, toJS } from "mobx";

const VIEW_MODES = ["block", "flex"] as const;
type ViewMode = (typeof VIEW_MODES)[number];

const TIMELINE_MODES = ["visible", "collapsed"] as const;
type TimelineMode = (typeof TIMELINE_MODES)[number];

const LINE_LENGTH_MODES = ["lineLength", "full"] as const;
type LineLengthMode = (typeof LINE_LENGTH_MODES)[number];

type VisualisationSettings = {
  colours: {
    old: SettingsEntry<string, "colour">;
    new: SettingsEntry<string, "colour">;
    notLoaded: SettingsEntry<string, "colour">;
  } & GroupEntry;
  canvas: {
    viewMode: SettingsEntry<ViewMode, "select">;
    rootMargin: SettingsEntry<number, "number">;
  } & GroupEntry;
  style: {
    lineLength: SettingsEntry<LineLengthMode, "select">;
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
      "Adjusts the default date range (how many days to visualise, starting from the last commit in the repository).",
      365,
    ),
    weekModeThreshold: createNumberSetting(
      "Week Mode Threshold",
      "Adjusts the threshold (in days) after which the timeline changes to display weeks instead of days.",
      365,
    ),
  };
  visualisationSettings: VisualisationSettings = {
    groupName: "Visualisation Settings",
    colours: {
      groupName: "Colors",
      old: createColourSetting(
        "Old",
        "The color that visualises the most distant change.",
        LINEAR_COLOUR_RANGE[0],
      ),
      new: createColourSetting(
        "New",
        "The color that visualises the most recent change.",
        LINEAR_COLOUR_RANGE[1],
      ),
      notLoaded: createColourSetting(
        "Not loaded",
        "The color that visualises changes that did not load yet or are outside the range.",
        SPECIAL_COLOURS.NOT_LOADED,
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
    style: {
      groupName: "Style",
      lineLength: createSelectSetting(
        "Line Length",
        "Controls the length of each line within the visualisation. It can either be representative to the line length within the file, or full width.",
        "lineLength",
        [
          { value: "lineLength", label: "Based on line length" },
          { value: "full", label: "Full width" },
        ],
      ),
    },
  };

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get settings() {
    return {
      editor: this.editor,
      timelineSettings: this.timelineSettings,
      visualisationSettings: this.visualisationSettings,
    };
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
    this.visualisationSettings = mergeObj(
      toJS(this.visualisationSettings),
      parsed.visualisationSettings,
    );
    this.timelineSettings = mergeObj(toJS(this.timelineSettings), parsed.timelineSettings);
  }

  storeSettings() {
    localStorage.setItem("gizual-app.settings", JSON.stringify(this.settings));
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
