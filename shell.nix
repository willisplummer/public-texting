let
  pkgs = import <nixpkgs> {};

in pkgs.stdenv.mkDerivation {
    name = "env";
    buildInputs = [
        (pkgs.yarn.override { nodejs = pkgs.nodejs-12_x; })
        pkgs.postgresql_11
    ];
    shellHook = ''
      set -e
        yarn
      set +e
    '';
}
