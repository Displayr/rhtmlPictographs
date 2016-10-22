#This file is auto generated from /tutorials/multi_image_scaling.html
#The html examples and tutorial are the source of truth and are far more readable and beneficial. Start there (see readme for how).
#Use these r files for reference, but know that some instructional content is not transferred from the html to the r examples files
#TL;DR View the tutorial/example the way it was meant to be: in HTML format!

#Intro
##When we scale with multiple images, the image layout becomes important.

#Negative Example
##The easiest way to demonstrate is using a negative example. In the two graphics below we are clipping "fromright". Graphic 1 doesn't really look right. Graphic 2 is what we would expect.
##The difference is that Graphic2 uses a layout that is consistent with the clip direction.
rhtmlPictographs::graphic('{ "proportion": 0.789, "numImages": 6, "numRows": 2, "layout": "right,down", "variableImage": "circle:fromright:lightblue"} ')
rhtmlPictographs::graphic('{ "proportion": 0.789, "numImages": 6, "numRows": 2, "variableImage": "circle:fromright:lightblue"} ')

#Pictograph Picks the "Correct" Layout
##The rhtmlPictograph library "correctly" chooses the desired layout based on the specified clip direction.
##The following logic is applied:
##This is demonstrated in the following 8 examples.
## * Default layout is "right,down" this means go left to right, row by row starting at the top, as "one would expect".
## * If a "fromright" clip direction is used, change the layout to "left,down", as in layout right to left, row by row starting at the top.
## * If a "frombottom" clip direction is used, change the layout to "right,up", as in layout left to right, row by row starting at the bottom.
rhtmlPictographs::graphic('{ "proportion": 0.75, "numImages": 6, "numRows": 2, "variableImage": "circle:fromleft:lightblue" } ')
rhtmlPictographs::graphic('{ "proportion": 0.75, "numImages": 6, "numRows": 2, "variableImage": "circle:fromright:lightblue" } ')
rhtmlPictographs::graphic('{ "proportion": 0.75, "numImages": 6, "numRows": 2, "variableImage": "circle:fromtop:lightblue" } ')
rhtmlPictographs::graphic('{ "proportion": 0.75, "numImages": 6, "numRows": 2, "variableImage": "circle:frombottom:lightblue" } ')
rhtmlPictographs::graphic('{ "proportion": 0.75, "numImages": 6, "numCols": 2, "variableImage": "circle:fromleft:lightblue" } ')
rhtmlPictographs::graphic('{ "proportion": 0.75, "numImages": 6, "numCols": 2, "variableImage": "circle:fromright:lightblue" } ')
rhtmlPictographs::graphic('{ "proportion": 0.75, "numImages": 6, "numCols": 2, "variableImage": "circle:fromtop:lightblue" } ')
rhtmlPictographs::graphic('{ "proportion": 0.75, "numImages": 6, "numCols": 2, "variableImage": "circle:frombottom:lightblue" } ')

#User Can Override Layout Choice
##If you wish full control of the layout there is a "layout" parameter available. The valid options and an example of each are provided below:
## * right,down
## * right,up
## * left,down
## * left,down
## * down,right
## * down,left
## * up,right
## * up,left
rhtmlPictographs::graphic('{ "layout": "right,down", "proportion": "=15/24", "numImages": 6, "numRows": 2, "variableImage": "circle:radial:lightblue" }')
rhtmlPictographs::graphic('{ "layout": "right,up", "proportion": "=15/24", "numImages": 6, "numRows": 2, "variableImage": "circle:radial:lightblue" }')
rhtmlPictographs::graphic('{ "layout": "left,down", "proportion": "=15/24", "numImages": 6, "numRows": 2, "variableImage": "circle:radial:lightblue" }')
rhtmlPictographs::graphic('{ "layout": "left,up", "proportion": "=15/24", "numImages": 6, "numRows": 2, "variableImage": "circle:radial:lightblue" }')
rhtmlPictographs::graphic('{ "layout": "down,right", "proportion": "=15/24", "numImages": 6, "numRows": 2, "variableImage": "circle:radial:lightblue" }')
rhtmlPictographs::graphic('{ "layout": "down,left", "proportion": "=15/24", "numImages": 6, "numRows": 2, "variableImage": "circle:radial:lightblue" }')
rhtmlPictographs::graphic('{ "layout": "up,right", "proportion": "=15/24", "numImages": 6, "numRows": 2, "variableImage": "circle:radial:lightblue" }')
rhtmlPictographs::graphic('{ "layout": "up,left", "proportion": "=15/24", "numImages": 6, "numRows": 2, "variableImage": "circle:radial:lightblue" }')
