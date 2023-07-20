import { FileInfo } from "./file.vm";

export const MockFile: FileInfo = {
  fileName: "demo.file",
  fileExtension: "txt",
  lineLengthMax: 100,
  earliestTimestamp: 1000,
  latestTimestamp: 2000,
  fileContent: [
    { commit: { hash: "#ABCDEF", timestamp: 1000 }, content: 'import React from "react";' },
    {
      commit: { hash: "#FEDCBA", timestamp: 2000 },
      content: 'import ReactDOM from "react-dom/client";',
    },
    {
      commit: { hash: "#FEDCBA", timestamp: 2000 },
      content: "",
    },
    {
      commit: { hash: "#FEDCBA", timestamp: 2000 },
      content: 'import App from "./app";',
    },
    {
      commit: { hash: "#FEDCBA", timestamp: 2000 },
      content: "",
    },
    { commit: { hash: "#ABCDEF", timestamp: 1000 }, content: 'import "./index.scss";' },
    { commit: { hash: "#ABCDEF", timestamp: 1000 }, content: "" },
    {
      commit: { hash: "#ABCDEF", timestamp: 1000 },
      content: 'ReactDOM.createRoot(document.querySelector("#root") as HTMLElement).render(',
    },
    { commit: { hash: "#ABCDEF", timestamp: 1000 }, content: "  <React.StrictMode>" },
    { commit: { hash: "#ABCDEF", timestamp: 1000 }, content: "    <App />" },
    { commit: { hash: "#ABCDEF", timestamp: 1000 }, content: "  </React.StrictMode>" },
    { commit: { hash: "#ABCDEF", timestamp: 1000 }, content: ");" },

    { commit: { hash: "#ABCDEF", timestamp: 1000 }, content: 'import React from "react";' },
    {
      commit: { hash: "#FEDCBA", timestamp: 2000 },
      content: 'import ReactDOM from "react-dom/client";',
    },
    {
      commit: { hash: "#FEDCBA", timestamp: 2000 },
      content: "",
    },
    {
      commit: { hash: "#FEDCBA", timestamp: 2000 },
      content: 'import App from "./app";',
    },
    {
      commit: { hash: "#FEDCBA", timestamp: 2000 },
      content: "",
    },
    { commit: { hash: "#ABCDEF", timestamp: 1000 }, content: 'import "./index.scss";' },
    { commit: { hash: "#ABCDEF", timestamp: 1000 }, content: "" },
    {
      commit: { hash: "#ABCDEF", timestamp: 1000 },
      content: 'ReactDOM.createRoot(document.querySelector("#root") as HTMLElement).render(',
    },
    { commit: { hash: "#ABCDEF", timestamp: 1000 }, content: "  <React.StrictMode>" },
    { commit: { hash: "#ABCDEF", timestamp: 1000 }, content: "    <App />" },
    { commit: { hash: "#ABCDEF", timestamp: 1000 }, content: "  </React.StrictMode>" },
    { commit: { hash: "#ABCDEF", timestamp: 1000 }, content: ");" },
  ],
};
