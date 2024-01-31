use crate::explorer::Explorer;
use crate::git_graph::to_string_oid;
use crate::utils::get_author_id;
use git2::Oid;
use serde::{Deserialize, Serialize};

#[cfg(feature = "bindings")]
use specta::Type;

#[cfg_attr(feature = "bindings", derive(Type))]
#[derive(Debug, Serialize, Deserialize)]
pub struct StreamCommitsParams {}

#[cfg_attr(feature = "bindings", derive(Type))]
#[derive(Debug, Serialize, Deserialize)]
pub struct Commit {
    pub oid: String,
    pub aid: String,
    pub message: String,
    pub files: Vec<String>,
    pub timestamp: String,
}

#[cfg_attr(feature = "bindings", derive(Type))]
#[derive(Debug, Serialize, Deserialize)]
pub struct GetCommitIdsForTimeRangeParams {
    pub branch: String,
    pub start_seconds: i64,
    pub end_seconds: i64,
}

#[cfg_attr(feature = "bindings", derive(Type))]
#[derive(Debug, Serialize, Deserialize)]
pub struct GetCommitIdsForRefsParams {
    pub start_ref: String,
    pub end_ref: String,
}

#[cfg_attr(feature = "bindings", derive(Type))]
#[derive(Debug, Serialize, Deserialize)]
pub struct CommitIds {
    pub since_commit_id: String,
    pub until_commit_id: String,
}



impl Explorer {

    pub fn cmd_get_commit_ids_for_time_range(&mut self, params: GetCommitIdsForTimeRangeParams) {
        let (start_id, end_id) = self.find_commit_ids_for_time_range(params.branch , params.start_seconds, params.end_seconds);

        if start_id.is_none() || end_id.is_none() {
            self.send_error("Failed to find commit ids for time range".to_string());
            return;
        }

        self.send(CommitIds { since_commit_id: start_id.unwrap(), until_commit_id: end_id.unwrap() }, true);
    }

    pub fn cmd_get_commit_ids_for_refs(&mut self, params: GetCommitIdsForRefsParams) {
        let (start_id, end_id) = self.find_commit_ids_for_refs(params.start_ref , params.end_ref);

        if start_id.is_none() || end_id.is_none() {
            self.send_error("Failed to find commit ids for refs".to_string());
            return;
        }

        self.send(CommitIds { since_commit_id: start_id.unwrap(), until_commit_id: end_id.unwrap() }, true);
    }

    pub fn find_commit_ids_for_time_range(&self, branch: String, start_seconds: i64, end_seconds: i64) -> (Option<String>, Option<String>) {
        // write to stderr
        eprintln!("Finding commit ids for time range: {} {} {}", branch, start_seconds, end_seconds);
        let repo = self.repo.as_ref().unwrap();
        
        let branch = repo.find_branch(branch.as_str(), git2::BranchType::Local).expect("Failed to find branch").get().peel_to_commit().expect("Failed to peel to commit").id();

        let mut walk = repo.revwalk().expect("Failed to create revwalk");

        walk.set_sorting(git2::Sort::TOPOLOGICAL | git2::Sort::TIME)
            .expect("Failed to set sorting");

        walk.push(branch).expect("Failed to push glob");

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

        return (start_ref, end_ref);
    }

    pub fn find_commit_ids_for_refs(&self, start_ref: String, end_ref: String) -> (Option<String>, Option<String>) {
        let repo = self.repo.as_ref().unwrap();

        let start_ref = repo.find_reference(&start_ref).expect("Failed to find start ref");

        let end_ref = repo.find_reference(&end_ref).expect("Failed to find end ref");

        let start_commit = start_ref.peel_to_commit().expect("Failed to peel to commit");

        let end_commit = end_ref.peel_to_commit().expect("Failed to peel to commit");
        
        let start_oid = start_commit.id();

        let end_oid = end_commit.id();

        return (Some(to_string_oid(&start_oid)), Some(to_string_oid(&end_oid)));
    }


    pub fn pick_last_commit_by_time(&self, branch: &str, start_seconds: i64, end_seconds: i64) -> Option<Oid> {
        let repo = self.repo.as_ref().unwrap();
        

        let branch = repo.find_branch(branch, git2::BranchType::Local).expect("Failed to find branch").get().peel_to_commit().expect("Failed to peel to commit").id();

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

            let commit = repo.find_commit(oid).expect("Failed to find commit");
            let parents = commit.parent_ids();
            let mut parent_ids: Vec<String> = Vec::new();
            for parent in parents {
                parent_ids.push(to_string_oid(&parent));
            }
            let author = commit.author();

            let author_name = author.name().unwrap().to_string();
            let author_email = author.email().unwrap().to_string();

            let author_id = get_author_id(&author_name, &author_email);

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

            let mut data = Commit {
                oid: oid_str.clone(),
                aid: author_id,
                message: message.clone(),
                files: Vec::new(),
                timestamp: commit.time().seconds().to_string(),
            };

            // get only modified or added files of commit and insert into db

            let tree = commit.tree().expect("Failed to get tree");

            if parent_ids.is_empty() {
                continue;
            }

            for parent in &parent_ids {
                let parent_commit = repo
                    .find_commit(git2::Oid::from_str(parent).unwrap())
                    .expect("Failed to find parent commit");

                let parent_tree = parent_commit.tree().expect("Failed to get parent tree");
                let diff = repo
                    .diff_tree_to_tree(Some(&parent_tree), Some(&tree), None)
                    .expect("Failed to get diff");

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

                    data.files.push(file_path.clone());
                }
            }
            self.send(data, false);
        }

        self.send((), true);
        Ok(())
    }
}
