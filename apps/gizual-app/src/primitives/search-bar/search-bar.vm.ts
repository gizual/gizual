import { DATE_FORMAT, getDaysBetweenAbs, GizDate, logAllMethods } from "@app/utils";
import { EditorState } from "@codemirror/state";
import { EditorView, ViewUpdate } from "@codemirror/view";
import { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import dayjs from "dayjs";
import { makeAutoObservable, observable } from "mobx";
import React from "react";

import { MainController } from "../../controllers";

export const TAG_PREFIX = "-";

export const AvailableTagIds = ["file", "author", "start", "end"] as const;
export type AvailableTagId = (typeof AvailableTagIds)[number];
export const AvailableTagIdsForRegexp = AvailableTagIds.join("|");

export type Tag = {
  id: AvailableTagId;
  hint: string;
};

export type SelectedTag = {
  tag: Tag;
  value: string;
};

export const AvailableTags: Record<AvailableTagId, Tag> = {
  file: {
    id: "file",
    hint: "Apply the search to a specific file.",
  },
  author: {
    id: "author",
    hint: "Apply the search to a specific author.",
  },
  start: {
    id: "start",
    hint: "Start searching from a specific date.",
  },
  end: {
    id: "end",
    hint: "Stop searching at a specific commit.",
  },
};

@logAllMethods("SearchBar", "#a5cdd8")
export class SearchBarViewModel {
  _searchBarRef: React.RefObject<ReactCodeMirrorRef> | undefined;
  _editorView?: EditorView;
  _editorState?: EditorState;
  _mainController: MainController;
  _searchString = "";
  _tags: SelectedTag[] = [];
  _popoverOpen = false;
  _cursorPosition = 0;

  _state = observable({
    filesQuery: [] as string[],
  });

  constructor(mainController: MainController) {
    this._searchBarRef = undefined;
    this._mainController = mainController;
    this._mainController.vmController.setSearchBarViewModel(this);

    makeAutoObservable(this, {}, { autoBind: true });
  }

  assignSearchBarRef(ref: React.RefObject<ReactCodeMirrorRef>) {
    this._searchBarRef = ref;
  }

  onSearchBarFocus() {
    this._popoverOpen = true;
  }

  onCreateEditor(view: EditorView, state: EditorState) {
    this._editorView = view;
    this._editorState = state;
  }

  onSearchBarBlur(e: React.FocusEvent<HTMLDivElement, Element>): void {}

  get searchInput() {
    return this._searchString;
  }

  onSearchInput(value: string, viewUpdate: ViewUpdate) {
    this._searchString = value;
    this._cursorPosition = viewUpdate.state.selection.main.head;
  }

  onSearchUpdate(viewUpdate: ViewUpdate) {
    this._cursorPosition = viewUpdate.state.selection.main.head;
    //this._editorState = viewUpdate.state;
    //if (this._queuedFocusEnd) this.focusEnd();
  }

  parseTags(text: string) {
    const tagsWithValues: SelectedTag[] = [];
    const tagRegex = new RegExp(`${TAG_PREFIX}(${AvailableTagIdsForRegexp}):([^\\s]*)`, "g");
    let match;
    while ((match = tagRegex.exec(text)) !== null) {
      const [, tagId, value] = match;
      const tag = AvailableTags[tagId as AvailableTagId];
      if (tag) {
        tagsWithValues.push({ tag, value });
      }
    }
    return tagsWithValues;
  }

  evaluateTags() {
    this._tags = this.parseTags(this._searchString);
    for (const tag of this._tags) {
      if (tag.tag.id === "start") {
        // If the user deletes the entire `start` tag from the selection, we want the default selection
        // to apply, even if it's not explicitly specified. Thus, we need to evaluate the validity of the
        // tags value before assigning it here.
        const dayjsDate = dayjs(tag.value, DATE_FORMAT);

        this._mainController.vmController.timelineViewModel?.setSelectedStartDate(
          dayjsDate.isValid() ? new GizDate(dayjsDate.toDate()) : undefined,
        );
      }

      if (tag.tag.id === "end") {
        // If the user deletes the entire `end` tag from the selection, we want the default selection
        // to apply, even if it's not explicitly specified. Thus, we need to evaluate the validity of the
        // tags value before assigning it here.
        const dayjsDate = dayjs(tag.value, DATE_FORMAT);

        const date = dayjsDate.isValid()
          ? new GizDate(dayjsDate.toDate())
          : this._mainController.vmController.timelineViewModel?.defaultEndDate ?? new GizDate();

        const numSelectedDays = getDaysBetweenAbs(
          this._mainController.vmController.timelineViewModel!.selectedStartDate,
          date,
        );

        // The amount of days to display at the left and right of the selection.
        const datePadding = Math.floor(numSelectedDays / 10);

        this._mainController.vmController.timelineViewModel?.setStartDate(
          date.subtractDays(numSelectedDays + datePadding),
        );
        this._mainController.vmController.timelineViewModel?.setEndDate(date.addDays(datePadding));

        this._mainController.vmController.timelineViewModel?.setSelectedEndDate(date);
      }
    }
  }

  updateTag(tagId: AvailableTagId, newValue: string) {
    const tagIndex = this._tags.findIndex((tag) => tag.tag.id === tagId);

    if (tagIndex === -1) {
      this.appendTag(AvailableTags[tagId], newValue);
    } else {
      this._tags[tagIndex].value = newValue;
    }

    this.syncSearchString();
  }

  syncSearchString() {
    // Rebuild this._searchString based on this._tags
    this._searchString =
      this._tags.map((tag) => `${TAG_PREFIX}${tag.tag.id}:${tag.value}`).join(" ") + " ";
  }

  appendTag(tag: Tag, value = "") {
    this._searchString = this._searchString.trim() + ` ${TAG_PREFIX}${tag.id}:${value}`;
    this._searchString = this._searchString.trim();
    this._cursorPosition = this._searchString.length;
    this._tags.push({ tag, value });
  }

  focusEnd() {
    this._editorView?.focus();
    this._editorView?.dispatch({
      selection: {
        anchor: this._editorState?.doc.length ?? 0,
        head: this._editorState?.doc.length ?? 0,
      },
    });
  }

  appendText(text: string) {
    this._searchString = this._searchString.trim() + text;
  }

  clear() {
    this._tags.length = 0;
    this._searchString = "";
  }

  removeTag(tag: SelectedTag) {
    this._tags = this._tags.filter((t) => t.tag.id !== tag.tag.id);
    this.syncSearchString();
  }

  get currentPendingTag() {
    const editor = this._searchBarRef?.current?.editor;
    if (!editor) return;

    const textBeforeCursor = this._searchString.slice(0, this._cursorPosition);

    if (textBeforeCursor.at(-1) === " ") return;
    const words = textBeforeCursor.trim().split(/\s+/);

    if (words.length === 0) {
      return;
    }

    const lastWord = words.at(-1);
    if (!lastWord) return;

    if (!lastWord.includes(":")) {
      return;
    }

    const tagsWithValues = this.parseTags(textBeforeCursor);
    return tagsWithValues.at(-1);
  }
  get tags() {
    return this._tags;
  }

  get isPopoverOpen() {
    return this._popoverOpen;
  }

  closePopover() {
    this._popoverOpen = false;
  }

  search() {
    this._searchString = this._searchString.trim();
    this.evaluateTags();
    this.closePopover();
  }
}
