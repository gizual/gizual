import { useSettingsController } from "@app/controllers";
import { AuthorTable } from "@app/primitives/author-panel";
import { Button } from "@app/primitives/button";
import { ColorPicker } from "@app/primitives/color-picker";
import sharedStyle from "@app/primitives/css/shared-styles.module.scss";
import { useLocalQuery } from "@app/services/local-query";
import { Stepper, StepperStepProps } from "@mantine/core";
import clsx from "clsx";
import { observer } from "mobx-react-lite";
import React from "react";
import { match, Pattern } from "ts-pattern";

import { ColorManager, getColorScale } from "@giz/color-manager";
import { useAuthorList } from "@giz/maestro/react";
import { SearchQueryType } from "@giz/query";
import style from "../modules.module.scss";

const AvailableTypes = [
  "author-mosaic",
  "author-contributions",
  "file-lines",
  "file-mosaic",
  "file-bar",
  "author-bar",
] as const;
type Type = (typeof AvailableTypes)[number];

const DefaultStyles = ["gradient-age", "palette-author"] as const;
type Style = (typeof DefaultStyles)[number];

const StyleRadioTitle = {
  "gradient-age": "Gradient by age",
  "palette-author": "Palette by author",
};

const StyleRadioDescriptions = {
  "gradient-age": "Colors are assigned based on the age of the file.",
  "palette-author": "Colors are assigned based on the author of the file.",
};

const NUM_STEPS = 3;

function getTypeEntry(query: SearchQueryType) {
  if (query && query.type) return query.type;
}

function getStyleEntry(query: SearchQueryType) {
  if (query && query.preset) {
    if ("gradientByAge" in query.preset) return "gradient-age";
    if ("paletteByAuthor" in query.preset) return "palette-author";
  }
}

function getColorsEntry(query: SearchQueryType) {
  if (query && query.preset) {
    if ("gradientByAge" in query.preset) return query.preset.gradientByAge;
    if ("paletteByAuthor" in query.preset) return query.preset.paletteByAuthor;
  }
}

type TypePlaceholderModalProps = {
  closeModal: () => void;
};

