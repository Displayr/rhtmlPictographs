An R HTMLWidget that can generate single image graphics, mutli image graphics, or a table of single/multi image graphics.

# Installation in R

1. `library(devtools)`
1. `install_github('NumbersInternational/rhtmlPictographs', auth_token='????????????????????')`

Simplest Example to verify installation:

```
rhtmlPictographs::graphic(0.33, 400, 400, '{"baseImageUrl": "https://s3-ap-southeast-2.amazonaws.com/kyle-public-numbers-assets/htmlwidgets/CroppedImage/black_square_512.png", "variableImageUrl": "https://s3-ap-southeast-2.amazonaws.com/kyle-public-numbers-assets/htmlwidgets/CroppedImage/blue_square_512.png"}')
```

# Local Installation to Develop/Contribute

Prerequisites:

1. Must have node.js version >= 5.0 installed
1. Must have Google Chrome installed
1. tested on OSX only, should work in Windows/Linux

Steps:

1. `git clone git@github.com:NumbersInternational/rhtmlPictographs.git`
1. `cd rhtmlPictographs`
1. `npm install`
1. `gulp serve`

You should now see a page listing tutorial sections and several examples. Each of these pages has one or more pictographs defined.

Choose an example or add another example/tutorial to the [internal www content](theSrc/internal_www/content). When changes to the [widget source code](theSrc/scripts) or any other file in `./theSrc` are saved, the browser will automatically reload.

# Docs

The method signatures and their definitions are detailed in the main [R file](theSrc/R/htmlwidget.R), and this definition is used to autogenerate the R docs [here](man/).

## View the docs in R

```
help(graphic)
```

## Detailed repo and build process docs

The rhtml widget frameworkd is documented in more detail in the rhtmlTemplate repo [here](https://github.com/NumbersInternational/rhtmlTemplate/blob/master/docs/)

## Detailed list of CSS class names - useful when targeting these DOM via the custom CSS feature

A bit out of date [here](docs/pictograph-dom-class-names.md)

## R Examples

The R examples are auto generated from the [internal www contents](theSrc/internal_www). You are strongly encouraged to view the contents in it's intended glorious format (using a browser), and only use the [R examples file](examples/) for reference.
