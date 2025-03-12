{ pkgs ? import <nixpkgs> {}, displayrUtils }:

pkgs.rPackages.buildRPackage {
  name = "rhtmlPictographs";
  version = displayrUtils.extractRVersion (builtins.readFile ./DESCRIPTION); 
  src = ./.;
  description = ''
    An R HTMLWidget that can generate single image graphics, mutli
    image graphics, or a table of single/multi image graphics
  '';
  propagatedBuildInputs = with pkgs.rPackages; [ 
    htmlwidgets
  ];
}
