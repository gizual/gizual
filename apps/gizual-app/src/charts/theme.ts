import { VictoryThemeDefinition } from "victory";
import { VictoryTheme } from "victory-core";

function deepMerge(obj1: Record<string, any>, obj2: Record<string, any>): Record<string, any> {
  const output: Record<string, any> = { ...obj1 };
  for (const key in obj2) {
    if (Object.prototype.hasOwnProperty.call(obj2, key)) {
      output[key] =
        obj1[key] && typeof obj2[key] === "object" ? deepMerge(obj1[key], obj2[key]) : obj2[key];
    }
  }
  return output;
}

const themeOverride: Partial<VictoryThemeDefinition> = {
  axis: {
    style: {
      tickLabels: {
        fill: "var(--foreground-primary)",
      },
      grid: {
        stroke: "var(--border-primary)",
      },
      axis: {
        stroke: "var(--border-secondary)",
      },
    },
  },
  line: {
    style: {
      data: {
        stroke: "var(--accent-main)",
      },
    },
  },
};

export const victoryTheme = deepMerge(VictoryTheme.material, themeOverride);
