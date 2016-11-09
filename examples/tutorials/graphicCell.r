#This file is auto generated from /tutorials/graphicCell.html
#The html examples and tutorial are the source of truth and are far more readable and beneficial. Start there (see readme for how).
#Use these r files for reference, but know that some instructional content is not transferred from the html to the r examples files
#TL;DR View the tutorial/example the way it was meant to be: in HTML format!

#Shapes
## Several basic SVG shapes are supported, as well as the use of external image URLs, and image 'data URIs' (where the image is encoded in base64).
rhtmlPictographs::graphic('circle')
rhtmlPictographs::graphic('ellipse')
rhtmlPictographs::graphic('rect')
rhtmlPictographs::graphic('square')
rhtmlPictographs::graphic('url:/images/black_circle_512.svg')
rhtmlPictographs::graphic('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAgElEQVQYlW2PQQ7CMAwEZyIL8S5ezpe4VijLoUkbCrnY8k52bR/P7QXcgQYCdAh7PytbDegGDOHfS6uE+Ytf+Jj3OiOu4hoPTU9RRMHBaka11d5cncBBT7ggJAt0tEElAQz1tbLrUXNjgfTa3bKkLu5Ti5Rmm7DYcL82oSskoLw/acsyJxuTWyQAAAAASUVORK5CYII=')

#Combining Shapes and Keywords
##We can modify each of the shape types above by adding one or more keywords. These will all be demonstrated below, but this section just talks about how to combine and order the keywords in the string.
##Graphic cell strings always start with a type and then have zero or more keywords after the type. Colons are used to seperate the parts of the string.
##The following ordering rules apply:
##Some quick examples, note that what each keyword does is described below:
## * The string must start with a valid type: [circle, ellipse, square, rect, url, data].
## * url and data types must end with the actual URL. In other words, the last part of the string must be the URL/data string.
## * Otherwise the order of the tokens does not matter.
## * If a keyword is not recognized (e.g., red, pink, lightblue) we assume its a color and use it as a color.
## * There can be at most one unrecognized keywords. For example "circle:fromleft:red" is valid but "circle:fromleft:red:blue" is invalid.
## * circle:blue
## * circle:blue:radial
## * circle:radial:blue
## * url:blue:http://somesvg.com/that_i_will_recolor_to_blue.svg
## * data:scale:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAzklEQVRYhe2XQQ=

#Add colors to shapes
rhtmlPictographs::graphic('circle')
rhtmlPictographs::graphic('circle:red')
rhtmlPictographs::graphic('circle:#336699')

#Use a color scheme
##There are 7 predefined palettes: [google10, google20, displayr, d310, d320, d320b, d320c], simply include the name of the color palette in the config string and a color will be chosen from the palette
##Users can also define their own color palettes, this is shown in the table tutorial
rhtmlPictographs::graphic('circle:displayr')
rhtmlPictographs::graphic('circle:displayr')
rhtmlPictographs::graphic('circle:displayr')
rhtmlPictographs::graphic('circle:displayr')
rhtmlPictographs::graphic('circle:displayr')

#Original SVGs
##External SVGs can be recolored simply by providing a color in the config string. Here are the original SVGs:
rhtmlPictographs::graphic('url:/images/blue_circle_512.svg')
rhtmlPictographs::graphic('url:/images/soyuz_rocket.svg')
rhtmlPictographs::graphic('url:/images/dollar_sign_green.svg')
rhtmlPictographs::graphic('url:/images/rocket_black.svg')
rhtmlPictographs::graphic('url:/images/stickman_green.svg')

#Recolored SVGs
##And here are the SVGs recolored red
rhtmlPictographs::graphic('url:red:/images/blue_circle_512.svg')
rhtmlPictographs::graphic('url:red:/images/soyuz_rocket.svg')
rhtmlPictographs::graphic('url:red:/images/dollar_sign_green.svg')
rhtmlPictographs::graphic('url:red:/images/rocket_black.svg')
rhtmlPictographs::graphic('url:red:/images/stickman_green.svg')

#Use a proportion and a scaling technique
##Proportions can be provided and visually represented using 4 different scaling techniques:
##Each technique will work with any of the shape types defined above.
##There are also some aliases (horizontal=fromleft, vertical=frombottom, pie=radial) that behave the same as above
## * Scaling the size of the image
## * Horizontal clipping
## * Vertical clipping
## * Radial clipping (like a pie graph)
rhtmlPictographs::graphic('{ "variableImage": "circle:fromleft", "proportion": "0.75" }')
rhtmlPictographs::graphic('{ "variableImage": "circle:fromright", "proportion": "0.75" }')
rhtmlPictographs::graphic('{ "variableImage": "circle:frombottom", "proportion": "0.75" }')
rhtmlPictographs::graphic('{ "variableImage": "circle:fromtop", "proportion": "0.75" }')
rhtmlPictographs::graphic('{ "variableImage": "circle:scale", "proportion": "0.75" }')
rhtmlPictographs::graphic('{ "variableImage": "circle:radial", "proportion": "0.75" }')
rhtmlPictographs::graphic('{ "variableImage": "circle:horizontal", "proportion": "0.75" }')
rhtmlPictographs::graphic('{ "variableImage": "circle:vertical", "proportion": "0.75" }')
rhtmlPictographs::graphic('{ "variableImage": "circle:pie", "proportion": "0.75" }')

