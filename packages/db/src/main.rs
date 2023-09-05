use git2::{Error, Repository};
use rusqlite::types::ValueRef;
use rusqlite::{params, Connection, Result};
use structopt::StructOpt;

use std::collections::HashSet;

type Oid = String;
type Aid = String;

use jsonrpc_core::*;
use jsonrpc_derive::rpc;
use std::io::BufRead;
use std::sync::{Arc, Mutex};

#[allow(unused_imports)]
use asyncify_exports;

#[derive(StructOpt)]
struct Args {
    #[structopt(name = "repo_path", long, default_value = "/repo")]
    repo_path: String,
}

fn get_stash_ids(repository: &mut Repository) -> Result<HashSet<Oid>, Error> {
    let mut stashes = HashSet::new();
    repository.stash_foreach(|_, _, oid| {
        stashes.insert(to_string_oid(oid));
        true
    })?;
    Ok(stashes)
}

fn to_string_oid(oid: &git2::Oid) -> Oid {
    oid.to_string()
}

fn run() -> Result<(), Box<dyn std::error::Error>> {
    let args = Args::from_args();

    let mut repo = Repository::open(args.repo_path).expect("Failed to open repo");

    let flags = rusqlite::OpenFlags::SQLITE_OPEN_READ_WRITE
        | rusqlite::OpenFlags::SQLITE_OPEN_CREATE
        | rusqlite::OpenFlags::SQLITE_OPEN_URI;

    // Open an in-memory SQLite database
    let conn = Connection::open_in_memory()?;

    conn.pragma_update(None, "journal_mode", &"OFF")
        .expect("Failed to set journal mode");

    conn.pragma_update(None, "synchronous", &"OFF")
        .expect("Failed to set synchronous");

    conn.pragma_update(None, "locking_mode", &"EXCLUSIVE")
        .expect("Failed to set locking_mode");

    // Create a table
    conn.execute(
        "CREATE TABLE commits (oid VARCHAR(40) PRIMARY KEY, authorName TEXT NOT NULL, authorEmail TEXT NOT NULL, commitMsg TEXT NOT NULL);",
        [],
    )?;

    // Create a table
    conn.execute(
        "CREATE INDEX commits_author_email_idx on commits(authorEmail DESC)",
        [],
    )?;

    // Create a table
    conn.execute(
        r#"
        CREATE TABLE files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filePath TEXT NOT NULL,
            UNIQUE(filePath)
        );"#,
        [],
    )?;

    // Create a table
    conn.execute(
        "CREATE TABLE commits_files (id INTEGER PRIMARY KEY AUTOINCREMENT, oid VARCHAR(40), fileId INTEGER);",
        [],
    )?;

    let stashes = get_stash_ids(&mut repo).expect("Failed to get stashes");

    let mut walk = repo.revwalk().expect("Failed to create revwalk");

    walk.set_sorting(git2::Sort::TOPOLOGICAL | git2::Sort::TIME)
        .expect("Failed to set sorting");

    walk.push_glob("*").expect("Failed to push glob");

    {
        let mut insert_commit_stmt: rusqlite::CachedStatement<'_> = conn.prepare_cached(
            "INSERT INTO commits (oid, authorName, authorEmail, commitMsg) VALUES (?, ?, ?, ?);",
        )?;
        let mut insert_file_stmt =
            conn.prepare_cached(r#"INSERT OR IGNORE INTO files (filePath) VALUES (?)"#)?;
        let mut select_file_stmt =
            conn.prepare_cached(r#"SELECT id FROM files WHERE filePath = ?"#)?;

        let mut insert_commit_file_stmt =
            conn.prepare_cached(r#"INSERT INTO commits_files (oid, fileId) VALUES (?, ?)"#)?;

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
            let mut parent_ids: Vec<Oid> = Vec::new();
            for parent in parents {
                parent_ids.push(to_string_oid(&parent));
            }
            let author = commit.author();

            let author_name = author.name().unwrap().to_string();
            let author_email = author.email().unwrap().to_string();

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

            insert_commit_stmt.execute(params![oid_str, author_name, author_email, message])?;

            // get only modified or added files of commit and insert into db

            let tree = commit.tree().expect("Failed to get tree");

            if parent_ids.len() < 1 {
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

                    insert_file_stmt
                        .execute(params![file_path.clone()])
                        .expect("Failed to insert file");

                    let file_iter = select_file_stmt
                        .query_map([new_file_path], |row| {
                            let id: i64 = row.get(0).expect("Failed to get id");
                            Ok(id)
                        })
                        .expect("Failed to query files");

                    let mut file_id: i64 = 0;
                    for file in file_iter {
                        file_id = file?;
                    }

                    insert_commit_file_stmt
                        .execute(params![oid_str, file_id])
                        .expect("Failed to insert commit file");
                }
            }
        }
    }
    let locked_repo = Arc::new(Mutex::new(repo));

    let mut io = IoHandler::new();
    let handler = RpcHandler {
        repo: locked_repo,
        connection: Arc::new(Mutex::new(conn)),
    };

    io.extend_with(handler.to_delegate());

    let initial_msg = r#"{"jsonrpc":"2.0","ready":true,"id":0}"#;

    let stdin = std::io::stdin();
    println!("{}", initial_msg);

    for line in stdin.lock().lines().flatten() {
        let result = io.handle_request_sync(line.as_str());
        println!("{}", result.unwrap());
    }

    /*
       // Query data of commit and number of changed files filtered by author email

       let query = "SELECT commits.oid, commits.authorEmail, commits.commitMsg, COUNT(commits_files.fileId) as num_files FROM commits LEFT JOIN commits_files ON commits.oid = commits_files.oid WHERE commits.authorEmail = ? GROUP BY commits.oid ORDER BY commits.authorEmail DESC, commits.oid DESC";

       let mut stmt = conn.prepare(query).expect("Failed to prepare query");
       let commit_iter = stmt
           .query_map(["stefan@schintler.at"], |row| {
               let oid: String = row.get(0).expect("Failed to get oid");
               let email: String = row.get(1).expect("Failed to get email");
               let msg: String = row.get(2).expect("Failed to get msg");
               let num_files: i64 = row.get(3).expect("Failed to get num_files");
               Ok((oid, email, msg, num_files))
           })
           .expect("Failed to query commits");

       for commit in commit_iter {
           let (oid, email, msg, num_files): (String, String, String, i64) = commit?;
           println!(
               "OID: {}, Email: {}, Msg: {}, numFiles: {}",
               oid, email, msg, num_files
           );
       }




       // delet db file if exists
       std::fs::remove_file("/repo/db.sqlite").ok();

       let mut dst: Connection = Connection::open("/repo/db.sqlite")?;
       let backup = Backup::new(&conn, &mut dst)?;
       backup
           .run_to_completion(
               50,
               time::Duration::from_millis(0),
               Some((|p| println!("Progress: {}", p.remaining))),
           )
           .expect("Failed to backup");
    */
    Ok(())
}