const TypePlaceholderModal = observer(({ closeModal }: TypePlaceholderModalProps) => {
  const settingsController = useSettingsController();
  const { localQuery, updateLocalQuery, publishLocalQuery, resetLocalQuery } = useLocalQuery();
  const [step, setStep] = React.useState(0);

  const selectedType = getTypeEntry(localQuery);
  const selectedStyle = getStyleEntry(localQuery);

  const gradientColors = (
    selectedStyle === "gradient-age" ? getColorsEntry(localQuery) : []
  ) as string[];

  const authorColors = (selectedStyle === "palette-author" ? getColorsEntry(localQuery) : []) as [
    string,
    string,
  ][];

  const onNextStep = () => {
    if (step === NUM_STEPS - 1) {
      onApply();
      return;
    }

    setStep(step + 1);
  };

  const onPreviousStep = () => {
    if (step === NUM_STEPS - 1) {
      onDiscard();
      return;
    }

    setStep(step - 1);
  };

  const colorsWithFallback =
    gradientColors && gradientColors.length > 0
      ? gradientColors
      : [
          settingsController.settings.visualizationSettings.colors.old.value,
          settingsController.settings.visualizationSettings.colors.new.value,
        ];

  const setSelectedType = (type: Type) => {
    updateLocalQuery({ type: type });
  };

  const setSelectedStyle = (style: Style) => {
    match(style)
      .with("gradient-age", () => {
        updateLocalQuery({
          preset: {
            gradientByAge: colorsWithFallback,
          },
        });
      })
      .with("palette-author", () => {
        updateLocalQuery({
          preset: {
            paletteByAuthor: authorColors,
          },
        });
      });
  };

  const setGradientColors = (colors: string[]) => {
    updateLocalQuery({
      preset: {
        gradientByAge: colors,
      },
    });
  };

  const setAuthorColors = (colors: [string, string][]) => {
    updateLocalQuery({
      preset: {
        paletteByAuthor: colors,
      },
    });
  };

  const onApply = () => {
    publishLocalQuery();
    closeModal();
  };

  const onDiscard = () => {
    resetLocalQuery();
    setStep(0);
    closeModal();
  };

  const stepItems: StepperStepProps[] = [
    {
      title: "Select Visualization Type",
      children: (
        <StepperItem currentStep={step} hasButtons={false}>
          <TypeSelectionGrid type={selectedType} onChange={setSelectedType} />
        </StepperItem>
      ),
    },
    {
      title: "Select Default Style",
      children: (
        <StepperItem
          currentStep={step}
          nextButtonDisabled={selectedStyle === undefined}
          hasButtons={false}
        >
          <DefaultStyleSelect
            selectedType={selectedType}
            selectedStyle={selectedStyle}
            onChange={setSelectedStyle}
          />
        </StepperItem>
      ),
    },
    {
      title: "Customize",
      children: (
        <StepperItem currentStep={step} hasButtons={false}>
          {selectedStyle === "gradient-age" && (
            <GradientColorCustomization
              selectedType={selectedType}
              selectedStyle={selectedStyle}
              selectedColors={gradientColors}
              onChange={setGradientColors}
            />
          )}
          {selectedStyle === "palette-author" && (
            <AuthorColorCustomization
              selectedType={selectedType}
              selectedStyle={selectedStyle}
              selectedColors={authorColors}
              onChange={setAuthorColors}
            />
          )}
        </StepperItem>
      ),
    },
  ];

  return (
    <div className={style.TypeDialog}>
      <div className={style.TypeDialogSplit}>
        <div className={style.TypeDialog__Left}>
          <Stepper
            active={step}
            className={style.TypeSteps}
            orientation="vertical"
            onStepClick={(n) => setStep(n)}
            styles={{
              root: { width: "100%", cursor: "default" },
              content: { width: "100%", cursor: "default" },
              stepDescription: {
                color: "var(--foreground-primary)",
                paddingTop: 8,
                paddingBottom: 8,
                cursor: "default",
              },
              step: {
                width: "100%",
                cursor: "default",
              },
              stepBody: {
                width: "100%",
                cursor: "default",
              },
            }}
          >
            {stepItems.map((s, index) => (
              <Stepper.Step
                key={s.title}
                label={`Step ${index + 1}: ${s.title}`}
                description={s.children}
                component={"div"}
              />
            ))}
          </Stepper>
        </div>
        <div className={style.VerticalRuler} />
        <div className={style.TypeDialog__Right}>
          Preview:
          <VisTypePreview
            className={style.TypeDialogGridItemImage}
            type={selectedType}
            visStyle={selectedStyle}
            colors={selectedStyle === "gradient-age" ? gradientColors : authorColors}
          />
        </div>
      </div>
      <StepItemButtons
        currentStep={step}
        onPrevious={onPreviousStep}
        onNext={onNextStep}
        previousButtonDisabled={step === 0}
      />
    </div>
  );
});

type VisTypePreviewProps = {
  type?: Type;
  visStyle?: Style;
  colors?: string[] | [string, string][];
} & React.SVGProps<SVGSVGElement>;

function* pickColor(style?: Style, colors?: string[]) {
  if (style === "gradient-age" && (!colors || colors.length < 2)) {
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
      if (style === "gradient-age" && isStringArray(colors))
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

function isStringTupleArray(colors?: string[] | [string, string][]): colors is [string, string][] {
  return (
    colors !== undefined &&
    colors.length > 0 &&
    colors[0].length === 2 &&
    typeof colors[0][0] === "string" &&
    typeof colors[0][1] === "string"
  );
}

const VisTypePreview = ({ type, visStyle, colors, ...svgProps }: VisTypePreviewProps) => {
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
    if (visStyle === "palette-author" && data) {
      for (const a of data.authors) {
        if (isStringTupleArray(colors)) {
          const assignedColor = colors.find((c) => c[0] === a.id);
          if (assignedColor) {
            mergedColors.push(assignedColor[1]);
            continue;
          }
        }
        mergedColors.push(ColorManager.stringToHex(a.color));
      }
    }
    setColorGenerator(
      pickColor(visStyle, visStyle === "gradient-age" ? (colors as string[]) : mergedColors),
    );
  }, [visStyle, colors, data, isLoading]);

  const memoizedColors = React.useMemo(() => {
    if (colorGenerator) {
      return Array.from({ length: LINE_COUNT * MOSAICS }).map(() => colorGenerator.next().value);
    }
  }, [colorGenerator]);

  const memoizedWidths = React.useMemo(() => {
    return Array.from({ length: LINE_COUNT }).map(() => Math.random() * CHAR_COUNT * CHAR_WIDTH);
  }, [colorGenerator]);

  return match(type)
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
};

export type StepItemWithButtonsProps = {
  currentStep: number;
  children: React.ReactNode;
  onNext?: () => void;
  onPrevious?: () => void;
  nextButtonDisabled?: boolean;
  previousButtonDisabled?: boolean;
  hasButtons?: boolean;
};