#Use a fraction in the proportion field
##If the proportion string starts with '=', then the remaining string will be interpreted as Javascript, so we can pass in fractions or other mathematical expressions.
##Note the final value must still lie between the inclusive range of [0,1].
rhtmlPictographs::graphic('{ "variableImage": "circle:radial", "proportion": "=7/8" }')
rhtmlPictographs::graphic('{ "variableImage": "circle:radial", "proportion": "=(3+4)/(2+6)" }')
rhtmlPictographs::graphic('{ "variableImage": "circle:radial", "proportion": "=(Math.sqrt(4) + 5)/8" }')

#Add text
##Text can be placed above, below, or inlaid on the graphic.
##By default the text will inherit font settings from the table, but they can be overridden individually.
rhtmlPictographs::graphic('{ "variableImage": "circle:lightblue", "text-header": "top", "text-overlay": "overlay", "text-footer": "bottom" }')
rhtmlPictographs::graphic('{ "variableImage": "circle:lightblue", "font-color": "orange", "font-size": "16px", "font-family": "Arial", "font-weight": "900", "text-header": "top", "text-overlay": "overlay", "text-footer": "bottom" }')
rhtmlPictographs::graphic('{ "variableImage": "circle:lightblue", "text-header" : { "text":"top", "font-color": "orange", "font-size": "16px", "font-family": "Arial", "font-weight": "900" }, "text-overlay": "overlay", "text-footer": "bottom" }')

#Add text with left and right alignment
##Text can be placed above, below, or inlaid on the graphic.
##By default the text will inherit font settings from the table, but they can be overridden individually.
rhtmlPictographs::graphic('{ "variableImage": "circle:lightblue", "text-header" : { "text": "LEFT", "horizontal-align": "left", "padding-left": "6" }, "text-overlay": "overlay", "text-footer": { "text": "RIGHT", "horizontal-align": "right", "padding-right": "6" } } ')

#Use Text Presets
##The strings "proportion" and "percentage" will auto generate text based on the proportion field.
rhtmlPictographs::graphic('{ "variableImage": "circle:lightblue", "proportion": "0.66", "text-header" : "proportion", "text-overlay" : "proportion", "text-footer" : "proportion" }')
rhtmlPictographs::graphic('{ "variableImage": "circle:lightblue", "proportion": "0.66", "text-header" : "percentage", "text-overlay" : "percentage", "text-footer" : "percentage" }')

#Background Color
##By design, background color covers the entire cell and does not respect padding
rhtmlPictographs::graphic('{ "variableImage": "circle:lightblue", "background-color":"green" }')
rhtmlPictographs::graphic('{ "padding": "10 10 10 10", "variableImage": "circle:lightblue", "background-color":"green" }')

#BaseImage
## Base image syntax is identical to variableImage syntax.
## The base image is rendered "underneath" the variable image.
rhtmlPictographs::graphic('{ "variableImage": "rect:fromleft:lightblue", "proportion": "0.66", "baseImage": "rect:green" }')
rhtmlPictographs::graphic('{ "variableImage": "rect:fromleft:lightblue", "proportion": "0.66", "baseImage": "circle:green" }')
rhtmlPictographs::graphic('{ "variableImage": "rect:fromleft:lightblue", "proportion": "0.66", "baseImage": "circle:green", "background-color": "pink" }')

#ImageGrids Basics
## The base and variable image can be repeated, arranged into rows, and have some padding applied.
rhtmlPictographs::graphic('{ "variableImage": "circle:lightblue", "numImages": "3" }')
rhtmlPictographs::graphic('{ "variableImage": "circle:lightblue", "numImages": "3", "numRows": "3" }')
rhtmlPictographs::graphic('{ "variableImage": "circle:lightblue", "numImages": "3", "numRows": "1" }')
rhtmlPictographs::graphic('{ "variableImage": "circle:lightblue", "numImages": "3", "numCols": "3" }')

#ImageGrids Text Handling
## The text overlay is applied to each image, whereas the header and footer are only applied once.
rhtmlPictographs::graphic('{ "variableImage": "circle:lightblue", "numImages": "2", "text-header": "header", "text-overlay": "overlay", "text-footer": "footer" }')

#ImageGrids Debug Borders
## If you are having trouble with placement or sizing, temporarily add a image-background-color or enable dbebug borders to get a visual aid.
rhtmlPictographs::graphic('{ "image-background-color": "#dddddd", "variableImage": "circle:lightblue", "numImages": "2", "text-header": "header", "text-overlay": "overlay", "text-footer": "footer" }')
rhtmlPictographs::graphic('{ "debugBorder": "anything", "variableImage": "circle:lightblue", "numImages": "2", "text-header": "header", "text-overlay": "overlay", "text-footer": "footer" }')

