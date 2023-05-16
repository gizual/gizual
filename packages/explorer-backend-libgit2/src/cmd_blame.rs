use crate::utils;
use git2::{BlameOptions, Repository};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::io::{BufRead, BufReader};
use std::path::Path;

#[derive(Debug, Serialize, Deserialize)]
struct Blame {
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
    #[serde(rename = "authorName")]
    author_name: String,
    #[serde(rename = "authorEmail")]
    author_email: String,
    timestamp: String,
}

fn blame(branch_name: &str, file_path: &str) -> Result<Blame, git2::Error> {
    let file_name = file_path.split("/").last().unwrap();
    let mut result = Blame {
        file_name: file_name.to_string(),
        commits: HashMap::new(),
        lines: Vec::new(),
    };

    let dir_path = "/repo";

    let repo = Repository::open(dir_path)?;
    let path = Path::new(file_path);

    let br = repo.find_branch(branch_name, git2::BranchType::Local)?;
    let commit = br.get().peel_to_commit()?;

    let commit_id = commit.id();

    let mut opts = BlameOptions::new();
    let mut opts = opts.newest_commit(commit_id);

    let spec = format!("{}:{}", commit_id.to_string(), path.display());

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

            if !result.commits.contains_key(commit_id.clone().as_str()) {
                result.commits.insert(
                    commit_id.clone(),
                    CommitInfo {
                        commit_id: commit_id.to_string(),
                        author_name: String::from_utf8_lossy(sig.name_bytes()).to_string(),
                        author_email: String::from_utf8_lossy(sig.email_bytes()).to_string(),
                        timestamp: sig.when().seconds().to_string(),
                    },
                );
            }
        }
    }

    Ok(result)
}

pub fn cmd_blame(branch_name: &str, file_path: &str) -> Result<(), git2::Error> {
    let blame = blame(branch_name, file_path)?;

    utils::print_json(&blame);
    Ok(())
}