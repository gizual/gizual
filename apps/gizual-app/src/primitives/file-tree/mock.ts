import { FileTreeNode } from "./file-tree.vm";

export const FileTreeMock: FileTreeNode = {
  name: "root",
  isDirectory: true,
  children: [
    {
      name: "file1withalongname",
      isDirectory: false,
      children: [],
    },
    {
      name: "file2",
      isDirectory: false,
      children: [],
    },
    {
      name: "dir3",
      isDirectory: true,
      children: [
        {
          name: "file4",
          isDirectory: false,
          children: [],
        },
        {
          name: "file5",
          isDirectory: false,
          children: [],
        },
      ],
    },
  ],
};
