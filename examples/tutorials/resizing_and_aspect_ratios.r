#This file is auto generated from /tutorials/resizing_and_aspect_ratios.html
#The html examples and tutorial are the source of truth and are far more readable and beneficial. Start there (see readme for how).
#Use these r files for reference, but know that some instructional content is not transferred from the html to the r examples files
#TL;DR View the tutorial/example the way it was meant to be: in HTML format!

#Resizable by default, can be configured
##By default, pictographs are resizable. This can be changed by setting resizable: false ( resizable: "false" ) in the config.
##Note in the non-resizable examples below, the shape still moves around a bit when its container is changed, but it is not actually moved, In displayr it will not move around.
rhtmlPictographs::graphic('{ "table": { "rows": [ [ "circle:lightblue" ] ] } } ')
rhtmlPictographs::graphic('{ "resizable": "false", "table": { "rows": [ [ "circle:lightblue" ] ] } } ')

#Preserve aspect ratio by default, can be configured
##The preserveAspectRatio controls whether the aspect ratio is fixed during a resize, and also controls the positioning of the graphic within the container if the aspect ratio is preserved.
##This setting is documented here : https://developer.mozilla.org/en/docs/Web/SVG/Attribute/preserveAspectRatio
##The default value is xMidyMid, which preserves aspect ratio, and vertically and horizontally centres the graphic
##To ignore the initial aspect ratio on resize, set preserveAspectRatio to none
##The examples below also show show how to alter the positioning by Changing Mid to Min or Max.
rhtmlPictographs::graphic('{ "preserveAspectRatio" : "none", "table": { "rows": [ [ "ellipse:lightblue" ] ] } } ')
rhtmlPictographs::graphic('{ "preserveAspectRatio" : "xMidYMid", "table": { "rows": [ [ "ellipse:lightblue" ] ] } } ')
rhtmlPictographs::graphic('{ "preserveAspectRatio" : "xMidYMin", "table": { "rows": [ [ "ellipse:lightblue" ] ] } } ')
rhtmlPictographs::graphic('{ "preserveAspectRatio" : "xMidYMax", "table": { "rows": [ [ "ellipse:lightblue" ] ] } } ')
rhtmlPictographs::graphic('{ "preserveAspectRatio" : "xMinYMid", "table": { "rows": [ [ "ellipse:lightblue" ] ] } } ')
rhtmlPictographs::graphic('{ "preserveAspectRatio" : "xMaxYMid", "table": { "rows": [ [ "ellipse:lightblue" ] ] } } ')
