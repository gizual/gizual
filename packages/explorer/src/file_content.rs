use git2::{ObjectType, Repository};
use serde::{Deserialize, Serialize};

use std::path::Path;

#[cfg(feature = "bindings")]
use specta::Type;

use crate::explorer::Explorer;
use base64::prelude::*;


#[cfg_attr(feature = "bindings", derive(Type))]
#[derive(Debug, Serialize, Deserialize)]
pub struct GetFileContentParams {
    path: String,
    rev: String,
}

#[cfg_attr(feature = "bindings", derive(Type))]
#[derive(Debug, Serialize, Deserialize)]
pub struct GetFileContentResult {
    content: String,
    encoding: String,
}

pub enum ImageType {
    PNG,
    JPEG,
    GIF,
    WEBP,
    BMP,
    ICO,
}

pub fn get_image_type(extension: &str) -> Option<&ImageType> {
    match extension {
        "png" => Some(&ImageType::PNG),
        "jpg" => Some(&ImageType::JPEG),
        "jpeg" => Some(&ImageType::JPEG),
        "gif" => Some(&ImageType::GIF),
        "webp" => Some(&ImageType::WEBP),
        "bmp" => Some(&ImageType::BMP),
        "ico" => Some(&ImageType::ICO),
        _ => None,
    }
}


pub fn get_image_mime_type(t: &ImageType) -> &str {
    match t {
        ImageType::PNG => "image/png",
        ImageType::JPEG => "image/jpeg",
        ImageType::GIF => "image/gif",
        ImageType::WEBP => "image/webp",
        ImageType::BMP => "image/bmp",
        ImageType::ICO => "image/x-icon",
    }
}



pub fn get_image_type_from_path(path: &Path) -> Option<&ImageType> {
    if let Some(extension) = Path::new(path).extension() {
        let extension = extension.to_str().unwrap();
        return get_image_type(extension);
    }

    None
}

pub fn get_file_content(
    params: &GetFileContentParams,
    repo: &Repository,
) -> Result<GetFileContentResult, git2::Error> {
    let rev = params.rev.clone();
    let commit_id = repo.revparse_single(rev.as_str())?.id();
    let commit = repo.find_commit(commit_id)?;
   
    let tree = commit.tree()?;
    let path = Path::new(params.path.as_str());
    let entry = tree.get_path(path)?;

    if entry.kind() != Some(ObjectType::Blob) {
        return Ok(GetFileContentResult {
            content: "".to_string(),
            encoding: "none".to_string(),
        });
    }

    let blob = repo.find_blob(entry.id())?;
    let content = blob.content();

    if let Some(image_type) = get_image_type_from_path(&path) {

        let mime_type = get_image_mime_type(image_type); 

        let base64_data = BASE64_STANDARD.encode(content);
       
       let url = format!("data:{};base64,{}", mime_type, base64_data);
        return Ok(GetFileContentResult {
            content: url,
            encoding: "base64-url".to_string(),
        });

    }

    let content_str = String::from_utf8_lossy(content).to_string();

    return Ok(GetFileContentResult {
        content: content_str,
        encoding: "utf-8".to_string(),
    });
}

impl Explorer {
    pub fn get_file_content(&self, params: &GetFileContentParams) {
        let repo = self.repo.as_ref().unwrap();

        let result = get_file_content(params, repo);

        match result {
            Ok(content) => {
                self.send(content, true);
            }
            Err(err) => {
                self.send_error(err.message().to_string());
            }
        }
    }
}
