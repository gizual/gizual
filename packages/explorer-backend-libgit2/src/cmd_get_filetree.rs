use git2::{ObjectType, Repository, Tree};
use mime_guess::MimeGuess;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct GetFileTreeParams {
    pub branch: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FileTree {
    name: String,
    #[serde(skip_serializing_if = "Vec::is_empty", default)]
    children: Vec<FileTree>,
    #[serde(skip_serializing_if = "Option::is_none")]
    mime_type: Option<String>,
}

pub fn get_filetree(params: GetFileTreeParams, repo: &Repository) -> Result<FileTree, git2::Error> {
    let branch = repo.find_branch(params.branch.as_str(), git2::BranchType::Local)?;
    let commit = branch.get().peel_to_commit()?;
    let tree = commit.tree()?;

    let file_tree = build_file_tree(repo, &tree, "");

    Ok(file_tree)
}

fn build_file_tree(repo: &Repository, tree: &Tree, name: &str) -> FileTree {
    let mut filetree = FileTree {
        name: name.to_string(),
        children: Vec::new(),
        mime_type: None,
    };

    for entry in tree.iter() {
        let entry_name = entry.name().unwrap().to_string();

        if entry.kind() == Some(ObjectType::Tree) {
            if let Some(subtree) = entry
                .to_object(repo)
                .ok()
                .and_then(|object| object.peel_to_tree().ok())
            {
                let subtree = build_file_tree(repo, &subtree, entry_name.as_str());

                filetree.children.push(subtree);
            }
        } else {
            let file = FileTree {
                name: entry_name.clone(),
                children: Vec::new(),
                mime_type: MimeGuess::from_path(entry_name.as_str())
                    .first()
                    .map(|m| m.to_string()),
            };

            filetree.children.push(file);
        }
    }

    filetree
}
