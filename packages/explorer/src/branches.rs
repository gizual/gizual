use git2::{BranchType, Error};
use serde::{Deserialize, Serialize};

#[cfg(feature = "bindings")]
use specta::Type;

use crate::explorer::Explorer;

#[cfg_attr(feature = "bindings", derive(Type))]
#[derive(Debug, Serialize, Deserialize)]
pub struct GetCommitsForBranchParams {
    branch: String,
}

#[cfg_attr(feature = "bindings", derive(Type))]
#[derive(Debug, Serialize, Deserialize)]
pub struct CommitsForBranch {
    #[serde(alias = "startCommitId")]
    start_commit: String,
    #[serde(alias = "endCommitId")]
    end_commit: String,
}

impl Explorer {
    pub fn cmd_get_branches(&self) {
        match self.get_branches() {
            Ok(branches) => {
                self.send(branches, true);
            }
            Err(e) => {
                self.send_error(e.message().to_string());
            }
        }
    }

    fn get_branches(&self) -> Result<Vec<String>, Error> {
        let repo = self.repo.as_ref().unwrap();

        let mut result: Vec<String> = Vec::new();

        let branches = repo.branches(Some(BranchType::Local))?;

        branches.for_each(|branch| {
            let (branch, _) = branch.unwrap();
            let name = branch.name().unwrap().unwrap();
            result.push(name.to_string());
        });
        Ok(result)
    }

    pub fn cmd_get_commits_for_branch(&self, params: &GetCommitsForBranchParams) {
        match self.get_commits_for_branch(params) {
            Ok(commits) => {
                self.send(commits, true);
            }
            Err(e) => {
                self.send_error(e.message().to_string());
            }
        }
    }

    fn get_commits_for_branch(
        &self,
        params: &GetCommitsForBranchParams,
    ) -> Result<CommitsForBranch, Error> {
        let repo = self.repo.as_ref().unwrap();


        let end_commit = repo
            .find_branch(&params.branch, BranchType::Local)?
            .into_reference()
            .peel_to_commit()?;

        // find the first commit of the branch
        let mut revwalk = repo.revwalk()?;
        revwalk.push(end_commit.id()).unwrap();
        revwalk.set_sorting(git2::Sort::TIME | git2::Sort::REVERSE)?;

        let first_commit_id = revwalk.next().unwrap().unwrap();

        Ok(CommitsForBranch {
            start_commit: first_commit_id.to_string(),
            end_commit: end_commit.id().to_string(),
        })
    }
}
