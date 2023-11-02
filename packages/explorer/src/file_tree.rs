use git2::{ObjectType, Repository, Tree, Error};
use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::file_types::get_file_type;
use crate::handler::{RequestResult, RpcHandler};

#[derive(Debug, Serialize, Deserialize)]
pub struct GetFileTreeParams {
    pub branch: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FileTreeNode {
    path: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    kind: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    loading: Option<bool>,
}

impl RpcHandler {
    // Traverse the file tree breadth-first and print findings as json objects
    fn traverse_tree(
        &self,
        repo: &Repository,
        stream: bool,
        tree: &Tree,
        prefix: Vec<String>,
    ) -> Result<Vec<FileTreeNode>, Error> {
        let mut result: Vec<FileTreeNode> = Vec::new();

        let mut sub_trees: Vec<(Vec<String>, Tree)> = Vec::new();

        for entry in tree.iter() {
            let entry_name = entry.name().unwrap().to_string();

            let path = {
                let mut path = prefix.clone();
                path.push(entry_name.clone());
                path
            };

            if entry.kind() == Some(ObjectType::Tree) {
                if let Some(subtree) = entry
                    .to_object(repo)
                    .ok()
                    .and_then(|object| object.peel_to_tree().ok())
                {
                    let entry = FileTreeNode {
                        path: path.clone(),
                        kind: Some("folder".into()),
                        loading: Some(true),
                    };

                    sub_trees.push((path, subtree));
                    if stream {
                        self.send(entry, false);
                    }
                }
            } else {
                let entry = FileTreeNode {
                    path,
                    kind: Some(get_file_type(&entry_name).into()),
                    loading: None,
                };
                if stream {
                    self.send(entry, false);
                } else {
                    result.push(entry);
                }
            }

        }

        for (path, subtree) in sub_trees {
            let sub_results = self.traverse_tree(repo, stream, &subtree, path);
            if !stream && sub_results.is_ok() {
                result.extend(sub_results.unwrap());
            }
        }

        let entry = FileTreeNode {
            path: prefix,
            kind: Some("folder".into()),
            loading: Some(false),
        };

        if stream {
            self.send(entry, false);
        } else {
            result.push(entry);
        };

        Ok(result)
    }

    fn file_tree(
        &self,
        params: &GetFileTreeParams,
        stream: bool,
    ) -> Result<Vec<FileTreeNode>, git2::Error> {
        let repo = self.repo.lock().unwrap();
        let repo = &*repo;

        let branch = repo.find_branch(params.branch.as_str(), git2::BranchType::Local)?;
        let commit = branch.get().peel_to_commit()?;
        let tree = commit.tree()?;

        self.traverse_tree(repo, stream, &tree, Vec::new())
    }

    pub fn stream_file_tree(&self, params: &GetFileTreeParams) -> RequestResult {
        let result = self.file_tree(params, true);

        match result {
            Ok(_) => {}
            Err(e) => {
                self.send_error(e.message().to_string());
            }
        }
    }

    pub fn get_file_tree(&self, params: &GetFileTreeParams) -> RequestResult {
        let result = self.file_tree(params, false);

        match result {
            Ok(tree) => {
                self.send(tree, true);
            }
            Err(e) => {
                self.send_error(e.message().to_string());
            }
        }
    }
}
