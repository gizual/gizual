import { IconSettingsOutline } from "@app/assets";
import previewFileLines from "@app/assets/previews/preview-file-lines.png";
import { useSettingsController } from "@app/controllers";
import { Button } from "@app/primitives/button";
import sharedStyle from "@app/primitives/css/shared-styles.module.scss";
import { DialogProvider } from "@app/primitives/dialog-provider";
import { useLocalQuery } from "@app/utils";
import { ColorPicker, Radio, RadioChangeEvent, StepProps, Steps } from "antd";
import clsx from "clsx";
import React from "react";
import { match } from "ts-pattern";

import { SearchQueryType } from "@giz/query";
import { PlaceholderQueryModule } from "../base-query-module";
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

export function TypePlaceholderModule() {
  const settingsController = useSettingsController();
  const { localQuery, updateLocalQuery, publishLocalQuery, resetLocalQuery } = useLocalQuery();
  const [step, setStep] = React.useState(0);
  const [isOpen, setIsOpen] = React.useState(false);

  const selectedType = getTypeEntry(localQuery);
  const selectedStyle = getStyleEntry(localQuery);
  const selectedColors = getColorsEntry(localQuery);

  const onNextStep = () => {
    setStep(step + 1);
  };

  const onPreviousStep = () => {
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
    setStep(1);
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
    setIsOpen(false);
  };

  const onDiscard = () => {
    setStep(0);
    resetLocalQuery();
    setIsOpen(false);
  };

  const stepItems: StepProps[] = [
    {
      title: "Select a new render-type",
      description: (
        <StepItemWithButtons step={0} currentStep={step} maxSteps={4} onNext={onNextStep}>
          <TypeSelectionGrid type={selectedType} onChange={setSelectedType} />
        </StepItemWithButtons>
      ),
    },
    {
      title: "Select a default style",
      description: (
        <StepItemWithButtons
          step={1}
          currentStep={step}
          maxSteps={4}
          onNext={onNextStep}
          onPrevious={onPreviousStep}
          nextButtonDisabled={selectedStyle === undefined}
        >
          <DefaultStyleSelect
            selectedType={selectedType}
            selectedStyle={selectedStyle}
            onChange={setSelectedStyle}
          />
        </StepItemWithButtons>
      ),
    },
    {
      title: "Customize the colors",
      description: (
        <StepItemWithButtons
          step={2}
          currentStep={step}
          maxSteps={4}
          onNext={onNextStep}
          onPrevious={onPreviousStep}
        >
          <ColorCustomization
            selectedType={selectedType}
            selectedStyle={selectedStyle}
            selectedColors={selectedColors}
            onChange={setSelectedColors}
          />
        </StepItemWithButtons>
      ),
    },
    {
      title: "Review and apply",
      description: (
        <StepItemWithButtons step={3} currentStep={step} maxSteps={4} onPrevious={onPreviousStep}>
          <FinalizeChangesBlock
            selectedType={selectedType}
            selectedStyle={selectedStyle}
            selectedColors={selectedColors}
            showButtons={step === 3}
            onApply={onApply}
            onDiscard={onDiscard}
          />
        </StepItemWithButtons>
      ),
    },
  ];

  return (
    <DialogProvider
      trigger={
        <PlaceholderQueryModule
          icon={<IconSettingsOutline />}
          title={"Choose a render-type"}
          accentColor="#237600"
          onClick={() => {
            setIsOpen(true);
          }}
        />
      }
      title="Choose a render-type"
      triggerClassName={style.PlaceholderQueryModuleTrigger}
      isOpen={isOpen}
      setIsOpen={setIsOpen}
    >
      <div className={style.TypeDialog}>
        <Steps
          direction="vertical"
          current={step}
          size="small"
          items={stepItems}
          className={style.TypeSteps}
        />
      </div>
    </DialogProvider>
  );
}

export type StepItemWithButtonsProps = {
  step: number;
  currentStep: number;
  maxSteps: number;
  children: React.ReactNode;
  onNext?: () => void;
  onPrevious?: () => void;
  nextButtonDisabled?: boolean;
  previousButtonDisabled?: boolean;
};

