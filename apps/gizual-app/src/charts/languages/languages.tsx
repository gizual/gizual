import { VictoryAxis, VictoryBar } from "victory";
import { VictoryChart } from "victory-chart";

import { FileIcon, FileTree, getFileIcon } from "@giz/explorer";
import { victoryTheme } from "../theme";

type LanguageInfo = {
  iconInfo?: FileIcon;
  percentage?: number;
};

type LanguagesProps = {
  languages?: LanguageInfo[];
  chartType?: "pie" | "bar";
};

export function parseLanguages(fileTree: FileTree) {
  const languages = new Map<number, number>();
  let numFiles = 0;

  function walk(file: FileTree) {
    if (file.children) {
      for (const child of file.children) {
        walk(child);
      }
    } else {
      numFiles += 1;
      const kind = file.kind;
      if (kind && kind !== "folder") {
        const count = languages.get(kind) || 0;
        languages.set(kind, count + 1);
      }
    }
  }

  walk(fileTree);

  const languageInfos: LanguageInfo[] = [];
  for (const [kind, count] of languages.entries()) {
    languageInfos.push({
      iconInfo: getFileIcon(kind),
      percentage: count / numFiles,
    });
  }

  return languageInfos;
}

type VictoryDatum = {
  x: string;
  y?: number;
};

function prepareData(languages: LanguageInfo[]): {
  data: VictoryDatum[];
  colors: Map<string, string>;
} {
  const colors: Map<string, string> = new Map();
  const data: VictoryDatum[] = [];

  for (const language of languages) {
    const iconName = language.iconInfo?.icon ?? "-icon";
    const languageString = iconName.slice(0, Math.max(0, iconName.length - 5));
    data.push({ x: languageString, y: language.percentage });
    const color = language.iconInfo?.color[0];
    const simpleColor = color?.slice(color.indexOf("-") + 1);
    colors.set(languageString, simpleColor ?? "red");
  }

  return { data, colors };
}

export function Languages({ languages }: LanguagesProps) {
  if (!languages) return <div />;

  const { data, colors } = prepareData(languages);

  return (
    <VictoryChart theme={victoryTheme} domainPadding={10}>
      <VictoryBar
        data={data}
        style={{
          data: {
            fill: ({ datum }) => colors.get(datum.x) ?? "red",
          },
        }}
      ></VictoryBar>
      <VictoryAxis
        tickValues={[1, 2, 3, 4, 5]}
        style={{ tickLabels: { angle: -45, textAnchor: "end", fontSize: 6 } }}
      />
    </VictoryChart>
  );
}