pub struct RpcHandler {
    repo: Arc<Mutex<Repository>>,
    connection: Arc<Mutex<Connection>>,
}

use std::result;

#[rpc(server)]
pub trait RpcCommands {
    #[rpc(name = "run_sqlite")]
    fn run_sqlite(&self, query: String) -> Result<String, jsonrpc_core::Error>;
}

impl RpcHandler {
    fn respond<T: std::fmt::Debug>(
        &self,
        data: result::Result<T, git2::Error>,
    ) -> Result<T, jsonrpc_core::Error> {
        if let Err(data) = data {
            let message = data.message();
            return Err(jsonrpc_core::Error {
                code: ErrorCode::InternalError,
                message: message.to_string(),
                data: None,
            });
        }
        Ok(data.unwrap())
    }
}

impl RpcCommands for RpcHandler {
    fn run_sqlite(&self, query: String) -> Result<String, jsonrpc_core::Error> {
        let conn = self.connection.lock().unwrap();

        let stmt = conn
            .prepare(query.as_str());

        if stmt.is_err() {
            let error_str = format!("{:?}", stmt.err());
            return Err(jsonrpc_core::Error {
                code: ErrorCode::InternalError,
                message: error_str,
                data: None,
            });
        }
        let mut stmt = stmt.expect("Failed to prepare query");

        let column_count = stmt.column_count();

        let mut result_string = String::new();
        let mut result = stmt.query([]).expect("Failed to query commits");

        while let Ok(row) = result.next() {
            if row.is_none() {
                break;
            }

            let row = row.unwrap();
            for i in 0..column_count {
                let value: String = match row.get_ref_unwrap(i) {
                    ValueRef::Integer(value) => value.to_string(),
                    ValueRef::Real(value) => value.to_string(),
                    ValueRef::Text(value) => row.get_unwrap(i),
                    ValueRef::Blob(value) => row.get_unwrap(i),
                    ValueRef::Null => "null".to_string(),
                };

                let value_string = value.as_str();
                result_string.push_str(value_string);
                result_string.push_str(" ");
            }
            result_string.push_str("\n");
        }

        Ok(result_string)
    }
}

fn main() {
    run().expect("Failed to run");
    return;
}
