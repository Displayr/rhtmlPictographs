#This file is auto generated from /tutorials/table.html
#The html examples and tutorial are the source of truth and are far more readable and beneficial. Start there (see readme for how).
#Use these r files for reference, but know that some instructional content is not transferred from the html to the r examples files
#TL;DR View the tutorial/example the way it was meant to be: in HTML format!

#Intro
##Everything demonstrated in the Graphic Cell Tutorial and Label Cell Tutorial applies to table building.
##In the table config, there is a rows array, where each element in the rows array defines a row. Each row is also an array, where each element is the config for the cell in that row.
##Take any example config from the cell tutorials, and simply reuse that config inside the table config by placing it in a row.
##The rest of this tutorial focuses specifically on structuring the table itself, specifically row and column sizes, gutter sizes, line placement, color pallettes, and global font configuration.

#Simple Table
rhtmlPictographs::graphic('{ "table": { "rows": [ [ "label:a circle", "circle:lightblue" ] ] } }')

#Row and Column Sizes are Evenly Distributed by Default, with Gutter = 0
##This example uses a total width of 370 and a height of 310. The rows and columns are evenly sized to fill the entire space.
rhtmlPictographs::graphic('{ "table": { "rows": [ ["rect:displayr", "rect:displayr", "rect:displayr"], ["rect:displayr", "rect:displayr", "rect:displayr"] ] } } ')

#Row Heights, Column Heights, And Padding Can be Specified (Outer W=370, H=310)
##Each of these examples uses a total width of 370 and a height of 310.
##By gutter I refer to the space in between each row and column.
##When specifying the widths, heights, and columns, you must not exceed the total height and width of the table, or an error will be thrown and the table will not render.
rhtmlPictographs::graphic('{ "table": { "rowHeights": [100, 200], "colWidths": [50, 100, 200], "rows": [ ["rect:displayr", "rect:displayr", "rect:displayr"], ["rect:displayr", "rect:displayr", "rect:displayr"] ] } } ')
rhtmlPictographs::graphic('{ "table": { "rowGutterLength": 10, "columnGutterLength": 10, "rowHeights": [100, 200], "colWidths": [50, 100, 200], "rows": [ ["rect:displayr", "rect:displayr", "rect:displayr"], ["rect:displayr", "rect:displayr", "rect:displayr"] ] } } ')

#Lines
##Horizontal and vertical lines can be drawn across the entire span of the table, or (via padding) only accross portions of the table span.
##Line positioning is in units of rows/columns. Generally speaking whole numbers will follow the edges of cells (Example 1) and fractions will intersect cells (Example 2).
##Some examples:
##If lines are specified beyond the table boundaries an error will be thrown and the table will not render.
##(Example 3) If the table includes gutters, then a line at 1,2, etc. will be drawn through the gutter.
##Example 2 shows the use of padding to shorten the lines. Using some logic it can be seen that padding left and right would affect horizontal lines, and padding top and bottom would affect vertical lines.
##Currently there is no way to apply padding to a single line, but this can be added in the future.
##Example 2 shows the use of a different line style. Any combination of SVG style that applies to SVG paths can be provided.
##Currently there is no way to apply unique styles to each line, only to all the lines. This can be added in the future.
## * A horizontal line at 0 will run left to right along the top of the first row.
## * A horizontal line at 0.5 will run left to right through the middle of the first row.
## * A vertical line at 1 will run top to bottom along the right side of the first column.
rhtmlPictographs::graphic('{ "table": { "rowGutterLength": 10, "columnGutterLength": 10, "rowHeights": [100, 200], "colWidths": [50, 100, 200], "lines": { "horizontal": [ 0, 1, 2 ], "vertical": [ 0, 1, 2, 3 ], "style": "stroke:black;stroke-width:4" }, "rows": [ ["circle:none", "circle:none", "circle:none"], ["circle:none", "circle:none", "circle:none"] ] } } ')
rhtmlPictographs::graphic('{ "table": { "rowGutterLength": 10, "columnGutterLength": 10, "rowHeights": [100, 200], "colWidths": [50, 100, 200], "lines": { "horizontal": [ 0.25, 0.5, 1.5 ], "vertical": [ 0.5, 1.5, 2.5 ], "padding-left": 50, "padding-right": 50, "padding-top": 30, "padding-bottom": 30 }, "rows": [ ["circle:none", "circle:none", "circle:none"], ["circle:none", "circle:none", "circle:none"] ] } } ')
rhtmlPictographs::graphic('{ "table": { "rowGutterLength": 30, "columnGutterLength": 30, "rowHeights": [85, 185], "colWidths": [35, 70, 185], "lines": { "horizontal": [ 1 ], "vertical": [ 1, 2 ], "style": "stroke:red;stroke-width:6;stroke-linecap:round;stroke-dasharray:20 10", "padding-left": 5, "padding-right": 5, "padding-top": 5, "padding-bottom": 5 }, "rows": [ ["rect:lightblue", "rect:lightblue", "rect:lightblue"], ["rect:lightblue", "rect:lightblue", "rect:lightblue"] ] } } ')

