with import <nixpkgs> {};
pkgs.mkShell {
  name = "crescentrose-dev";

  # Provide helpful development tools
  packages = [ wrangler ];

  # Provide necessary build dependencies
  buildInputs = [ zola ];
}
