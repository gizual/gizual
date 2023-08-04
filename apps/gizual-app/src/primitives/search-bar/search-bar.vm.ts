import { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { makeAutoObservable, observable, runInAction } from "mobx";
import React from "react";

import { MainController } from "../../controllers";

type Tag = {
  id: "file" | "author" | "from" | "to";
  hint: string;
};

type SelectedTag = {
  tag: Tag;
  value: string;
};

export const AvailableTags: Tag[] = [
  {
    id: "file",
    hint: "Apply the search to a specific file.",
  },
  {
    id: "author",
    hint: "Apply the search to a specific author.",
  },
  {
    id: "from",
    hint: "Start searching from a specific date.",
  },
  {
    id: "to",
    hint: "Stop searching at a specific commit.",
  },
];

export class SearchBarViewModel {
  _searchBarRef: React.RefObject<ReactCodeMirrorRef> | undefined;
  _mainController: MainController;
  _searchString = "";

  _state = observable({
    popoverOpen: false,
    filesQuery: [] as string[],
    tags: [] as SelectedTag[],
  });

  constructor(mainController: MainController) {
    this._searchBarRef = undefined;
    this._mainController = mainController;

    makeAutoObservable(this, {}, { autoBind: true });
  }

  assignSearchBarRef(ref: React.RefObject<ReactCodeMirrorRef>) {
    this._searchBarRef = ref;
  }

  onSearchBarFocus() {
    this._state.popoverOpen = true;
  }

  onSearchBarBlur() {
    setTimeout(() => {
      runInAction(() => (this._state.popoverOpen = false));
    }, 100);
  }

  get searchInput() {
    return this._searchString;
  }

  onSearchInput(value: string) {
    this._searchString = value;
  }

  appendTag(tag: Tag) {
    this._searchString = this._searchString.trim() + ` ${tag.id}:`;
    this._searchString = this._searchString.trim();
    setTimeout(() => {
      this._searchBarRef?.current?.editor?.focus();
    }, 105);
  }

  addTag(tag: Tag, value: string) {
    this._state.tags.push({ tag, value });
  }

  removeTag(tag: SelectedTag) {
    this._state.tags = this._state.tags.filter(
      (t) => t.tag.id !== tag.tag.id || t.value !== tag.value,
    );
  }

  get tags() {
    return this._state.tags;
  }

  get isPopoverVisible() {
    return this._state.popoverOpen;
  }

  search() {
    this._searchString = this._searchString.trim();
    console.log("Searching with queryString:", this._searchString);
  }
}
