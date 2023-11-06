use std::usize::MAX;

use crate::file_types_db;
use regex::Regex;

lazy_static! {
    static ref FILE_TYPE_MATCHERS: Vec<Option<Regex>> = {
        let mut m = Vec::new();
        for r in file_types_db::FILE_TYPE_REGEX_DB.iter() {
            let regex = Regex::new(r);
            if regex.is_err() {
                m.push(None);
                continue;
            }
            m.push(Some(regex.unwrap()));
        }
        m
    };
}

pub fn get_file_type(filename: &str) -> u32 {
    let mut file_type = MAX;
    for (i, reg) in FILE_TYPE_MATCHERS.iter().enumerate() {
        if reg.is_none() {
            continue;
        }

        let reg = reg.as_ref().unwrap();

        // compare filename using glob pattern
        if reg.is_match(filename) {
            file_type = i;
            break;
        }
    }
    file_type.try_into().unwrap()
}
