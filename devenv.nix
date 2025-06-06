{
  inputs,
  pkgs,
  ...
}: let
  pkgs-unstable = import inputs.nixpkgs-unstable {system = pkgs.stdenv.system;};
in {
  name = "hellok8s-nextjs";

  env.GREET = "##### welcome to the hellok8s-nextjs development shell! #####";

  packages = [
    pkgs.kubectl
    pkgs.aws-vault
    pkgs.kubernetes-helm
    pkgs.sops
  ];

  languages.javascript = {
    enable = true;
    package = pkgs.nodejs_23;
    yarn.enable = true;
    yarn.package = pkgs.yarn-berry;
    yarn.install.enable = true;
  };
  languages.typescript.enable = true;
  dotenv.disableHint = true;

  # Uncomment to enable postgres
  # services.postgres = {
  #   enable = true;
  #   initialScript = "CREATE USER dev WITH SUPERUSER PASSWORD 'devadminpassword';";
  #   initialDatabases = [{name = "devdb";}];
  #   listen_addresses = "localhost";
  # };

  # Uncomment to enable redis
  # services.redis = {
  #   enable = true;
  #   extraConfig = ''
  #     requirepass devredispassword
  #     appendonly no
  #     save ""
  #   '';
  # };

  # Uncomment to run nextjs app with 'devenv up' alongside postgres, redis etc
  # Keep commented if you wish to run yarn dev manually yourself
  processes = {
    frontend.exec = "yarn dev -p 3000";
  };

  git-hooks.hooks = {
    prettier = {
      enable = true;
    };
  };

  enterShell = ''
    echo $GREET
  '';
}
