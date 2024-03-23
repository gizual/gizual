import { observer } from "mobx-react-lite";
import React from "react";
import { match } from "ts-pattern";

import { ColorManager, getColorScale } from "@giz/color-manager";
import { useAuthorList } from "@giz/maestro/react";
import { PresetQueryKeys } from "@giz/query";
import { VisTypeViewModel } from "../type-modal.vm";

type VisTypePreviewProps = {
  vm: VisTypeViewModel;
} & React.SVGProps<SVGSVGElement>;

function* pickColor(preset?: PresetQueryKeys, colors?: string[]) {
  if (preset === "gradientByAge" && (!colors || colors.length < 2)) {
    yield "#00ded0"; // Fallback color
    return;
  }
  let steps = 0;
  let stepCounter = 0;

  let interpolatedColor = "#00ded0"; // Fallback color
  while (true) {
    if (stepCounter >= steps) {
      // Move to next color
      steps = Math.floor(Math.random() * 15);
      stepCounter = 0;
      if (preset === "gradientByAge" && isStringArray(colors))
        interpolatedColor = getColorScale([1, 100], [colors[0], colors[1]])(Math.random() * 100);
      else if (colors) interpolatedColor = colors[Math.floor(Math.random() * colors.length)];
    }

    stepCounter++;
    yield interpolatedColor;
  }
}

function isStringArray(colors?: string[] | [string, string][]): colors is string[] {
  return colors !== undefined && colors.length > 0 && typeof colors[0] === "string";
}

const VisTypePreview = observer(({ vm, ...svgProps }: VisTypePreviewProps) => {
  const WIDTH = 300;
  const CHAR_COUNT = 100;
  const LINE_HEIGHT = 10;
  const LINE_COUNT = 100;
  const CHAR_WIDTH = WIDTH / CHAR_COUNT;
  const HEIGHT = LINE_HEIGHT * LINE_COUNT;
  const MOSAICS = 10;

  const [colorGenerator, setColorGenerator] = React.useState<Generator | undefined>(undefined);
  const { data, isLoading } = useAuthorList(16, 0);

  React.useEffect(() => {
    const mergedColors: string[] = [];
    if (vm.selectedPreset === "paletteByAuthor" && data) {
      for (const a of data.authors) {
        const assignedColor = vm.queryAuthorColors.find((c) => c[0] === a.id);
        if (assignedColor) {
          mergedColors.push(assignedColor[1]);
          continue;
        }
        mergedColors.push(ColorManager.stringToHex(a.color));
      }
    }
    setColorGenerator(
      pickColor(
        vm.selectedPreset,
        vm.selectedPreset === "gradientByAge" ? vm.queryGradientColorsWithFallback : mergedColors,
      ),
    );
  }, [
    vm.selectedType,
    vm.selectedPreset,
    vm.queryGradientColorsWithFallback,
    vm.queryAuthorColors,
    data,
    isLoading,
  ]);

  const memoizedColors = React.useMemo(() => {
    if (colorGenerator) {
      return Array.from({ length: LINE_COUNT * MOSAICS }).map(() => colorGenerator.next().value);
    }
  }, [colorGenerator]);

  const memoizedWidths = React.useMemo(() => {
    return Array.from({ length: LINE_COUNT }).map(() => Math.random() * CHAR_COUNT * CHAR_WIDTH);
  }, [colorGenerator]);

  return match(vm.selectedType)
    .with("file-lines", () => {
      return (
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} {...svgProps}>
          {Array.from({ length: LINE_COUNT }).map((_, index) => (
            <rect
              key={`${index}`}
              x={0}
              y={index * LINE_HEIGHT}
              width={memoizedWidths?.[index]}
              height={LINE_HEIGHT}
              fill={memoizedColors?.[index] ?? "#00ded0"}
            />
          ))}
        </svg>
      );
    })
    .with("file-mosaic", () => {
      return (
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} {...svgProps}>
          {Array.from({ length: LINE_COUNT }).map((_, lineIndex) =>
            Array.from({ length: MOSAICS }).map((_, mosaicIndex) => (
              <rect
                key={`${lineIndex}-${mosaicIndex}`}
                x={mosaicIndex * (WIDTH / MOSAICS)}
                y={lineIndex * LINE_HEIGHT}
                width={WIDTH / MOSAICS}
                height={HEIGHT}
                fill={memoizedColors?.[lineIndex * MOSAICS + mosaicIndex] ?? "#00ded0"}
                stroke="black"
                strokeWidth="0.3"
              />
            )),
          )}
        </svg>
      );
    })
    .otherwise(() => {
      return <div>TODO: Visualization preview not available for this type.</div>;
    });
});

export { VisTypePreview };
