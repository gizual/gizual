import previewFileLines from "@app/assets/previews/preview-file-lines.png";
import { useSettingsController } from "@app/controllers";
import { Button } from "@app/primitives/button";
import { ColorPicker } from "@app/primitives/color-picker";
import sharedStyle from "@app/primitives/css/shared-styles.module.scss";
import { useLocalQuery, useWindowSize } from "@app/utils";
import { Stepper, StepperStepProps } from "@mantine/core";
import clsx from "clsx";
import React from "react";
import { match } from "ts-pattern";

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

const NUM_STEPS = 4;

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

export type TypePlaceholderModalProps = {
  closeModal: () => void;
};

const MIN_WIDTH_COLUMN = 1200;

export const TypePlaceholderModal = React.memo(({ closeModal }: TypePlaceholderModalProps) => {
  const settingsController = useSettingsController();
  const { localQuery, updateLocalQuery, publishLocalQuery, resetLocalQuery } = useLocalQuery();
  const [step, setStep] = React.useState(0);

  const selectedType = getTypeEntry(localQuery);
  const selectedStyle = getStyleEntry(localQuery);
  const selectedColors = getColorsEntry(localQuery);
  const [width, height] = useWindowSize();

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
    selectedColors && selectedColors.length > 0
      ? selectedColors
      : [
          settingsController.settings.visualizationSettings.colors.old.defaultValue,
          settingsController.settings.visualizationSettings.colors.new.defaultValue,
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
            paletteByAuthor: [],
          },
        });
      });
  };

  const setSelectedColors = (colors: string[]) => {
    match(selectedStyle)
      .with("gradient-age", () => {
        updateLocalQuery({
          preset: {
            gradientByAge: colors,
          },
        });
      })
      .with("palette-author", () => {
        updateLocalQuery({
          preset: {
            paletteByAuthor: colors,
          },
        });
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
      title: "Customize Colors",
      children: (
        <StepperItem currentStep={step} hasButtons={false}>
          <ColorCustomization
            selectedType={selectedType}
            selectedStyle={selectedStyle}
            selectedColors={selectedColors}
            onChange={setSelectedColors}
          />
        </StepperItem>
      ),
    },
    {
      title: "Review",
      children: (
        <StepperItem currentStep={step} hasButtons={false}>
          <FinalizeChangesBlock
            selectedType={selectedType}
            selectedStyle={selectedStyle}
            selectedColors={selectedColors}
          />
        </StepperItem>
      ),
    },
  ];

  return (
    <div className={style.TypeDialog}>
      <Stepper
        active={step}
        className={style.TypeSteps}
        orientation="horizontal"
        onStepClick={(n) => setStep(n)}
      >
        {stepItems.map((s, index) => (
          <Stepper.Step key={s.title} label={`Step ${index + 1}`} description={s.title}>
            <div
              className={style.TypeDialogStep}
              style={{ flexDirection: width > MIN_WIDTH_COLUMN ? "row" : "column" }}
            >
              <div className={style.TypeDialog__Left}>{s.children}</div>
              <div className={style.VerticalRuler} />
              <div className={style.TypeDialog__Right}>
                Preview:
                <img
                  className={style.TypeDialogGridItemImage}
                  alt={"Preview image"}
                  src={previewFileLines}
                />
              </div>
            </div>
          </Stepper.Step>
        ))}
      </Stepper>
      <StepItemButtons
        currentStep={step}
        onPrevious={onPreviousStep}
        onNext={onNextStep}
        previousButtonDisabled={step === 0}
      />
    </div>
  );
});

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

export type RadioGridItemProps<T> = {
  value: T;
  checked: boolean;
  onChange: (value: T) => void;
  title: string;
  description: string;
  inputName?: string;
};

export function RadioGridItemComponent<T>({
  value,
  checked,
  onChange,
  title,
  description,
  inputName,
}: RadioGridItemProps<T>) {
  return (
    <label className={style.TypeDialogGridItem}>
      <input
        type="radio"
        name={inputName ?? "type"}
        checked={checked}
        onChange={() => onChange(value)}
        onClick={() => onChange(value)}
      />
      <div className={style.TypeDialogGridItemTile}>
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
      />

      <RadioGridItem<Type>
        value="author-contributions"
        onChange={onChange}
        title="Author Contributions"
        checked={type === "author-contributions"}
        description="Displays the individual contributions of each author."
      />

      <RadioGridItem<Type>
        value="file-lines"
        onChange={onChange}
        title="File Lines"
        checked={type === "file-lines"}
        description="Displays each file line by line."
      />

      <RadioGridItem<Type>
        value="file-mosaic"
        onChange={onChange}
        title="File Mosaic"
        checked={type === "file-mosaic"}
        description="Displays each file in a mosaic."
      />

      <RadioGridItem<Type>
        value="file-bar"
        onChange={onChange}
        title="File Bar"
        checked={type === "file-bar"}
        description="Displays each file as a stacked bar."
      />

      <RadioGridItem<Type>
        value="author-bar"
        onChange={onChange}
        title="Author Bar"
        checked={type === "author-bar"}
        description="Displays each author as a stacked bar."
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
          .with("file-lines", () => (
            <div className={style.TypeDialogGrid}>
              {DefaultStyles.map((s) => (
                <RadioGridItem<Style>
                  key={s}
                  checked={s === selectedStyle}
                  value={s}
                  title={StyleRadioTitle[s]}
                  description={StyleRadioDescriptions[s]}
                  onChange={onRadioChange}
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

export const ColorCustomization = React.memo(
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
              <p className={sharedStyle["Text-Base"]}>Color {index + 1}:</p>
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
