use git2::{BlameOptions, Repository};
use std::io::{BufRead, BufReader};
use std::path::Path;

pub fn blame(branch_name: &str, file_path: &str) -> Result<(), git2::Error> {
    let dir_path = "/repo";

    let repo = Repository::open(dir_path)?;
    let path = Path::new(file_path);

    let br = repo.find_branch(branch_name, git2::BranchType::Local)?;
    let commit = br.get().peel_to_commit()?;

    let commit_id = commit.id();

    // Prepare our blame options
    let mut opts = BlameOptions::new();

    let spec = format!("{}:{}", commit_id.to_string(), path.display());
    let blame = repo.blame_file(path, Some(&mut opts))?;
    let object = repo.revparse_single(&spec[..])?;
    let blob = repo.find_blob(object.id())?;
    let reader = BufReader::new(blob.content());

    for (i, line) in reader.lines().enumerate() {
        if let (Ok(line), Some(hunk)) = (line, blame.get_line(i + 1)) {
            let sig = hunk.final_signature();
            println!(
                "{} {} <{}> {}",
                hunk.final_commit_id(),
                String::from_utf8_lossy(sig.name_bytes()),
                String::from_utf8_lossy(sig.email_bytes()),
                line
            );
        }
    }

    Ok(())
}
