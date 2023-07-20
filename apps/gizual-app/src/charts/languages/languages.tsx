import { FileTreeNode } from "@app/types";
import { VictoryAxis, VictoryBar, VictoryPie } from "victory";
import { VictoryChart } from "victory-chart";

import { victoryTheme } from "../theme";

type LanguageInfo = {
  language?: string;
  percentage?: number;
};

type LanguagesProps = {
  languages?: LanguageInfo[];
  chartType?: "pie" | "bar";
};

export function parseLanguages(fileTree: FileTreeNode) {
  const languages = new Map<string, number>();
  let numFiles = 0;

  function walk(file: FileTreeNode) {
    if (file.children) {
      for (const child of file.children) {
        walk(child);
      }
    } else {
      numFiles += 1;
      const language = file.mime_type;
      if (language) {
        const count = languages.get(language) || 0;
        languages.set(language, count + 1);
      }
    }
  }

  walk(fileTree);

  const languageInfos: LanguageInfo[] = [];
  for (const [language, count] of languages.entries()) {
    languageInfos.push({
      language,
      percentage: count / numFiles,
    });
  }

  return languageInfos;
}

function prepareData(languages: LanguageInfo[]) {
  const data: any[] = [];
  for (const language of languages) {
    data.push({ x: language.language, y: language.percentage });
  }

  return data;
}

const colorScale = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd"];

function* getNextColor(colorScale: string[]) {
  let i = 0;
  while (true) {
    yield colorScale[i % colorScale.length];
    i += 1;
  }
}

export function Languages({ languages, chartType = "bar" }: LanguagesProps) {
  if (!languages) return <div />;

  const data = prepareData(languages);
  const colorGenerator = getNextColor(colorScale);

  if (chartType === "bar")
    return (
      <VictoryChart theme={victoryTheme} domainPadding={10}>
        <VictoryBar
          data={data}
          style={{
            data: {
              fill: () => colorGenerator.next().value as any,
            },
          }}
        ></VictoryBar>
        <VictoryAxis
          tickValues={[1, 2, 3, 4, 5]}
          style={{ tickLabels: { angle: -45, textAnchor: "end", fontSize: 6 } }}
        />
      </VictoryChart>
    );

  return <VictoryPie theme={victoryTheme} data={data}></VictoryPie>;
}