#ImageGrids With Proportion Set
## When multiple images are specified and a proportion is used, the proportion is applied to the area of all the images. As a result, some images will be rendered completely where others will be partially or not at all.
## There are some nuances around layout and clipping, which are covered in the Multi Image Scaling and Layout advanced topic.
rhtmlPictographs::graphic('{ "variableImage": "circle:lightblue:fromleft", "numImages": "3", "numRows": "1", "proportion": "=5/6" }')
rhtmlPictographs::graphic('{ "variableImage": "circle:lightblue:scale", "numImages": "3", "numRows": "1", "proportion": "=5/6" }')
rhtmlPictographs::graphic('{ "variableImage": "circle:lightblue:fromleft", "numImages": "20", "numRows": "2", "proportion": "0.25" }')
rhtmlPictographs::graphic('{ "variableImage": "circle:lightblue:fromleft", "numImages": "20", "numRows": "2", "proportion": "0.75" }')
rhtmlPictographs::graphic('{ "variableImage": "circle:lightblue:fromleft", "numImages": "20", "numRows": "2", "proportion": "1" }')

#ImageGrids With Outer Padding
##Two types of padding is applied to the graphic cells: outer padding and gutter proportions. This example covers outer padding.
##Outer padding (specified using "padding") is the number of pixels around the outer edge of the graphic.
##It closely resembles the CSS padding attribute in that it is an array of 4 numbers: Top Right Bottom Left.

  
    { "image-background-color": "#dddddd", "variableImage": "circle:lightblue", "numImages": "4" }
    { "image-background-color": "#dddddd", "variableImage": "circle:lightblue", "numImages": "4", "padding": "15 15 15 15" }
    { "image-background-color": "#dddddd", "variableImage": "circle:lightblue", "numImages": "4", "padding": "15 0 15 0" }
  

rhtmlPictographs::graphic('{ "image-background-color": "#dddddd", "variableImage": "circle:lightblue", "numImages": "4" }')
rhtmlPictographs::graphic('{ "image-background-color": "#dddddd", "variableImage": "circle:lightblue", "numImages": "4", "padding": "15 15 15 15" }')
rhtmlPictographs::graphic('{ "image-background-color": "#dddddd", "variableImage": "circle:lightblue", "numImages": "4", "padding": "15 0 15 0" }')

#ImageGrids With Gutter Proportions
##Two types of padding is applied to the graphic cells: outer padding and gutter proportions. This example covers gutter proportions.
##Gutter simply means the space between two images (think bowling).
##Gutter Proportions (specified using rowGutter and columnGutter) specify the proportion of the total width/hieght to be used by the gutter vs the image itself.
##A gutter proportion of 0.5 means that the gutter should be as big as the image. A gutter proportion of 0 means no gutter. A gutter proportion of 1 means all gutter (you wouldn't use this). The default gutter proportions are rowGutter: 0.05 and columnGutter: 0.05.
##For more info, the two gutter params set the padding value of the call to .rangebands : https://github.com/mbostock/d3/wiki/Ordinal-Scales#ordinal_rangeBands
rhtmlPictographs::graphic('{ "image-background-color": "#dddddd", "variableImage": "circle:lightblue", "numImages": "4" }')
rhtmlPictographs::graphic('{ "image-background-color": "#dddddd", "variableImage": "circle:lightblue", "numImages": "4", "rowGutter": "0", "columnGutter":"0" }')
rhtmlPictographs::graphic('{ "image-background-color": "#dddddd", "variableImage": "circle:lightblue", "numImages": "4", "rowGutter": "0.1", "columnGutter": "0" }')
rhtmlPictographs::graphic('{ "image-background-color": "#dddddd", "variableImage": "circle:lightblue", "numImages": "4", "rowGutter": "0.5", "columnGutter": "0" }')
rhtmlPictographs::graphic('{ "image-background-color": "#dddddd", "variableImage": "circle:lightblue", "numImages": "4", "rowGutter": "0.9", "columnGutter": "0" }')
rhtmlPictographs::graphic('{ "image-background-color": "#dddddd", "variableImage": "circle:lightblue", "numImages": "4", "rowGutter": "0", "columnGutter": "0.1" }')
rhtmlPictographs::graphic('{ "image-background-color": "#dddddd", "variableImage": "circle:lightblue", "numImages": "4", "rowGutter": "0", "columnGutter": "0.5" }')
rhtmlPictographs::graphic('{ "image-background-color": "#dddddd", "variableImage": "circle:lightblue", "numImages": "4", "rowGutter": "0", "columnGutter": "0.9" }')

#Customization via CSS
## CSS customizations can be provided, keeping in mind that the CSS must be valid in an SVG context.
##SVG and CSS docs : https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Getting_started/SVG_and_CSS
rhtmlPictographs::graphic('{ "variableImage": "circle:lightblue", "numImages": "4", "css": { ".node-xy-1-1 circle" : { "stroke" : "black" } } }')
