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
        build = pkgs.stdenv.mkDerivation (finalAttrs: {
          pname = "triliumnext-desktop";
          version = "0.94.0";
          src = pkgs.lib.cleanSource ./.;

          nativeBuildInputs = [
            pkgs.pnpm.configHook
            pkgs.nodejs
          ];

          buildPhase = ''
            pnpm nx run desktop:build
          '';

          installPhase = ''
            mkdir -p $out            
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