#Color Palettes and Color Aliases
##(Example 1) Users can define their own palettes and aliases. Graphics using a palette will rotate through the colors in that palette.
##(Example 2) There are also 7 predefined palettes: [google10, google20, displayr, d310, d320, d320b, d320c]
rhtmlPictographs::graphic('{ "table": { "colors": { "palettes": { "rainbow": [ "red", "orange", "yellow", "green", "blue", "indigo", "violet" ] }, "aliases" : { "primary": "brown", "secondary":"black" } }, "rows": [ ["circle:rainbow", "circle:rainbow", "circle:rainbow", "circle:rainbow", "circle:rainbow", "circle:rainbow"], ["circle:primary", "circle:secondary", "circle:primary", "circle:secondary", "circle:primary", "circle:secondary"] ] } } ')
rhtmlPictographs::graphic('{ "table": { "rows": [ ["circle:google10", "circle:google10", "circle:google10", "circle:google10", "circle:google10", "circle:google10"], ["circle:google20", "circle:google20", "circle:google20", "circle:google20", "circle:google20", "circle:google20"], ["circle:displayr", "circle:displayr", "circle:displayr", "circle:displayr", "circle:displayr", "circle:displayr"], ["circle:d310", "circle:d310", "circle:d310", "circle:d310", "circle:d310", "circle:d310"], ["circle:d320", "circle:d320", "circle:d320", "circle:d320", "circle:d320", "circle:d320"], ["circle:d320b", "circle:d320b", "circle:d320b", "circle:d320b", "circle:d320b", "circle:d320b"], ["circle:d320c", "circle:d320c", "circle:d320c", "circle:d320c", "circle:d320c", "circle:d320c"] ] } } ')

#Fonts
#Background Color
## 4 font settings can be controlled globally for the table, or set for each cell. Additionally, as demonstrated in the LabelCell and GraphicCell tutorials, font settings can be applied within the cell definition for further customization.
## You can set a background color for the whole table.
rhtmlPictographs::graphic('{ "font-color": "red", "font-family": "impact", "font-weight": "200", "font-size": "24px", "table": { "rows": [ [ "label:same", { "type": "label", "value" : { "text": "diff", "font-color": "blue", "font-family": "arial", "font-weight": "900", "font-size": "30px" } }, "label:same" ] ] } } ')
rhtmlPictographs::graphic('{ "font-size" : "32px", "font-weight" : "900", "font-family" : "Verdana", "font-color" : "green", "table": { "rows": [ [ { "type": "graphic", "value": { "text-header": {"font-color": "black", "text": "large", "font-size": "48px"}, "text-overlay": {"font-color": "white", "text": "small", "font-size": "16px"}, "variableImage": "circle:lightblue" } }, { "type": "graphic", "value": { "text-header": {"text": "defaults", "font-size": "32px" }, "text-overlay": {"text": "defaults", "font-size": "32px"}, "variableImage": "circle:lightblue" } }, { "type": "graphic", "value": { "text-header": {"font-color": "purple", "text": "small", "font-size": "16px"}, "text-overlay": {"font-color": "orange", "text": "large", "font-size": "48px"}, "variableImage": "circle:lightblue" } } ] ] } } ')
rhtmlPictographs::graphic('{ "background-color" : "#dddddd", "table": { "rows": [ [ "label:same", { "type": "label", "value" : { "text": "diff", "font-color": "blue", "font-family": "arial", "font-weight": "900", "font-size": "30px" } }, "label:same" ] ] } } ')

#Background Color
## You can set a background color for the whole table.
rhtmlPictographs::graphic('{ "background-color" : "#dddddd", "table": { "rows": [ [ "label:same", { "type": "label", "value" : { "text": "diff", "font-color": "blue", "font-family": "arial", "font-weight": "900", "font-size": "30px" } }, "label:same" ] ] } } ')
