use crate::explorer::Explorer;
use crate::git_graph::to_string_oid;
use crate::utils::get_author_id;
use git2::{Error, Oid};
use serde::{Deserialize, Serialize};

#[cfg(feature = "bindings")]
use specta::Type;

#[cfg_attr(feature = "bindings", derive(Type))]
#[derive(Debug, Serialize, Deserialize)]
pub struct StreamCommitsParams {}

#[cfg_attr(feature = "bindings", derive(Type))]
#[derive(Debug, Serialize, Deserialize)]
pub struct CommitFiles {
    pub deleted: Vec<String>,
    pub modified: Vec<String>,
    pub added: Vec<String>,
    pub renamed: Vec<(String, String)>,
}

#[cfg_attr(feature = "bindings", derive(Type))]
#[derive(Debug, Serialize, Deserialize)]
pub struct Commit {
    pub oid: String,
    pub aid: String,
    pub message: String,
    pub files: CommitFiles,
    pub timestamp: String,
}

#[cfg_attr(feature = "bindings", derive(Type))]
#[derive(Debug, Serialize, Deserialize)]
pub struct CommitMeta {
    pub oid: String,
    pub aid: String,
    pub message: String,
    pub timestamp: String,
}

#[cfg_attr(feature = "bindings", derive(Type))]
#[derive(Debug, Serialize, Deserialize)]
pub struct GetCommitsForTimeRangeParams {
    pub branch: String,

    #[serde(rename = "startSeconds")]
    pub start_seconds: i64,

    #[serde(rename = "endSeconds")]
    pub end_seconds: i64,
}

#[cfg_attr(feature = "bindings", derive(Type))]
#[derive(Debug, Serialize, Deserialize)]
pub struct CommitRange {
    #[serde(rename = "sinceCommit")]
    pub since_commit: Commit,

    #[serde(rename = "untilCommit")]
    pub until_commit: Commit,
}

#[cfg_attr(feature = "bindings", derive(Type))]
#[derive(Debug, Serialize, Deserialize)]
pub struct IsValidRevParams {
    pub rev: String,
}

#[cfg_attr(feature = "bindings", derive(Type))]
#[derive(Debug, Serialize, Deserialize)]
pub struct GetCommitParams {
    pub rev: String,
}

impl Explorer {
    pub fn get_commit_metadata(&self, rev: &str) -> Result<CommitMeta, git2::Error> {
        let repo = self.repo.as_ref().unwrap();

        let commit_id = self.get_commit_oid_from_rev(rev)?;

        let commit = repo.find_commit(commit_id)?;

        let author = commit.author();

        let author_name = author.name().unwrap_or_default();
        let author_email = author.email().unwrap_or_default();

        let aid = get_author_id(&author_name.to_string(), &author_email.to_string());

        /*
         let mut message = commit.message().unwrap().to_string();

        let char_indices = message.char_indices();
        // ensure message is max 120 chars and only one line
        if char_indices.count() > 120 {
            let slice_position = message.char_indices().nth(120).unwrap().0;
            message = message[0..slice_position].to_string();
        }
        if message.contains('\n') {
            message = message[0..message.find('\n').unwrap()].to_string();
        }
        */

        let data = CommitMeta {
            oid: to_string_oid(&commit.id()),
            aid,
            message: commit.message().unwrap_or_default().to_string(),
            timestamp: commit.time().seconds().to_string(),
        };

        Ok(data)
    }