export const StepperItem = React.memo(
  ({
    currentStep,
    children,
    onNext,
    onPrevious,
    nextButtonDisabled,
    previousButtonDisabled,
    hasButtons = true,
  }: StepItemWithButtonsProps) => {
    return (
      <div
        className={clsx(sharedStyle.FlexColumn, sharedStyle["Gap-2"], sharedStyle.JustifyBetween)}
      >
        {children}
        {hasButtons && (
          <StepItemButtons
            currentStep={currentStep}
            onNext={onNext}
            onPrevious={onPrevious}
            nextButtonDisabled={nextButtonDisabled}
            previousButtonDisabled={previousButtonDisabled}
          />
        )}
      </div>
    );
  },
);

type StepItemButtonsProps = {
  currentStep?: number;
  onNext?: () => void;
  onPrevious?: () => void;
  nextButtonDisabled?: boolean;
  previousButtonDisabled?: boolean;
};

const StepItemButtons = React.memo(
  ({
    currentStep,
    onNext,
    onPrevious,
    nextButtonDisabled,
    previousButtonDisabled,
  }: StepItemButtonsProps) => {
    return (
      <>
        {currentStep !== undefined && (
          <div
            className={clsx(
              sharedStyle.FlexRow,
              sharedStyle["Gap-2"],
              style.TypeDialogActionButtons,
              sharedStyle["JustifyEnd"],
            )}
          >
            {currentStep >= 0 && currentStep < NUM_STEPS && (
              <Button
                size="regular"
                onClick={onPrevious}
                variant="gray"
                disabled={previousButtonDisabled}
              >
                {currentStep === NUM_STEPS - 1 ? "Discard" : "Previous"}
              </Button>
            )}
            {currentStep >= 0 && currentStep < NUM_STEPS && (
              <Button
                size="regular"
                onClick={onNext}
                variant="filled"
                disabled={nextButtonDisabled}
              >
                {currentStep === NUM_STEPS - 1 ? "Apply" : "Next"}
              </Button>
            )}
          </div>
        )}
      </>
    );
  },
);

type RadioGridItemProps<T> = Omit<React.HTMLAttributes<HTMLInputElement>, "onChange" | "value"> & {
  value: T;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: T) => void;
  title: string;
  description: string;
  inputName?: string;
};

export function RadioGridItemComponent<T>({
  value,
  checked,
  disabled,
  onChange,
  title,
  description,
  inputName,
  ...rest
}: RadioGridItemProps<T>) {
  return (
    <label className={style.TypeDialogGridItem}>
      <input
        {...rest}
        type="radio"
        name={inputName ?? "type"}
        checked={checked}
        disabled={disabled}
        onChange={() => onChange(value)}
        onClick={() => onChange(value)}
      />
      <div className={style.TypeDialogGridItemTile} data-disabled={disabled}>
        <div className={style.TypeDialogGridItemContent}>
          <h3 className={style.TypeDialogGridItemTitle}>{title}</h3>
          <p className={style.TypeDialogGridItemDescription}>{description}</p>
        </div>
      </div>
    </label>
  );
}

export const RadioGridItem = React.memo(RadioGridItemComponent) as typeof RadioGridItemComponent;

export type TypeSelectionGridProps = {
  type?: Type;
  onChange: (type: Type) => void;
};

export const TypeSelectionGrid = React.memo(({ type, onChange }: TypeSelectionGridProps) => {
  return (
    <div className={style.TypeDialogGrid}>
      <RadioGridItem<Type>
        value="author-mosaic"
        onChange={onChange}
        title="Author Mosaic"
        checked={type === "author-mosaic"}
        description="Displays authors in a mosaic."
        inputName="type"
        disabled
      />

      <RadioGridItem<Type>
        value="author-contributions"
        onChange={onChange}
        title="Author Contributions"
        checked={type === "author-contributions"}
        description="Displays the individual contributions of each author."
        inputName="type"
        disabled
      />

      <RadioGridItem<Type>
        value="file-lines"
        onChange={onChange}
        title="File Lines"
        checked={type === "file-lines"}
        description="Displays each file line by line."
        inputName="type"
      />

      <RadioGridItem<Type>
        value="file-mosaic"
        onChange={onChange}
        title="File Mosaic"
        checked={type === "file-mosaic"}
        description="Displays each file in a mosaic."
        inputName="type"
      />

      <RadioGridItem<Type>
        value="file-bar"
        onChange={onChange}
        title="File Bar"
        checked={type === "file-bar"}
        description="Displays each file as a stacked bar."
        inputName="type"
        disabled
      />

      <RadioGridItem<Type>
        value="author-bar"
        onChange={onChange}
        title="Author Bar"
        checked={type === "author-bar"}
        description="Displays each author as a stacked bar."
        inputName="type"
        disabled
      />
    </div>
  );
});

