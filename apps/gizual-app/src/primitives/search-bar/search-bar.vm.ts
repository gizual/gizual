import { observable, runInAction } from "mobx";

export class SearchBarViewModel {
  _toggleRepoPanel: () => void;
  _toggleSettingsPanel: () => void;
  _inputFilesRef: React.RefObject<HTMLInputElement> | undefined;

  _state = observable({
    popoverOpen: false,
    filesQuery: [] as string[],
  });

  constructor(toggleRepoPanel: () => void, toggleSettingsPanel: () => void) {
    this._toggleRepoPanel = toggleRepoPanel;
    this._toggleSettingsPanel = toggleSettingsPanel;
    this._inputFilesRef = undefined;
  }

  onToggleRepoPanel = () => {
    runInAction(() => {
      this._toggleRepoPanel();
    });
  };

  onToggleSettingsPanel = () => {
    runInAction(() => {
      this._toggleSettingsPanel();
    });
  };

  onToggleSearchPanel(o: boolean) {
    const body = document.querySelector("#overlay");
    if (body) {
      if (o) {
        body.classList.add("overlay");
      } else {
        body.classList.remove("overlay");
      }
    }
  }

  openPopover = () => {
    runInAction(() => {
      this._state.popoverOpen = true;
    });

    const body = document.querySelector("#overlay");
    if (body) {
      body.classList.add("overlay");
    }
  };

  closePopover = () => {
    runInAction(() => {
      this._state.popoverOpen = false;
      this._state.filesQuery = this._inputFilesRef?.current?.value.split(",") ?? [];
    });
    const body = document.querySelector("#overlay");
    if (body) {
      body.classList.remove("overlay");
    }
  };

  assignInputFilesRef = (ref: React.RefObject<HTMLInputElement>) => {
    this._inputFilesRef = ref;
  };

  get isPopoverVisible() {
    return this._state.popoverOpen;
  }

  get filesQuery() {
    let queryString = "";
    for (let i = 0; i < this._state.filesQuery.length; i++) {
      queryString += this._state.filesQuery[i].trim();
      if (i < this._state.filesQuery.length - 1) {
        queryString += ",";
      }
    }
    return queryString;
  }
}
