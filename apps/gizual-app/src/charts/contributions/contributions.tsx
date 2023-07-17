import { VictoryLine } from "victory-line";
import { VictoryChart } from "victory-chart";
import { victoryTheme } from "../theme";

type ContributionEntry = {
  author: string;
  contributions: string[];
};

type AllContributionsProps = {
  contributions?: ContributionEntry[];
};

// Aggregate contributions with the same date and sum them properly
function prepareData(contributions: ContributionEntry[]) {
  const contributionsPerDay: Map<string, number> = new Map();

  for (const contribution of contributions) {
    for (const date of contribution.contributions) {
      if (!contributionsPerDay.has(date)) {
        contributionsPerDay.set(date, 0);
      }

      contributionsPerDay.set(date, contributionsPerDay.get(date)! + 1);
    }
  }

  const data: any[] = [];
  for (const [day, num] of contributionsPerDay.entries()) {
    data.push({ x: day, y: num });
  }

  return data;
}

const mockContributions: ContributionEntry[] = [
  { author: "Andreas", contributions: ["2020-01-01", "2020-01-02", "2020-01-03", "2020-05-01"] },
  { author: "Stefan", contributions: ["2020-01-02", "2020-01-02", "2020-01-03"] },
];

export function AllContributions({ contributions }: AllContributionsProps) {
  if (!contributions) contributions = mockContributions;

  const data = prepareData(contributions);

  return (
    <VictoryChart theme={victoryTheme}>
      <VictoryLine data={data} />
    </VictoryChart>
  );
}

type AuthorContributionsProps = ContributionEntry & {};

export function AuthorContributions({ contributions }: AuthorContributionsProps) {}
