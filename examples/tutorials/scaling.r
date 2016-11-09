#This file is auto generated from /tutorials/scaling.html
#The html examples and tutorial are the source of truth and are far more readable and beneficial. Start there (see readme for how).
#Use these r files for reference, but know that some instructional content is not transferred from the html to the r examples files
#TL;DR View the tutorial/example the way it was meant to be: in HTML format!

#Intro
##This set of examples provides a tool to verify that the different scaling modes are handled correctly in a variety of situations.

#Different fill directions
rhtmlPictographs::graphic('{ "numImages": 2, "numRows": 2, "background-color": "#dddddd", "baseImage": "square:lightblue", "variableImage": "square:fromleft", "proportion": "=15/16" }')
rhtmlPictographs::graphic('{ "numImages": 2, "numRows": 2, "background-color": "#dddddd", "baseImage": "square:lightblue", "variableImage": "square:fromright", "proportion": "=15/16" }')
rhtmlPictographs::graphic('{ "numImages": 2, "numRows": 2, "background-color": "#dddddd", "baseImage": "square:lightblue", "variableImage": "square:frombottom", "proportion": "=15/16" }')
rhtmlPictographs::graphic('{ "numImages": 2, "numRows": 2, "background-color": "#dddddd", "baseImage": "square:lightblue", "variableImage": "square:fromtop", "proportion": "=15/16" }')

#Squares
rhtmlPictographs::graphic('{ "numImages": 1, "background-color": "#dddddd", "baseImage": "square:lightblue", "variableImage": "square:radial", "proportion": "=7/8" }')
rhtmlPictographs::graphic('{ "numImages": 1, "background-color": "#dddddd", "baseImage": "square:lightblue", "variableImage": "square:fromleft", "proportion": "=7/8" }')
rhtmlPictographs::graphic('{ "numImages": 1, "background-color": "#dddddd", "baseImage": "square:lightblue", "variableImage": "square:scale", "proportion": "=7/8" }')
rhtmlPictographs::graphic('{ "numImages": 1, "background-color": "#dddddd", "baseImage": "square:lightblue", "variableImage": "square:frombottom", "proportion": "=7/8" }')

#Rectangles
rhtmlPictographs::graphic('{ "numImages": 1, "background-color": "#dddddd", "baseImage": "rect:lightblue", "variableImage": "rect:radial", "proportion": "=7/8" }')
rhtmlPictographs::graphic('{ "numImages": 1, "background-color": "#dddddd", "baseImage": "rect:lightblue", "variableImage": "rect:fromleft", "proportion": "=7/8" }')
rhtmlPictographs::graphic('{ "numImages": 1, "background-color": "#dddddd", "baseImage": "rect:lightblue", "variableImage": "rect:scale", "proportion": "=7/8" }')
rhtmlPictographs::graphic('{ "numImages": 1, "background-color": "#dddddd", "baseImage": "rect:lightblue", "variableImage": "rect:frombottom", "proportion": "=7/8" }')

#Circles
rhtmlPictographs::graphic('{ "numImages": 1, "background-color": "#dddddd", "baseImage": "circle:lightblue", "variableImage": "circle:radial", "proportion": "=7/8" }')
rhtmlPictographs::graphic('{ "numImages": 1, "background-color": "#dddddd", "baseImage": "circle:lightblue", "variableImage": "circle:fromleft", "proportion": "=7/8" }')
rhtmlPictographs::graphic('{ "numImages": 1, "background-color": "#dddddd", "baseImage": "circle:lightblue", "variableImage": "circle:scale", "proportion": "=7/8" }')
rhtmlPictographs::graphic('{ "numImages": 1, "background-color": "#dddddd", "baseImage": "circle:lightblue", "variableImage": "circle:frombottom", "proportion": "=7/8" }')

#Ellipse
rhtmlPictographs::graphic('{ "numImages": 1, "background-color": "#dddddd", "baseImage": "ellipse:lightblue", "variableImage": "ellipse:radial", "proportion": "=7/8" }')
rhtmlPictographs::graphic('{ "numImages": 1, "background-color": "#dddddd", "baseImage": "ellipse:lightblue", "variableImage": "ellipse:fromleft", "proportion": "=7/8" }')
rhtmlPictographs::graphic('{ "numImages": 1, "background-color": "#dddddd", "baseImage": "ellipse:lightblue", "variableImage": "ellipse:scale", "proportion": "=7/8" }')
rhtmlPictographs::graphic('{ "numImages": 1, "background-color": "#dddddd", "baseImage": "ellipse:lightblue", "variableImage": "ellipse:frombottom", "proportion": "=7/8" }')

#External Image URL
##This shows a limitation of scaling an external image that doesn't "fit" the cell.
##In these examples a cell of 200x100 (or 100x200) contains an external image of a circle, which is scaled to fit such that the circle has a diameter of 100 and is centred in the cell.
##The issue is there is no way to now what proportion of the cell is occupied by the image, so the scaling takes place accross the entire cell, not just for the content occupied by the image.
rhtmlPictographs::graphic('{ "numImages": 1, "background-color": "#dddddd", "baseImage": "square:lightblue", "variableImage": "url:fromleft:/images/blue_circle_512.svg", "proportion": "=7/8" }')
rhtmlPictographs::graphic('{ "numImages": 1, "background-color": "#dddddd", "baseImage": "square:lightblue", "variableImage": "url:radial:/images/blue_circle_512.svg", "proportion": "=7/8" }')
rhtmlPictographs::graphic('{ "numImages": 1, "background-color": "#dddddd", "baseImage": "square:lightblue", "variableImage": "url:scale:/images/blue_circle_512.svg", "proportion": "=5/8" }')
rhtmlPictographs::graphic('{ "numImages": 1, "background-color": "#dddddd", "baseImage": "square:lightblue", "variableImage": "url:frombottom:/images/blue_circle_512.svg", "proportion": "=7/8" }')

#Recolored SVG
rhtmlPictographs::graphic('{ "numImages": 1, "background-color": "#dddddd", "variableImage": "url:radial:red:/images/blue_circle_512.svg", "proportion": "=7/8" }')
rhtmlPictographs::graphic('{ "numImages": 1, "background-color": "#dddddd", "variableImage": "url:fromleft:red:/images/blue_circle_512.svg", "proportion": "=7/8" }')
rhtmlPictographs::graphic('{ "numImages": 1, "background-color": "#dddddd", "variableImage": "url:scale:red:/images/blue_circle_512.svg", "proportion": "=6/8" }')
rhtmlPictographs::graphic('{ "numImages": 1, "background-color": "#dddddd", "variableImage": "url:frombottom:red:/images/blue_circle_512.svg", "proportion": "=7/8" }')