export function StepItemWithButtons({
  step,
  currentStep,
  maxSteps,
  children,
  onNext,
  onPrevious,
  nextButtonDisabled,
  previousButtonDisabled,
}: StepItemWithButtonsProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (currentStep === step && ref.current) {
      // Get the top level element for that step item, so the title is also in view.
      ref.current.parentElement?.parentElement &&
        ref.current.parentElement.parentElement.scrollIntoView({ behavior: "smooth" });
    }
  }, [currentStep]);

  if (currentStep < step) return <></>;

  return (
    <div className={clsx(sharedStyle.FlexColumn, sharedStyle["Gap-2"])} ref={ref}>
      {children}
      {step === currentStep && (
        <div className={clsx(sharedStyle.FlexRow, sharedStyle["Gap-2"])}>
          {step > 0 && step < maxSteps - 1 && (
            <Button size="regular" onClick={onNext} variant="filled" disabled={nextButtonDisabled}>
              Next
            </Button>
          )}
          {step > 0 && step < maxSteps - 1 && (
            <Button
              size="regular"
              onClick={onPrevious}
              variant="gray"
              disabled={previousButtonDisabled}
            >
              Previous
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export type TypeSelectionGridItemProps = {
  type: Type;
  checked: boolean;
  onChange: (type: Type) => void;
  title: string;
  imageAlt: string;
  description: string;
  imageSrc?: string;
};

export function TypeSelectionGridItem({
  type,
  checked,
  onChange,
  imageSrc,
  imageAlt,
  title,
  description,
}: TypeSelectionGridItemProps) {
  return (
    <label className={style.TypeDialogGridItem}>
      <input
        type="radio"
        name="type"
        checked={checked}
        onChange={() => onChange(type)}
        onClick={() => onChange(type)}
      />
      <div className={style.TypeDialogGridItemTile}>
        <img className={style.TypeDialogGridItemImage} alt={imageAlt} src={imageSrc} />
        <div className={style.TypeDialogGridItemContent}>
          <h3 className={style.TypeDialogGridItemTitle}>{title}</h3>
          <p className={style.TypeDialogGridItemDescription}>{description}</p>
        </div>
      </div>
    </label>
  );
}

export type TypeSelectionGridProps = {
  type?: Type;
  onChange: (type: Type) => void;
};

export function TypeSelectionGrid({ type, onChange }: TypeSelectionGridProps) {
  return (
    <div className={style.TypeDialogGrid}>
      <TypeSelectionGridItem
        type="author-mosaic"
        onChange={onChange}
        title="Author Mosaic"
        checked={type === "author-mosaic"}
        description="Displays authors in a mosaic."
        imageAlt="Demo for type 'author-mosaic'"
      />

      <TypeSelectionGridItem
        type="author-contributions"
        onChange={onChange}
        title="Author Contributions"
        checked={type === "author-contributions"}
        description="Displays the individual contributions of each author."
        imageAlt="Demo for type 'author-contributions'"
      />

      <TypeSelectionGridItem
        type="file-lines"
        onChange={onChange}
        title="File Lines"
        checked={type === "file-lines"}
        description="Displays each file line by line."
        imageAlt="Demo for type 'file-lines'"
        imageSrc={previewFileLines}
      />

      <TypeSelectionGridItem
        type="file-mosaic"
        onChange={onChange}
        title="File Mosaic"
        checked={type === "file-mosaic"}
        description="Displays each file in a mosaic."
        imageAlt="Demo for type 'file-mosaic'"
      />

      <TypeSelectionGridItem
        type="file-bar"
        onChange={onChange}
        title="File Bar"
        checked={type === "file-bar"}
        description="Displays each file as a stacked bar."
        imageAlt="Demo for type 'file-bar'"
      />

      <TypeSelectionGridItem
        type="author-bar"
        onChange={onChange}
        title="Author Bar"
        checked={type === "author-bar"}
        description="Displays each author as a stacked bar."
        imageAlt="Demo for type 'author-bar'"
      />
    </div>
  );
}

export type DefaultStyleSelection = {
  selectedType?: Type;
  onChange: (style: Style) => void;
  selectedStyle?: Style;
};

export function DefaultStyleSelect({
  selectedType: type,
  onChange,
  selectedStyle,
}: DefaultStyleSelection) {
  const onRadioChange = (e: RadioChangeEvent) => {
    onChange(e.target.value);
  };

  return (
    <div className={sharedStyle.FlexColumn}>
      {match(type)
        .with("file-lines", () => (
          <Radio.Group onChange={onRadioChange}>
            {DefaultStyles.map((style) => {
              return (
                <Radio value={style} key={style} checked={style === selectedStyle}>
                  {style}
                </Radio>
              );
            })}
          </Radio.Group>
        ))
        .otherwise(() => "TODO: No styles available for this type.")}
    </div>
  );
}

export type ColorCustomizationProps = {
  selectedType?: Type;
  selectedStyle?: Style;
  selectedColors?: string[];
  onChange: (colors: string[]) => void;
};

export function ColorCustomization({ selectedColors, onChange }: ColorCustomizationProps) {
  return (
    <div className={clsx(sharedStyle.FlexRow, sharedStyle["Gap-4"])}>
      {selectedColors &&
        selectedColors.map((color, index) => (
          <div
            className={clsx(sharedStyle.FlexRow, sharedStyle["Gap-1"], sharedStyle["Items-Center"])}
            key={index}
          >
            <p className={sharedStyle["Text-Base"]}>Color {index + 1}:</p>
            <ColorPicker
              value={color}
              size="small"
              showText
              onChange={(e) => {
                selectedColors[index] = `#${e.toHex(false)}`;
                onChange([...selectedColors]);
              }}
            />
          </div>
        ))}
    </div>
  );
}

export type FinalizeChangesBlockProps = {
  selectedType?: Type;
  selectedStyle?: Style;
  selectedColors?: string[];
  showButtons?: boolean;
  onApply: () => void;
  onDiscard: () => void;
};

export function FinalizeChangesBlock({
  selectedType,
  selectedStyle,
  selectedColors,
  showButtons,
  onApply,
  onDiscard,
}: FinalizeChangesBlockProps) {
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
      {showButtons && (
        <div className={clsx(sharedStyle.FlexRow, sharedStyle["Gap-2"])}>
          <Button variant="filled" size="regular" onClick={onApply}>
            Apply
          </Button>
          <Button variant="gray" size="regular" onClick={onDiscard}>
            Discard
          </Button>
        </div>
      )}
    </div>
  );
}
