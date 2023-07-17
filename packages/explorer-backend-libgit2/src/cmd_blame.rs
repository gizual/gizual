use crate::utils;
use git2::{BlameOptions, Repository};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::io::{BufRead, BufReader, Write};
use std::path::Path;
use std::time::Instant;

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
    #[serde(rename = "authorName")]
    author_name: String,
    #[serde(rename = "authorEmail")]
    author_email: String,
    timestamp: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BlameParams {
    pub branch: String,
    pub path: String,
}

pub fn blame(params: BlameParams, repo: &Repository) -> Result<Blame, git2::Error> {
    let file_name = params.path.split("/").last().unwrap();
    let mut result = Blame {
        file_name: file_name.to_string(),
        commits: HashMap::new(),
        lines: Vec::new(),
    };

    let path = Path::new(params.path.as_str());

    let br = repo.find_branch(params.branch.as_str(), git2::BranchType::Local)?;
    let commit = br.get().peel_to_commit()?;

    let commit_id = commit.id();

    // determine commit which is 2 commits older than commit
    let parent = commit.parent(0).unwrap();
    let parent_id = parent.id();

    let mut opts = BlameOptions::new();

    let spec = format!("{}:{}", commit_id.to_string(), path.display());

    let mut opts = opts.newest_commit(commit_id).oldest_commit(parent_id);
    let start = Instant::now();
    let blame = repo.blame_file(path, Some(&mut opts))?;
    let duration2 = start.elapsed();

    let mut lock = std::io::stderr().lock();
    let _ = writeln!(lock, "Time elapsed in blame() is: {:?}", duration2);
    let _ = lock.flush();

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
