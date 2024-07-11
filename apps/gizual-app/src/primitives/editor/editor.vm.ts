import { Dependencies, ViewModel } from "@app/services/view-model";
import { VisualizationConfig } from "@app/types";
import { action, makeObservable, observable, runInAction } from "mobx";
import * as monaco from "monaco-editor";

import { ColorManager } from "@giz/color-manager";
import { type FileLinesContext, RenderType } from "@giz/file-renderer";
import { createLogger, Logger } from "@giz/logging";
import { BlameWithAuthors, CommitInfoWithAuthor } from "@giz/maestro";
import { GizDate } from "@giz/utils/gizdate";

type CommitCtx = {
  color?: string;
  authorName?: string;
  authorEmail?: string;
  timestamp?: Date;
};

class EditorViewModel extends ViewModel {
  id = "editor";

  @observable private _contentLoading = false;
  @observable private _fileContent?: string;
  @observable private _filePath?: string;
  @observable private _modalState: "open" | "closed" = "closed";
  @observable private _monacoEditor?: monaco.editor.IStandaloneCodeEditor;

  colorManager: ColorManager | undefined;
  logger: Logger = createLogger("EditorViewModel");
  styleElement: HTMLStyleElement | undefined = undefined;

  constructor({ mainController }: Dependencies, ...args: any[]) {
    super({ mainController }, ...args);

    makeObservable(this, undefined);
  }

  @action.bound
  setFileContent(fileContent: string) {
    this._fileContent = fileContent;
  }

  @action.bound
  openModal() {
    this._modalState = "open";
  }

  @action.bound
  closeModal() {
    this._modalState = "closed";
  }

  @action.bound
  setModalState(isOpen: boolean) {
    this._modalState = isOpen ? "open" : "closed";
  }

  @action.bound
  loadFileContent(path: string) {
    this._contentLoading = true;
    this._filePath = path;
    this.openModal();
    this._mainController._maestro.getFileContent(path).then((fc) => {
      runInAction(() => {
        this.setFileContent(fc);
        this._contentLoading = false;
      });
    });
  }

  @action.bound
  async parseBlame(fb: BlameWithAuthors) {
    const lines = parseLines(fb);
    const commitCtx = new Map<string, CommitCtx>();
    const range = await this._mainController._maestro.getRange();
    const csd = await this._mainController._maestro.getColorSetDefinition();
    this.colorManager = new ColorManager(csd);

    const selectedStartDate = range.since.date;
    const selectedEndDate = range.until.date;
    const preferredColorScheme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
    let coloringMode: "age" | "author" = "age";

    const visualizationConfig: VisualizationConfig = {
      colors: {
        newest: this._mainController.settingsController.visualizationSettings.colors.new.value,
        oldest: this._mainController.settingsController.visualizationSettings.colors.old.value,
      },
      style: {
        lineLength: "full",
      },
      preferredColorScheme,
    };

    const query = this._mainController.localQueryManager?.localQuery;
    if (query && query.preset && "gradientByAge" in query.preset) {
      visualizationConfig.colors.oldest = query.preset.gradientByAge[0];
      visualizationConfig.colors.newest = query.preset.gradientByAge[1];
    } else if (query && query.preset && "paletteByAuthor" in query.preset) {
      coloringMode = "author";
    }

    for (const l of lines) {
      const commitId = l.commit?.commitId;
      const ctx: Partial<FileLinesContext> = {
        type: RenderType.FileLines,
        earliestTimestamp: selectedStartDate.getTime() / 1000,
        latestTimestamp: selectedEndDate.getTime() / 1000,
        selectedStartDate,
        selectedEndDate,
        coloringMode,
        visualizationConfig,
        colorDefinition: csd,
      };

      const color = this.colorManager.interpolateColor(ctx as FileLinesContext, l);

      commitCtx.set(commitId ?? "UNDEFINED", {
        color,
        authorName: l.commit?.authorName ?? "Unknown Author",
        authorEmail: l.commit?.authorEmail ?? "<unknown email>",
        timestamp: new GizDate(+(l.commit?.timestamp ?? 0) * 1000),
      });
    }

    this.createCSS(commitCtx);
    this.applyLineDecorations(lines);
  }

  createCSS(commitColors: Map<string, CommitCtx>) {
    this.cleanupOldCSS();
    const style = document.createElement("style");
    style.type = "text/css";
    let css = "";

    for (const [commitId, commitCtx] of commitColors) {
      css += `.monaco-decorator_commit-${commitId} { background: ${
        commitCtx.color ?? "black"
      }; width: 10px !important; margin-left: 0px }\n`;
    }

    style.append(document.createTextNode(css));
    document.head.append(style);
    this.styleElement = style;
  }

  cleanupOldCSS() {
    if (this.styleElement) {
      this.styleElement.remove();
      this.styleElement = undefined;
    }
  }

  @action.bound
  setEditorInstance(i: monaco.editor.IStandaloneCodeEditor) {
    this._monacoEditor = i;

    this._mainController._maestro.getFileBlameWithAuthors(this._filePath!).then((fb) => {
      runInAction(() => {
        this.parseBlame(fb);
      });
    });
  }

  @action.bound
  applyLineDecorations(lines: Line[]) {
    const _decorations = this._monacoEditor?.createDecorationsCollection(
      lines.map((l, index) => {
        return {
          range: new monaco.Range(index + 1, 1, index + 1, 1),
          options: {
            isWholeLine: true,
            glyphMarginClassName: `monaco-decorator_commit-${l.commit?.commitId}`,
            glyphMarginHoverMessage: {
              value: `
## ${l.commit?.authorName} 
${new GizDate(+(l.commit?.timestamp ?? 0) * 1000).toDisplayString()}

\`${l.commit?.authorEmail}\``,
              isTrusted: true,
              supportHtml: true,
            },
          },
        };
      }),
    );
  }

  get fileContent() {
    return this._fileContent;
  }

  get modalState() {
    return this._modalState;
  }

  get contentLoading() {
    return this._contentLoading;
  }

  get title() {
    return this._filePath;
  }
}

export type Line = {
  content: string;
  commit?: CommitInfoWithAuthor;
  color?: string;
};

function parseLines(blame: BlameWithAuthors) {
  let lenMax = 0;
  const lines: Line[] = blame.lines.map((l) => {
    const commit = blame.commits[l.commitId];

    lenMax = Math.max(l.content.length, lenMax);
    return {
      content: l.content,
      commit,
    };
  });

  return lines;
}

export { EditorViewModel };
