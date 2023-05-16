import { FileTreeNode } from "./file-tree.vm";

export const FileTreeMock: FileTreeNode = {
  name: "root",
  children: [
    {
      name: "file1withalongname",
      children: [],
    },
    {
      name: "file2",
      children: [],
    },
    {
      name: "dir3",
      children: [
        {
          name: "file4",
          children: [],
        },
        {
          name: "file5",
          children: [],
        },
      ],
    },
  ],
};
