use git2::{ObjectType, Repository};

use std::path::Path;

pub fn cmd_get_file_content(branch: &str, file_path: &str) -> Result<(), git2::Error> {
    let dir_path = "/repo";

    let repo = Repository::open(dir_path)?;
    let br = repo.find_branch(branch, git2::BranchType::Local)?;
    let commit = br.get().peel_to_commit()?;
    let tree = commit.tree()?;
    let path = Path::new(file_path);
    let entry = tree.get_path(path)?;

    if entry.kind() == Some(ObjectType::Blob) {
        let blob = repo.find_blob(entry.id())?;
        let content = blob.content();
        println!("{}", String::from_utf8_lossy(content));
        return Ok(());
    }
    println!("not a blob");
    Ok(())
}
