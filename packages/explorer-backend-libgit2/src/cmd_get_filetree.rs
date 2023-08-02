use git2::{ObjectType, Repository, Tree};
use mime_guess::MimeGuess;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct GetFileTreeParams {
    pub branch: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FileTreeNode {
    path: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    kind: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    loading: Option<bool>,
}

pub fn get_filetree(params: GetFileTreeParams, repo: &Repository) -> Result<bool, git2::Error> {
    let branch = repo.find_branch(params.branch.as_str(), git2::BranchType::Local)?;
    let commit = branch.get().peel_to_commit()?;
    let tree = commit.tree()?;

    traverse_tree(repo, &tree, Vec::new());

    Ok(true)
}

// Traverse the file tree breadth-first and print findings as json objects
fn traverse_tree(repo: &Repository, tree: &Tree, prefix: Vec<String>) {
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
                    kind: Some("folder".to_string()),
                    loading: Some(true),
                };

                sub_trees.push((path, subtree));
                println!("{}", serde_json::to_string(&entry).unwrap());
            }
        } else {
            let entry = FileTreeNode {
                path,
                kind: MimeGuess::from_path(entry_name.as_str())
                    .first()
                    .map(|m| m.to_string()),
                loading: None,
            };

            println!("{}", serde_json::to_string(&entry).unwrap());
        }
    }

    for (path, subtree) in sub_trees {
        traverse_tree(repo.clone(), &subtree, path);
    }

    let entry = FileTreeNode {
        path: prefix,
        kind: Some("folder".to_string()),
        loading: Some(false),
    };

    println!("{}", serde_json::to_string(&entry).unwrap());
}
