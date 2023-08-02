import { makeAutoObservable } from "mobx";

import { MainController } from "../../controllers";
import type { ColumnsType } from "antd/es/table";
import { Avatar } from "antd";

const ColoringModeValues = ["By Age", "By Author"] as const;
export type ColoringMode = (typeof ColoringModeValues)[number];

function isColoringMode(value: string): value is ColoringMode {
  return ColoringModeValues.includes(value as ColoringMode);
}

interface AuthorType {
  key: React.Key;
  id: string;
  name: string;
  email: string;
  avatar: string;
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

  get authors(): AuthorType[] {
    return this._mainController.authors.map((author) => {
      return {
        key: author.id,
        id: author.id,
        name: author.name,
        email: author.email,
        avatar: author.gravatarHash,
      };
    });
  }

  get columns() {
    const columns: ColumnsType<AuthorType> = [
      {
        title: "",
        dataIndex: "gutter",
        render: (_, record) => (
          <div
            style={{
              width: 5,
              height: 25,
              display: "block",
              border: "1px solid var(--border-primary)",
              borderRadius: 5,
              backgroundColor: this._mainController.authorColorScale(record.id ?? ""),
            }}
          />
        ),
      },
      {
        title: "",
        dataIndex: "avatar",
        render: (_, record) => (
          <Avatar
            src={`https://www.gravatar.com/avatar/${record.avatar}`}
            style={{ border: "1px solid var(--border-primary)", width: 28, height: 28 }}
          />
        ),
      },
      {
        title: "Author",
        dataIndex: "email",
        render: (_, record) => (
          <>
            <p
              style={{
                whiteSpace: "break-spaces",
                textAlign: "left",
                overflowWrap: "anywhere",
                fontSize: "1em",
              }}
            >
              {record.name}
            </p>
            <p
              style={{
                whiteSpace: "break-spaces",
                textAlign: "left",
                overflowWrap: "anywhere",
                fontSize: "0.875em",
              }}
            >
              {record.email}
            </p>
          </>
        ),
      },
    ];
    return columns;
  }
}
