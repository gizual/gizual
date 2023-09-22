import { DATE_FORMAT, getDaysBetween } from "@app/utils";
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

export class SearchBarViewModel {
  _searchBarRef: React.RefObject<ReactCodeMirrorRef> | undefined;
  _mainController: MainController;
  _searchString = "";
  _tags: SelectedTag[] = [];
  _popoverOpen = false;

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

  onSearchBarBlur() {
    //setTimeout(() => {
    //  runInAction(() => (this._state.popoverOpen = false));
    //}, 100);
  }

  get searchInput() {
    return this._searchString;
  }

  onSearchInput(value: string) {
    this._searchString = value;
  }

  parseTags() {
    const tagsWithValues = [];
    const tagPattern = new RegExp(`(${AvailableTagIdsForRegexp}):?([^\\s]*)?`, "g");
    let match;
    while ((match = tagPattern.exec(this._searchString))) {
      const [fullMatch, tagId, value = ""] = match;
      const tag = AvailableTags[tagId as AvailableTagId];
      tagsWithValues.push({ tag, value });
    }
    return tagsWithValues;
  }

  evaluateTags() {
    this._tags = this.parseTags();
    for (const tag of this._tags) {
      if (tag.tag.id === "start" && dayjs(tag.value, DATE_FORMAT).isValid()) {
        this._mainController.vmController.timelineViewModel?.setSelectedStartDate(
          dayjs(tag.value, DATE_FORMAT).toDate(),
        );
      }
      if (tag.tag.id === "end" && dayjs(tag.value, DATE_FORMAT).isValid()) {
        const diffInDays = getDaysBetween(
          this._mainController.vmController.timelineViewModel!.selectedStartDate,
          dayjs(tag.value, DATE_FORMAT).toDate(),
        );

        this._mainController.vmController.timelineViewModel?.setStartDate(
          dayjs(tag.value, DATE_FORMAT)
            .subtract(diffInDays * 2 + 10, "day")
            .toDate(),
        );
        this._mainController.vmController.timelineViewModel?.setEndDate(
          dayjs(tag.value, DATE_FORMAT)
            .add(diffInDays + 10, "day")
            .toDate(),
        );

        this._mainController.vmController.timelineViewModel?.setSelectedEndDate(
          dayjs(tag.value, DATE_FORMAT).toDate(),
        );
      }
    }
  }

  updateTag(tagId: AvailableTagId, newValue: string) {
    const tagIndex = this._tags.findIndex((tag) => tag.tag.id === tagId);

    if (tagIndex === -1) {
      console.error(`Tag with id ${tagId} not found.`);
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
    setTimeout(() => {
      this._searchBarRef?.current?.editor?.focus();
    }, 105);
    this._tags.push({ tag, value });
  }

  appendText(text: string) {
    this._searchString = this._searchString.trim() + text;
  }

  clear() {
    this._tags.length = 0;
    this._searchString = "";
  }

  removeTag(tag: SelectedTag) {
    this._tags = this._tags.filter((t) => t.tag.id !== tag.tag.id || t.value !== tag.value);
  }

  get currentPendingTag() {
    if (this._searchString.at(-1) === " ") return;
    const words = this._searchString.trim().split(/\s+/);

    if (words.length === 0) {
      return;
    }

    const lastWord = words.at(-1);
    if (!lastWord) return;

    if (!lastWord.includes(":")) {
      return;
    }

    const tagsWithValues = this.parseTags();
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
