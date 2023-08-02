use git2::{BlameOptions, Repository};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::io::{BufRead, BufReader};
use std::path::Path;
use crate::utils::get_author_id;

#[derive(Debug, Serialize, Deserialize)]
pub struct Blame {
    #[serde(rename = "fileName")]
    file_name: String,
    commits: HashMap<String, CommitInfo>,
    lines: Vec<BlameLine>,
}

#[derive(Debug, Serialize, Deserialize)]
struct BlameLine {
    #[serde(rename = "lineNo")]
    line_no: usize,
    #[serde(rename = "commitId")]
    commit_id: String,
    content: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct CommitInfo {
    #[serde(rename = "commitId")]
    commit_id: String,
    #[serde(rename = "authorId")]
    author_id: String,
    timestamp: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BlameParams {
    pub branch: String,
    pub path: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub preview: Option<bool>,
}

pub fn blame(params: BlameParams, repo: &Repository) -> Result<Blame, git2::Error> {
    let file_name = params.path.split('/').last().unwrap();
    let mut result = Blame {
        file_name: file_name.to_string(),
        commits: HashMap::new(),
        lines: Vec::new(),
    };

    let path = Path::new(params.path.as_str());

    let br = repo.find_branch(params.branch.as_str(), git2::BranchType::Local)?;
    let commit = br.get().peel_to_commit()?;

    let commit_id = commit.id();

    let mut opts = BlameOptions::new();

    let spec = format!("{}:{}", commit_id, path.display());

    let mut opts = opts
        .newest_commit(commit_id)
        .track_copies_any_commit_copies(true)
        .track_copies_same_commit_copies(true)
        .track_copies_same_commit_moves(true)
        .track_copies_same_file(true);

    if let Some(true) = params.preview {
        opts = opts
            .first_parent(true)
            .oldest_commit(commit.parent(0).unwrap().id());
    }

    let blame = repo.blame_file(path, Some(&mut opts))?;

    let object = repo.revparse_single(&spec[..])?;
    let blob = repo.find_blob(object.id())?;
    let reader = BufReader::new(blob.content());

    for (i, line) in reader.lines().enumerate() {
        if let (Ok(line), Some(hunk)) = (line, blame.get_line(i + 1)) {
            let sig = hunk.final_signature();

            let commit_id = hunk.final_commit_id().to_string();

            result.lines.push(BlameLine {
                line_no: i + 1,
                commit_id: commit_id.clone(),
                content: line.to_string(),
            });

            let author_name = String::from_utf8_lossy(sig.name_bytes()).to_string();
            let author_email = String::from_utf8_lossy(sig.email_bytes()).to_string();

            let author_id = get_author_id(&author_name, &author_email);


            if !result.commits.contains_key(commit_id.clone().as_str()) {
                result.commits.insert(
                    commit_id.clone(),
                    CommitInfo {
                        commit_id: commit_id.to_string(),
                        author_id,
                        timestamp: sig.when().seconds().to_string(),
                    },
                );
            }
        }
    }

    Ok(result)
}
