use crate::{explorer::Explorer, utils};

use git2::Error;
use serde::{Deserialize, Serialize};

#[cfg(feature = "bindings")]
use specta::Type;

#[cfg_attr(feature = "bindings", derive(Type))]
#[derive(Debug, Serialize, Deserialize)]
pub struct StreamAuthorsParams {}

#[cfg_attr(feature = "bindings", derive(Type))]
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Author {
    id: String,
    name: String,
    email: String,

    #[serde(rename = "gravatarHash")]
    gravatar_hash: String,

    #[serde(rename = "numCommits")]
    num_commits: u32,
}

impl Explorer {
    pub fn cmd_stream_authors(&self) {
        match self.visit_authors(true) {
            Ok(_) => {}
            Err(e) => {
                self.send_error(e.message().to_string());
            }
        }
    }

    pub fn cmd_get_authors(&self) {
        match self.visit_authors(false) {
            Ok(_) => {}
            Err(e) => {
                self.send_error(e.message().to_string());
            }
        }
    }

    fn visit_authors(&self, stream: bool) -> Result<(), Error> {
        let repo = self.repo.as_ref().unwrap();

        let mut revwalk = repo.revwalk()?;
        revwalk.set_sorting(git2::Sort::TIME | git2::Sort::REVERSE)?;
        revwalk.push_head()?;

        let mut authors = std::collections::HashMap::new();

        for oid in revwalk {
            let oid = oid?;
            let commit = repo.find_commit(oid)?;
            let author = commit.author();
            let author_email = author.email();
            if author_email.is_none() {
                continue;
            }
            let author_name = author.name();
            if author_name.is_none() {
                continue;
            }

            let author_name = author_name.unwrap().to_string();
            let author_email = author_email.unwrap().to_string();

            let gravatar_hash = md5::compute(author_email.clone().trim().to_lowercase());

            let author_id = utils::get_author_id(&author_name, &author_email);

            let author = authors.entry(author_id.clone()).or_insert(Author {
                id: author_id.clone(),
                name: author_name.clone(),
                email: author_email.clone(),
                gravatar_hash: format!("{:x}", gravatar_hash),
                num_commits: 0,
            });

            author.num_commits += 1;

            if stream {
                self.send(author, false);
            }
        }

        if stream {
            self.send((), true);
        } else {
            let mut result = Vec::new();

            for (_, author) in authors.iter() {
                result.push(author);
            }

            self.send(result, true);
        }
        Ok(())
    }
}
