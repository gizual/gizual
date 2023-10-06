import { DATE_FORMAT, getDaysBetweenAbs, getStringDate, GizDate } from "@app/utils";
import { EditorState } from "@codemirror/state";
import { EditorView, ViewUpdate } from "@codemirror/view";
import { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import dayjs from "dayjs";
import { action, computed, makeObservable, observable } from "mobx";
import React from "react";

import { MainController } from "../../controllers";

import {
  AvailableTagId,
  AvailableTagIdsForRegexp,
  AvailableTags,
  SelectedTag,
  Tag,
  TAG_PREFIX,
} from "./search-tags";

export class SearchBarViewModel {
  @observable _searchBarRef: React.RefObject<ReactCodeMirrorRef> | undefined;
  @observable _editorView?: EditorView;
  @observable _editorState?: EditorState;
  @observable _mainController: MainController;
  @observable _searchString = "";
  @observable _tags: SelectedTag[] = [];
  @observable _popoverOpen = false;
  @observable _cursorPosition = 0;
  @observable _shouldFocusEol = false;
  @observable _usedTags: Tag[] = [];

  // A synthetic blur occurs when the user blurs the search bar by clicking on
  // any of the helper tags / buttons within the popover. On synthetic blurs,
  // we don't want to re-evaluate everything since the user should still be
  // able to keep typing without issues.
  @observable _isSyntheticBlur = false;

  // Synthetic events identify adjustments to the search-bar that are not
  // directly fired by means of a user-event, so they originate from within
  // another component and require a different focus behaviour.
  @observable _isSyntheticEvent = false;

  constructor(mainController: MainController) {
    makeObservable(this, undefined, { autoBind: true });
    this._searchBarRef = undefined;
    this._mainController = mainController;
    this._mainController.vmController.setSearchBarViewModel(this);
  }

  @action.bound
  assignSearchBarRef(ref: React.RefObject<ReactCodeMirrorRef>) {
    this._searchBarRef = ref;
  }

  @action.bound
  onSearchBarFocus() {
    if (this._isSyntheticEvent) return;
    this._popoverOpen = true;
  }

  @action.bound
  onCreateEditor(view: EditorView, state: EditorState) {
    this._editorView = view;
    this._editorState = state;
  }

  @action.bound
  onSearchBarBlur(): void {
    //if (!this._isSyntheticBlur) this.evaluateTags();
  }

  @computed
  get unusedTags() {
    const unusedTags: Tag[] = [];
    for (const tag of Object.values(AvailableTags)) {
      if (this._usedTags.some((t) => t.id === tag.id)) continue;

      unusedTags.push(tag);
    }

    return unusedTags;
  }

  @computed
  get searchInput() {
    return this._searchString;
  }

  @action.bound
  onSearchInput(value: string, viewUpdate: ViewUpdate) {
    this._searchString = value;
    this._cursorPosition = viewUpdate.state.selection.main.head;

    this.updateUnusedTags();
    if (value === "") this._tags = [];
    if (
      this.currentPendingTag &&
      !this.tags.some((t) => t.tag.id === this.currentPendingTag!.tag.id)
    ) {
      this._tags.push({ tag: this.currentPendingTag.tag, value: "" });
    }
  }

  @action.bound
  onSearchUpdate(viewUpdate: ViewUpdate) {
    this._cursorPosition = viewUpdate.state.selection.main.head;
    if (this._isSyntheticEvent) return;
    if (this._isSyntheticBlur) {
      this._isSyntheticBlur = false;
    }

    if (viewUpdate.selectionSet) {
      this._popoverOpen = true;
    }
  }

  @action.bound
  updateUnusedTags() {
    this._usedTags.length = 0;
    const tagRegex = new RegExp(`${TAG_PREFIX}(${AvailableTagIdsForRegexp}):([^\\s]*)`, "g");
    let match;
    while ((match = tagRegex.exec(this.searchInput)) !== null) {
      const [, tagId] = match;
      const tag = AvailableTags[tagId as AvailableTagId];
      if (tag) {
        this._usedTags.push(tag);
      }
    }
  }

  @action.bound
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

  @action.bound
  evaluateTags() {
    this._tags = this.parseTags(this._searchString);
    for (const tag of this._tags) {
      if (tag.tag.id === "range") {
        // If the user deletes the entire `range` tag from the selection, we want the default selection
        // to apply, even if it's not explicitly specified. Thus, we need to evaluate the validity of the
        // tags value before assigning it here.

        const start = tag.value.split("-")[0];
        const startDate = dayjs(start, DATE_FORMAT);

        this._mainController.vmController.timelineViewModel?.setSelectedStartDate(
          startDate.isValid() ? new GizDate(startDate.toDate()) : undefined,
        );

        const end = tag.value.split("-")[1];

        const endDate = dayjs(end, DATE_FORMAT);

        const date = endDate.isValid()
          ? new GizDate(endDate.toDate())
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

  @action.bound
  updateTag(tagId: AvailableTagId, newValue: string, syntheticEvent = false) {
    this._isSyntheticEvent = syntheticEvent;
    const tagIndex = this._tags.findIndex((tag) => tag.tag.id === tagId);

    if (tagIndex === -1) {
      this.appendTag(AvailableTags[tagId], newValue);
    } else {
      this._tags[tagIndex].value = newValue;
    }

    this.rebuildSearchString(true);
    this._isSyntheticEvent = false;
  }

  @action.bound
  updateTagWithCallback(
    tagId: AvailableTagId,
    cb: (value?: string) => string,
    syntheticEvent = false,
  ) {
    this._isSyntheticEvent = syntheticEvent;
    const tagIndex = this._tags.findIndex((tag) => tag.tag.id === tagId);

    if (tagIndex === -1) {
      this.appendTag(AvailableTags[tagId], cb());
    } else {
      this._tags[tagIndex].value = cb(this._tags[tagIndex].value);
    }

    this.rebuildSearchString(true);
    this._isSyntheticEvent = false;
  }

  @action.bound
  rebuildSearchString(retainCursorPos = true) {
    const previousCursorPos = this._cursorPosition;
    const content =
      this._tags.map((tag) => `${TAG_PREFIX}${tag.tag.id}:${tag.value}`).join(" ") + " ";

    this._editorView?.dispatch({
      changes: {
        from: 0,
        to: this._editorView.state.doc.length,
        insert: content,
      },
      selection: {
        anchor: retainCursorPos ? previousCursorPos : content.length,
      },
    });

    if (retainCursorPos) this._editorView?.focus();
    else this.focusEnd(content.length);
  }

  @action.bound
  appendTag(tag: Tag, value = "") {
    this._isSyntheticBlur = true;
    if (this._tags.some((t) => t.tag.id === tag.id)) {
      this.updateTag(tag.id, value);
      return;
    }

    this._cursorPosition = this._searchString.length;
    this._tags.push({ tag, value });

    const tagContent = `${TAG_PREFIX}${tag.id}:${value} `;
    const endPosition = this._cursorPosition + tag.id.length + value.length + 3 - 1;

    this._editorView?.dispatch({
      changes: {
        from: this._cursorPosition,
        insert: tagContent,
      },
      selection: {
        anchor: endPosition,
      },
    });

    this._cursorPosition = endPosition;
    this.focusEnd(endPosition);
  }

  @action.bound
  focusEnd(length: number) {
    // If we're dealing with a synthetic event, we don't want to artificially
    // set the focus here, otherwise we would unintentionally remove focus from
    // another element or open the popover erroneously.
    if (this._isSyntheticEvent) return;

    try {
      this._editorView?.focus();
      this._editorView?.dispatch({
        selection: {
          anchor: length,
        },
      });
    } catch {
      console.error("Could not execute `focusEnd`");
    }
  }

  @action.bound
  appendText(text: string) {
    const newText = this._searchString.trim() + text;
    this._editorView?.dispatch({
      changes: {
        from: 0,
        to: this._editorView.state.doc.length,
        insert: newText,
      },
      selection: {
        anchor: newText.length,
      },
    });
  }

  @action.bound
  clear() {
    this._tags.length = 0;
    this._editorView?.dispatch({
      changes: {
        from: 0,
        to: this._editorView.state.doc.length,
        insert: "",
      },
    });
  }

  @action.bound
  removeTag(tag: SelectedTag) {
    this._tags = this._tags.filter((t) => t.tag.id !== tag.tag.id);
    this.rebuildSearchString(false);
  }

  @computed
  get currentPendingTag() {
    const editor = this._searchBarRef?.current?.editor;
    if (!editor) return;

    const textBeforeCursor = this._searchString.slice(0, this._cursorPosition);
    console.log("textBeforeCursor", textBeforeCursor);

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

  @computed
  get tags() {
    return this._tags;
  }

  @computed
  get isPopoverOpen() {
    return this._popoverOpen;
  }

  @action.bound
  closePopover() {
    this._popoverOpen = false;
  }

  @action.bound
  search() {
    this.closePopover();
    //this._searchString = this._searchString.trim();
    //this.evaluateTags();
    //this.closePopover();
  }

  @action.bound
  triggerDateTimeUpdate(force = false) {
    const isCollapsed =
      this._mainController.settingsController.settings.timelineSettings.displayMode.value ===
      "collapsed";
    // If we're in collapsed mode, we want to ignore most of the "update" calls as they would
    // be distracting for the user within the search-bar.
    if (isCollapsed && !force) return;

    const date =
      getStringDate(this._mainController.selectedStartDate) +
      "-" +
      getStringDate(this._mainController.selectedEndDate);

    this.updateTag(AvailableTags.range.id, date, !isCollapsed);
  }
}