    pub fn get_commit(&self, rev: &str) -> Result<Commit, git2::Error> {
        let repo = self.repo.as_ref().unwrap();

        let meta = self.get_commit_metadata(rev)?;
        let commit = repo.find_commit(meta.oid.parse().unwrap())?;

        let mut files: CommitFiles = CommitFiles {
            deleted: Vec::new(),
            modified: Vec::new(),
            added: Vec::new(),
            renamed: Vec::new(),
        };
        let commit_tree = commit.tree()?;

        let parents = commit.parent_ids();

        for parent in parents {
            let parent_commit = repo.find_commit(parent).unwrap();
            let parent_tree = parent_commit.tree().unwrap();
            let diff = repo
                .diff_tree_to_tree(Some(&parent_tree), Some(&commit_tree), None)
                .unwrap();
            let deltas = diff.deltas();

            for delta in deltas {
                let new_file_path = delta
                    .new_file()
                    .path()
                    .unwrap()
                    .to_str()
                    .unwrap()
                    .to_string();
                let file_path: String = new_file_path.clone();

                if delta.status() == git2::Delta::Deleted {
                    files.deleted.push(file_path);
                } else if delta.status() == git2::Delta::Added {
                    files.added.push(file_path);
                } else if delta.status() == git2::Delta::Modified {
                    files.modified.push(file_path);
                } else if delta.status() == git2::Delta::Renamed {
                    let old_file_path = delta
                        .old_file()
                        .path()
                        .unwrap()
                        .to_str()
                        .unwrap()
                        .to_string();
                    let old_file_path: String = old_file_path.clone();
                    files.renamed.push((old_file_path, new_file_path));
                }
            }
        }

        Ok(Commit {
            oid: meta.oid,
            aid: meta.aid,
            message: meta.message,
            timestamp: meta.timestamp,
            files,
        })
    }

    pub fn get_commit_oid_from_rev(&self, rev: &str) -> Result<Oid, Error> {
        let repo = self.repo.as_ref().unwrap();
        let oid = repo.revparse_single(rev)?;

        let tag = repo.find_tag(oid.id());


        if let Ok(tag) = tag {
            return Ok(tag.target_id());
        }

        let branch = repo.find_branch(rev, git2::BranchType::Local);


        if let Ok(branch) = branch {
            let branch_commit = branch.get().peel_to_commit();

            if let Ok(commit) = branch_commit {
                return Ok(commit.id());
            }
        }

        let commit = repo.find_commit(oid.id());

        if commit.is_err() {
            return Err(commit.err().unwrap());
        }

        let commit = commit.unwrap();
        Ok(commit.id())
    }

    pub fn cmd_get_commit(&self, params: &GetCommitParams) {
        let data = self.get_commit(&params.rev);

        if data.is_err() {
            self.send_error(data.err().unwrap().message().to_string());
            return;
        }

        self.send(data.unwrap(), true);
    }

    pub fn cmd_is_valid_rev(&self, params: &IsValidRevParams) {
        let repo = self.repo.as_ref().unwrap();
        let rev = params.rev.as_str();
        let oid = repo.revparse_single(rev);
        if oid.is_err() {
            self.send(false, true);
            return;
        }

        self.send(true, true);
    }

    pub fn cmd_get_commits_for_time_range(&mut self, params: GetCommitsForTimeRangeParams) {
        let (start_id, end_id) = self.find_commit_ids_for_time_range(
            &params.branch,
            params.start_seconds,
            params.end_seconds,
        );

        if start_id.is_none() || end_id.is_none() {
            self.send_error("Failed to find commit ids for time range".to_string());
            return;
        }

        let since_commit = self.get_commit(&start_id.unwrap());

        if since_commit.is_err() {
            self.send_error(since_commit.err().unwrap().message().to_string());
            return;
        }

        let until_commit = self.get_commit(&end_id.unwrap());

        if until_commit.is_err() {
            self.send_error(until_commit.err().unwrap().message().to_string());
            return;
        }

        let data = CommitRange {
            since_commit: since_commit.unwrap(),
            until_commit: until_commit.unwrap(),
        };

        self.send(data, true);
    }

