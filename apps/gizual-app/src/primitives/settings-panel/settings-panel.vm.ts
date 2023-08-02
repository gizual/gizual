import { makeAutoObservable } from "mobx";

import { MainController } from "../../controllers";
import type { ColumnsType } from "antd/es/table";

const ColoringModeValues = ["By Age", "By Author"] as const;
export type ColoringMode = (typeof ColoringModeValues)[number];

function isColoringMode(value: string): value is ColoringMode {
  return ColoringModeValues.includes(value as ColoringMode);
}

interface AuthorType {
  key: React.Key;
  name: string;
  email: string;
}

export class SettingsPanelViewModel {
  private _mainController: MainController;

  constructor(mainController: MainController) {
    this._mainController = mainController;

    makeAutoObservable(this);
  }

  onColoringModeChange = (value: string) => {
    if (!isColoringMode(value)) {
      return;
    }
    this._mainController.setColoringMode(value);
  };

  get toggleColoringValues() {
    return ColoringModeValues;
  }

  get authors() {
    return this._mainController.authors.map((author) => {
      return { key: author.email, name: author.name, email: author.email };
    });
  }

  get columns() {
    const columns: ColumnsType<AuthorType> = [
      {
        title: "Name",
        dataIndex: "name",
        defaultSortOrder: "descend",
      },
      {
        title: "Email",
        dataIndex: "email",
      },
    ];
    return columns;
  }
}
