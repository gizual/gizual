import { ExplorerLibgit2 } from "@giz/explorer-libgit2";
export async function runDemo(handle: FileSystemDirectoryHandle) {
  const backend = await ExplorerLibgit2.create(handle);
  console.time("time:list_branches");
  const branches = await backend.getBranches();
  console.timeEnd("time:list_branches");
  console.log("using branch", branches[0]);

  console.time("time:blame");
  const blame = await backend.getBlame(branches[0], "package.json");
  console.timeEnd("time:blame");

  console.time("time:tree");
  const tree = await backend.getFileTree(branches[0]);
  console.timeEnd("time:tree");

  console.time("time:file_content");
  const fileContent = await backend.getFileContent(branches[0], "package.json");
  console.timeEnd("time:file_content");

  return (
    JSON.stringify(blame) +
    "\n" +
    JSON.stringify(tree) +
    "\n" +
    JSON.stringify(branches) +
    "\n" +
    JSON.stringify(fileContent)
  );
}
