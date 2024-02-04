use git2::{Error, ObjectType, Repository, Tree};
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[cfg(feature = "bindings")]
use specta::Type;

use crate::explorer::Explorer;
use crate::file_types::get_file_type;

#[cfg_attr(feature = "bindings", derive(Type))]
#[derive(Debug, Serialize, Deserialize)]
pub struct GetFileTreeParams {
    rev: String,
}


#[derive(Debug, Serialize, Deserialize)]
pub struct CustomValue(Value);

#[cfg(feature = "bindings")]
impl specta::Type for CustomValue {
    fn inline(_: specta::DefOpts, _: &[specta::DataType]) -> specta::DataType {
        specta::DataType::Any
    }
}

impl From<u32> for CustomValue {
    fn from(value: u32) -> Self {
        CustomValue(Value::Number(value.into()))
    }
}

impl From<String> for CustomValue {
    fn from(value: String) -> Self {
        CustomValue(Value::String(value))
    }
}

impl From<&str> for CustomValue {
    fn from(value: &str) -> Self {
        CustomValue(Value::String(value.into()))
    }
}

#[cfg_attr(feature = "bindings", derive(Type))]
#[derive(Debug, Serialize, Deserialize)]
pub struct FileTreeNode {
    path: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    kind: Option<CustomValue>,
    #[serde(skip_serializing_if = "Option::is_none")]
    loading: Option<bool>,
}

impl Explorer {
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
        let repo = self.repo.as_ref().unwrap();

        let rev = params.rev.clone();
        let commit_id = self.get_commit_oid_from_rev(rev.as_str())?;

        let commit = repo.find_commit(commit_id)?;
        let tree = commit.tree()?;

         self.traverse_tree(repo, stream, &tree, Vec::new())
    
    }

    pub fn stream_file_tree(&self, params: &GetFileTreeParams) {
        let result = self.file_tree(params, true);

        match result {
            Ok(_) => {
                self.send("", true);
            }
            Err(e) => {
                self.send_error(e.message().to_string());
            }
        }
    }

    pub fn get_file_tree(&self, params: &GetFileTreeParams) {
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
