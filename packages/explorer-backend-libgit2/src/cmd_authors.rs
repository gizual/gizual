use crate::utils;
use git2::{Error, Repository};
use serde::{Deserialize, Serialize};
use std::collections::HashSet;

#[derive(Debug, Serialize, Deserialize)]
pub struct StreamAuthorsParams {}

#[derive(Debug, Serialize, Deserialize)]
pub struct Author {
    id: String,
    name: String,
    email: String,
    #[serde(rename = "gravatarHash")]
    gravatar_hash: String,
}

pub fn stream_authors(repo: &Repository) -> Result<bool, Error> {
    let mut revwalk = repo.revwalk()?;
    revwalk.set_sorting(git2::Sort::TIME | git2::Sort::REVERSE)?;
    revwalk.push_head()?;

    let mut seen_authors = HashSet::new();

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

        if !seen_authors.contains(&author_id) {
            seen_authors.insert(author_id.clone());
            let author = Author {
                id: author_id,
                name: author_name,
                email: author_email,
                gravatar_hash: format!("{:x}", gravatar_hash),
            };
            utils::print_json(&author);
        }
    }

    Ok(true)
}