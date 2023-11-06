use crate::explorer::Explorer;
use crate::git_graph::to_string_oid;
use crate::utils::get_author_id;
use serde::{Deserialize, Serialize};

#[cfg(feature = "bindings")]
use specta::Type;

#[cfg_attr(feature = "bindings", derive(Type))]
#[derive(Debug, Serialize, Deserialize)]
pub struct StreamCommitsParams {}

#[cfg_attr(feature = "bindings", derive(Type))]
#[derive(Debug, Serialize, Deserialize)]
pub struct Commit {
    oid: String,
    aid: String,
    message: String,
    files: Vec<String>,
    timestamp: String,
}

impl Explorer {
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
