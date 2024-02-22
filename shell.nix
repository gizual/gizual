{ pkgs ? import (builtins.fetchTarball {
  url = "https://github.com/NixOS/nixpkgs/archive/9957cd48326fe8dbd52fdc50dd2502307f188b0d.tar.gz";  # libgit2, v1.6.4
  # see https://lazamar.co.uk/nix-versions/?package=libgit2&version=1.6.4&fullName=libgit2-1.6.4&keyName=libgit2_1_6&revision=9957cd48326fe8dbd52fdc50dd2502307f188b0d&channel=nixpkgs-unstable#instructions
}) {} }:

let
  inherit (pkgs) lib;                     # Inherit `lib` so we can use `makeLibraryPath` and `makeSearchPathOutput`
  inherit (pkgs.lib) makeBinPath;         # Inherit the `makeBinPath` function for building the final $PATH in the shell
  darwin = pkgs.darwin;                   # Enable macOS-specific packages and bind them to `darwin`
  buildInputs = [
    pkgs.coreutils                        # Gives us access to `ls`, `mktemp`, etc.
    pkgs.bash                             # Required for zx. See https://github.com/google/zx/issues/524 
    pkgs.rustup                           # Required for installing Rust
    pkgs.cargo                            # Required for building Rust projects
    pkgs.rustc                            # Required for building Rust projects
    pkgs.zlib                             # Required for building with -lz
    pkgs.libgit2_1_6                      # Required for building with libgit2
    pkgs.nodejs-18_x                      # Required for running Node.js
    pkgs.yarn                             # Required for running Yarn
    pkgs.clang                            # Required for building with clang
    pkgs.git                              # Required for running git
    darwin.apple_sdk.frameworks.Security  # Required for macOS framework access, used for linking
  ];
  
in pkgs.mkShell {
  inherit buildInputs;

  shellHook = ''
    export PATH=${makeBinPath [
      pkgs.rustup
      pkgs.bash
      pkgs.cargo
      pkgs.rustc
      pkgs.zlib
      pkgs.libgit2_1_6
      pkgs.nodejs-18_x
      pkgs.yarn
      pkgs.clang
      pkgs.coreutils
      pkgs.git
    ]}
    export LIBRARY_PATH=${lib.makeLibraryPath [ pkgs.zlib ]}:$LIBRARY_PATH
    export CPATH=${lib.makeSearchPathOutput "dev" "include" [ pkgs.zlib ]}:$CPATH

    echo "Nix shell environment ready."
  '';
}