export type DefaultStyleSelection = {
  selectedType?: Type;
  onChange: (style: Style) => void;
  selectedStyle?: Style;
};

export const DefaultStyleSelect = React.memo(
  ({ selectedType: type, onChange, selectedStyle }: DefaultStyleSelection) => {
    const onRadioChange = (e: string) => {
      onChange(e as Style);
    };

    return (
      <div className={sharedStyle.FlexColumn}>
        {match(type)
          .with(Pattern.union("file-lines", "file-mosaic"), () => (
            <div className={style.TypeDialogGrid}>
              {DefaultStyles.map((s) => (
                <RadioGridItem<Style>
                  key={s}
                  checked={s === selectedStyle}
                  value={s}
                  title={StyleRadioTitle[s]}
                  description={StyleRadioDescriptions[s]}
                  onChange={onRadioChange}
                  inputName="style"
                />
              ))}
            </div>
          ))
          .otherwise(() => "TODO: No styles available for this type.")}
      </div>
    );
  },
);

export type ColorCustomizationProps = {
  selectedType?: Type;
  selectedStyle?: Style;
  selectedColors?: string[];
  onChange: (colors: string[]) => void;
};

export const GradientColorCustomization = React.memo(
  ({ selectedColors, onChange }: ColorCustomizationProps) => {
    return (
      <div className={clsx(sharedStyle.FlexRow, sharedStyle["Gap-4"])}>
        {selectedColors &&
          selectedColors.length > 0 &&
          selectedColors.map((color, index) => (
            <div
              className={clsx(
                sharedStyle.FlexRow,
                sharedStyle["Gap-1"],
                sharedStyle["Items-Center"],
              )}
              key={index}
            >
              <p className={sharedStyle["Text-Base"]}>
                Color {index === 0 ? "(Start date)" : "(End date)"}:
              </p>
              <ColorPicker
                hexValue={color}
                onAccept={(c) => {
                  selectedColors[index] = c;
                  onChange([...selectedColors]);
                }}
              />
            </div>
          ))}
        {!selectedColors ||
          (selectedColors.length === 0 && (
            <div>Open TODO: This selection does not allow for additional color customization.</div>
          ))}
      </div>
    );
  },
);

export type AuthorColorCustomizationProps = {
  selectedType?: Type;
  selectedStyle?: Style;
  selectedColors: [string, string][];
  onChange: (colors: [string, string][]) => void;
};

export const AuthorColorCustomization = React.memo(({}: AuthorColorCustomizationProps) => {
  return (
    <>
      <div
        className={clsx(sharedStyle.FlexColumn, sharedStyle["Gap-1"])}
        style={{
          justifyContent: "center",
          alignItems: "left",
        }}
      >
        <AuthorTable id="vis-type-modal-authors" noPublish />
      </div>
    </>
  );
});

export type FinalizeChangesBlockProps = {
  selectedType?: Type;
  selectedStyle?: Style;
  selectedColors?: string[];
};

export const FinalizeChangesBlock = React.memo(
  ({ selectedType, selectedStyle, selectedColors }: FinalizeChangesBlockProps) => {
    return (
      <div className={clsx(sharedStyle.FlexColumn, sharedStyle["Gap-2"])}>
        <div className={clsx(sharedStyle.FlexColumn, sharedStyle["Gap-1"])}>
          <p className={clsx(sharedStyle["Text-Medium"], sharedStyle["Text-Left"])}>
            Selected type:{" "}
            <span className={clsx(sharedStyle["Text-Normal"], sharedStyle["Text-Accent"])}>
              {selectedType}
            </span>
          </p>

          <p className={clsx(sharedStyle["Text-Medium"], sharedStyle["Text-Left"])}>
            Selected default style:{" "}
            <span className={clsx(sharedStyle["Text-Normal"], sharedStyle["Text-Accent"])}>
              {selectedStyle}
            </span>
          </p>

          <p className={clsx(sharedStyle["Text-Medium"], sharedStyle["Text-Left"])}>
            Selected colors:{" "}
            <span className={clsx(sharedStyle["Text-Normal"], sharedStyle["Text-Accent"])}>
              {selectedColors?.join(", ")}
            </span>
          </p>
        </div>
      </div>
    );
  },
);

export { TypePlaceholderModal };