    pub fn find_commit_ids_for_time_range(
        &self,
        rev: &str,
        start_seconds: i64,
        end_seconds: i64,
    ) -> (Option<String>, Option<String>) {
        let repo = self.repo.as_ref().unwrap();

        let commit_id = self
            .get_commit_oid_from_rev(rev)
            .expect("Failed to find commit");

        let mut walk = repo.revwalk().expect("Failed to create revwalk");

        walk.set_sorting(git2::Sort::TOPOLOGICAL | git2::Sort::TIME)
            .expect("Failed to set sorting");

        walk.push(commit_id).expect("Failed to push glob");

        let mut start_ref: Option<String> = None;
        let mut end_ref: Option<String> = None;
        let mut previous_ref: Option<String> = None;

        for _oid in walk {
            if _oid.is_err() {
                continue;
            }

            let oid = _oid.unwrap();
            let commit = repo.find_commit(oid).expect("Failed to find commit");
            let timestamp = commit.time().seconds();

            if end_ref.is_none() && timestamp <= end_seconds {
                end_ref = Some(to_string_oid(&oid));
            }

            if start_ref.is_none() && timestamp <= start_seconds {
                start_ref = previous_ref;
            }

            previous_ref = Some(to_string_oid(&oid));

            if start_ref.is_some() && end_ref.is_some() {
                return (start_ref, end_ref);
            }
        }

        if start_ref.is_none() {
            start_ref = previous_ref;
        }

        (start_ref, end_ref)
    }

    pub fn find_commit_ids_for_refs(
        &self,
        start_ref: String,
        end_ref: String,
    ) -> (Option<String>, Option<String>) {
        let repo = self.repo.as_ref().unwrap();

        let start_ref = repo
            .find_reference(&start_ref)
            .expect("Failed to find start ref");

        let end_ref = repo
            .find_reference(&end_ref)
            .expect("Failed to find end ref");

        let start_commit = start_ref
            .peel_to_commit()
            .expect("Failed to peel to commit");

        let end_commit = end_ref.peel_to_commit().expect("Failed to peel to commit");

        let start_oid = start_commit.id();

        let end_oid = end_commit.id();

        (
            Some(to_string_oid(&start_oid)),
            Some(to_string_oid(&end_oid)),
        )
    }

    pub fn pick_last_commit_by_time(
        &self,
        branch: &str,
        start_seconds: i64,
        end_seconds: i64,
    ) -> Option<Oid> {
        let repo = self.repo.as_ref().unwrap();

        let branch = repo
            .find_branch(branch, git2::BranchType::Local)
            .expect("Failed to find branch")
            .get()
            .peel_to_commit()
            .expect("Failed to peel to commit")
            .id();

        let mut walk = repo.revwalk().expect("Failed to create revwalk");

        walk.set_sorting(git2::Sort::TOPOLOGICAL | git2::Sort::TIME)
            .expect("Failed to set sorting");

        walk.push(branch).expect("Failed to push glob");
        for _oid in walk {
            if _oid.is_err() {
                continue;
            }

            let oid = _oid.unwrap();
            let commit = repo.find_commit(oid).expect("Failed to find commit");
            let timestamp = commit.time().seconds();
            if timestamp >= start_seconds && timestamp <= end_seconds {
                return Some(oid);
            }
        }
        None
    }

    pub fn cmd_stream_commits(&mut self) {
        match self.stream_commits() {
            Ok(_) => {}
            Err(e) => {
                self.send_error(e.message().to_string());
            }
        }
    }

    fn stream_commits(&mut self) -> Result<(), git2::Error> {
        let stashes = self.get_stash_ids().expect("Failed to get stashes");
        let repo = self.repo.as_ref().unwrap();

        let mut walk = repo.revwalk().expect("Failed to create revwalk");

        walk.set_sorting(git2::Sort::TOPOLOGICAL | git2::Sort::TIME)
            .expect("Failed to set sorting");

        walk.push_glob("*").expect("Failed to push glob");

        for _oid in walk {
            if _oid.is_err() {
                continue;
            }

            let oid = _oid.unwrap();
            let oid_str = to_string_oid(&oid);
            if stashes.contains(&oid_str) {
                continue;
            }

            let data = self.get_commit(&oid_str)?;

            self.send(data, false);
        }

        self.send((), true);
        Ok(())
    }
}
