let
  pkgs = import <nixpkgs> {};

in pkgs.stdenv.mkDerivation {
    name = "env";
    buildInputs = [
        (pkgs.yarn.override { nodejs = pkgs.nodejs-12_x; })
        pkgs.postgresql_11
    ];  
    shellHook = ''
      yarn
      export LANG="en_US.UTF-8"

      export PGDATA=$PWD/local-db
      export DB_HOST=localhost
      export DB_DATABASE=postgres
      export DB_USER=postgres
      export DB_PASSWORD=postgres
      export DB_PORT=5435

      export DB_URL=postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_DATABASE

      if [ ! -d $PGDATA ];
      then
        echo 'Initializing postgresql database...'
        touch pw.txt
        echo $DB_PASSWORD >> pw.txt
        initdb $PGDATA -U $DB_USER --pwfile=./pw.txt --auth=trust >/dev/null
        rm pw.txt
        pg_ctl -o "-p $DB_PORT" start
        psql $DB_URL -f init.pgsql
      else
        pg_ctl -o "-p $DB_PORT" start
      fi

      trap "
        pg_ctl stop
        rm .env.local
      " EXIT

      echo "DATABASE_URL=$DB_URL" >> .env.local
    '';

  nobuild = ''
    echo Do not run this derivation with nix-build, it can only be used with nix-shell
  '';

}
