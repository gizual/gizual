use git2::{Error, Repository};
use serde::{Deserialize, Serialize};
use std::{
    collections::{HashMap, HashSet},
    ops::Add,
};

use petgraph::dot::{Config, Dot};
use petgraph::graph::DiGraph;
use std::fmt;

use crate::utils::get_author_id;

type Oid = String;
type Aid = String;

#[derive(Debug, Serialize, Deserialize)]
pub struct HistoryGraph {
    commit_indices: HashMap<Oid, usize>,
    commits: Vec<CommitInfo>,
    branches: Vec<BranchInfo>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AuthorInfo {
    pub id: Aid,
    pub name: String,
    pub email: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BranchInfo {
    pub id: Oid,
    pub name: String,
    pub last_commit_id: Oid,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CommitInfo {
    pub oid: Oid,
    pub aid: Oid,
    pub timestamp: String,
    pub message: String,

    pub is_merge: bool,
    pub parents: [Option<Oid>; 2],
    pub children: Vec<Oid>,
}

impl fmt::Display for CommitInfo {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", &self.oid[0..7])
    }
}

fn to_string_oid(oid: &git2::Oid) -> Oid {
    oid.to_string()
}

fn get_stash_ids(repository: &mut Repository) -> Result<HashSet<Oid>, Error> {
    let mut stashes = HashSet::new();
    repository.stash_foreach(|_, _, oid| {
        stashes.insert(to_string_oid(oid));
        true
    })?;
    Ok(stashes)
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GetCommitTreeOptions {
    pub repo_path: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CommitTree {
    pub graph: HistoryGraph,
    pub dot: String,
}

pub fn cmd_get_git_graph(repo: &mut Repository) -> Result<CommitTree, git2::Error> {
    let stashes = get_stash_ids(repo)?;

    let mut walk = repo.revwalk()?;

    walk.set_sorting(git2::Sort::TOPOLOGICAL | git2::Sort::TIME)?;

    walk.push_glob("*")?;

    let mut commit_infos = Vec::new();
    let mut commit_indices = HashMap::new();

    for _oid in walk {
        if _oid.is_err() {
            continue;
        }

        let oid = _oid.unwrap();
        let oid_str = to_string_oid(&oid);
        if stashes.contains(&oid_str) {
            continue;
        }

        let commit = repo.find_commit(oid)?;
        let parents = commit.parent_ids();
        let mut parent_ids: Vec<Oid> = Vec::new();
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

        let commit_info = CommitInfo {
            oid: oid_str.clone(),
            aid: author_id.clone(),
            timestamp: commit.time().seconds().to_string(),
            message,

            is_merge: parent_ids.len() > 1,
            parents: [parent_ids.get(0).cloned(), parent_ids.get(1).cloned()],
            children: Vec::new(),
        };

        commit_infos.push(commit_info);
        commit_indices.insert(oid.to_string(), commit_infos.len() - 1);
    }

    for i in 1..commit_infos.len() {
        let commit = commit_infos.get(i).unwrap();
        let commit_oid = commit.oid.clone();
        let parent_ids = commit.parents.clone();

        for parent_id in parent_ids.iter() {
            if parent_id.is_none() {
                continue;
            }
            let parent_oid = parent_id.as_ref().unwrap();
            let parent_index = commit_indices.get(parent_oid.as_str()).unwrap();
            commit_infos[*parent_index]
                .children
                .push(commit_oid.clone());
        }
    }

    let mut branches = Vec::new();

    let braches_list = repo.branches(Some(git2::BranchType::Local))?;

    for branch in braches_list {
        let (branch, _) = branch?;
        let branch_name = branch.name()?.unwrap().to_string();
        let branch_oid = branch.get().target().unwrap().to_string();
        let branch_info = BranchInfo {
            id: branch_oid.clone(),
            name: branch_name.clone(),
            last_commit_id: branch_oid.clone(),
        };
        branches.push(branch_info);
    }

    // create a string which contains a dot for each branch which exists

    let mut branch_dots = String::new();
    for _ in 0..branches.len() {
        branch_dots = branch_dots.add(" .");
    }

    #[cfg(not(target_arch = "wasm32"))]
    println!("   {}", branch_dots);

    for (_i, commit) in commit_infos.iter().enumerate() {
        let _num_parents = commit.parents.iter().filter(|x| x.is_some()).count();

        let _short_id = &commit.oid[..8];
        let _parent_id_1 = commit.parents[0].clone().unwrap_or("".to_string());
        let _parent_id_2 = commit.parents[1].clone().unwrap_or("".to_string());

        let mut branch_indicator = String::new();
        for branch in branches.iter() {
            branch_indicator = branch_indicator.add(" ");
            if branch.last_commit_id == commit.oid {
                branch_indicator = branch_indicator.add("*");
            } else {
                branch_indicator = branch_indicator.add(" ");
            }
        }
    }

    let mut graph: DiGraph<String, i32> = DiGraph::new();

    let mut commit_nodes = HashMap::new();

    for (_i, commit) in commit_infos.iter().enumerate() {
        let commit_oid = commit.oid.clone();
        let node_idx = graph.add_node(commit.to_string());
        commit_nodes.insert(commit_oid, node_idx);
    }

    for (_i, commit) in commit_infos.iter().enumerate() {
        let commit_oid = commit.oid.clone();

        for parent in commit.parents.iter() {
            if parent.is_none() {
                continue;
            }
            let parent_oid = parent.as_ref().unwrap();
            let parent_idx = commit_nodes.get(parent_oid).unwrap();
            let child_idx = commit_nodes.get(&commit_oid).unwrap();
            graph.add_edge(*parent_idx, *child_idx, 1);
        }
    }

    let dot = Dot::with_config(&graph, &[Config::EdgeNoLabel]).to_string();

    #[cfg(not(target_arch = "wasm32"))]
    println!("Test: {}", dot);

    //

    // Commit list per branch, each commit has a list of children (and parents), seperate info about child/parent branches

    //utils::print_json(&graph);

    let graph = HistoryGraph {
        commit_indices,
        commits: commit_infos,
        branches,
    };

    Ok(CommitTree { graph, dot })
}
