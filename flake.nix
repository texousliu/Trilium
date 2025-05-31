{
  description = "A very basic flake";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
        electron = pkgs.electron_35;
        build = pkgs.stdenv.mkDerivation (finalAttrs: {
          pname = "triliumnext-desktop";
          version = "0.94.0";
          src = pkgs.lib.cleanSource ./.;

          nativeBuildInputs = with pkgs; [
            pnpm.configHook
            nodejs
            nodejs.python
          ];

          buildPhase = ''
            patchelf --set-interpreter $(cat $NIX_CC/nix-support/dynamic-linker) node_modules/.pnpm/sass-embedded-linux-x64@1.87.0/node_modules/sass-embedded-linux-x64/dart-sass/src/dart
            NX_TUI=false NX_DAEMON=false pnpm nx run desktop:build --outputStyle stream --verbose
            NX_TUI=false NX_DAEMON=false npm_config_nodedir=${electron.headers} pnpm nx run desktop:rebuild-deps --outputStyle stream --verbose
          '';

          installPhase = ''
            mkdir -p $out            
            cp -r apps/desktop/dist $out
          '';

          pnpmDeps = pkgs.pnpm.fetchDeps {
            inherit (finalAttrs) pname version src;
            hash = "sha256-xC0u1h92wtthylOAw+IF9mpFi0c4xajJhUcA9pqzcAw=";
          };
        });
      in {
        packages.default = build;
      }
    );
}
