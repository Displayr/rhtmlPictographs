#This file is auto generated from /tutorials/overview.html
#The html examples and tutorial are the source of truth and are far more readable and beneficial. Start there (see readme for how).
#Use these r files for reference, but know that some instructional content is not transferred from the html to the r examples files
#TL;DR View the tutorial/example the way it was meant to be: in HTML format!

#Intro
##The rhtmlPictograph library can make pictographs using SVG and D3.
##The pictographs are structured as a table of multiple "cells". Each cell is either a "graphic cell" or a "label cell". You can also specify lines that form borders around the cells, or that go through the cells.
##You can also make "single cell" graphics if that is all you need.

#Here are two very simple "single cell graphic" pictograph
rhtmlPictographs::graphic('circle')
rhtmlPictographs::graphic('{ "variableImage": "circle:lightblue:radial", "numImages": "3", "numRows": "1", "proportion": "=11/12" }')

#Here is a simple table composed of multiple cells. Two label cells and six graphic cells.
rhtmlPictographs::graphic('{ "table": { "rowGutterLength": 1, "lines": { "horizontal": [ 0.5, 1.5 ], "vertical": [ 2, 3 ], "style": "stroke:grey;stroke-width:1", "padding-left": 100, "padding-right": 30 }, "rows": [ ["label:row1", "circle:#B29559", "circle:#FFAA00", "circle:#0065FF"], ["label:row2", "circle:#0065FF", "circle:#FFAA00", "circle:#B29559"] ] } } ')
