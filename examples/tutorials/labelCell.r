#This file is auto generated from /tutorials/labelCell.html
#The html examples and tutorial are the source of truth and are far more readable and beneficial. Start there (see readme for how).
#Use these r files for reference, but know that some instructional content is not transferred from the html to the r examples files
#TL;DR View the tutorial/example the way it was meant to be: in HTML format!

#Simplest Label Using shorthand "string syntax"
#Simplest Label, Multiple Label, Object as Label
## In its absolute simplest for we specify a label cell simply as a string that starts with "label:". In this for the cell does not even need to be an object with a '{type: 'label', value: ...}
## In the next simplest form, we specify the cell as an object with type=label, and use a single string for the "value" of the "value" key
## In the next simplest form, we specify an array of strings for the value
## If we need more control than that, we can set value to an object of keys, or an array of objects with keys
##The following parameters can be set once for the label cell:
##The following parameters can be set for each label:
## * padding-top: Sets padding above the first label
## * padding-inner: Sets padding between labels
## * padding-bottom: Sets padding below the last label
## * padding-left: Sets padding on left of label IF label is left aligned
## * padding-right: Sets padding on right of label ID label is right aligned
## * vertical-align: Sets the vertical alignment of the group of labels in the cell. Valid values are 'top', 'center', and 'bottom'.
## * background-color: Sets the background color.
## * text: The text of the label
## * font-family: A browser supported font - see mozilla docs
## * font-color: Sets the color of the font
## * font-size: Size of the font - see mozilla docs
## * font-weight: Weight of the font - see mozilla docs
## * font-variant: can be used to set small-caps - see example below - see mozilla docs
## * horizontal-align: set to left, center, or right. It aligns the text horizontally
## * any other valid CSS property that is valid on SVG Text
rhtmlPictographs::graphic('{ "table": { "rows": [ [ "label:A label" ] ] } }')
rhtmlPictographs::graphic('{ "table": { "rows": [ [ { "type": "label", "value": "A label" } ] ] } }')
rhtmlPictographs::graphic('{ "table": { "rows": [ [ { "type": "label", "value": [ "Line 1", "Line 2" ] } ] ] } }')
rhtmlPictographs::graphic('{ "table": { "rows": [ [ { "type": "label", "value": { "text": "A label", "font-color" : "red", "font-size": "20px", "font-family": "impact", "font-weight" : "100" } } ] ] } }')
rhtmlPictographs::graphic('{ "table": { "rows": [ [ { "type": "label", "value": [{ "text": "label 1" }, { "text": "label 2" }] } ] ] } }')

#Multi Label, With Padding, With Different Fonts on Each Line
rhtmlPictographs::graphic('{ "table": { "rows": [ [ { "type": "label", "value": { "padding-top": 10, "padding-inner": 18, "labels": [ "Line 1", { "text": "Line 2", "font-size": "14px", "font-color": "red" } ] } } ] ] } }')

#Setting a background color
rhtmlPictographs::graphic('{ "table": { "rows": [ [ { "type": "label", "value": { "background-color" : "#dddddd", "labels": [ "row1", "row2" ] } } ] ] } }')

#Vertical Text Alignment in labels
##By default, the labels are vertically centered, with all unallocated vertical space being split above and below the labels.
##The valid values for vertical-align are 'top', 'center', and 'bottom'
rhtmlPictographs::graphic('{ "table": { "rows": [ [ { "type": "label", "value": { "vertical-align": "top", "labels": [ "row1", "row2" ] } } ] ] } }')
rhtmlPictographs::graphic('{ "table": { "rows": [ [ { "type": "label", "value": { "padding-top": "15", "vertical-align": "top", "labels": [ "row1", "row2" ] } } ] ] } }')
rhtmlPictographs::graphic('{ "table": { "rows": [ [ { "type": "label", "value": { "vertical-align": "center", "labels": [ "row1", "row2" ] } } ] ] } }')
rhtmlPictographs::graphic('{ "table": { "rows": [ [ { "type": "label", "value": { "padding-bottom": "15", "vertical-align": "bottom", "labels": [ "row1", "row2" ] } } ] ] } }')
rhtmlPictographs::graphic('{ "table": { "rows": [ [ { "type": "label", "value": { "vertical-align": "bottom", "labels": [ "row1", "row2" ] } } ] ] } }')

#Horizontal Text Alignment in labels
##The attribute to control horizontal text alignment is called horizontal-align. In order to use horizontal-align you must specify the label as an object, not as a simple string.
##There are three options: left, middle, and right. For convenience the keywords "start", "centre", "center", and "end" are also valid.
##When specifying left aligned labels, you will probably want to add "padding-left" as well, so that the label does not crowd the border
##When specifying right aligned labels, you will probably want to add "padding-right" as well, so that the label does not crowd the border
rhtmlPictographs::graphic('{ "table": { "rows": [ [ { "type": "label", "value": { "text" : "A label", "horizontal-align": "left" } } ] ] } }')
rhtmlPictographs::graphic('{ "table": { "rows": [ [ { "type": "label", "value": { "text" : "A label", "horizontal-align": "center" } } ] ] } }')
rhtmlPictographs::graphic('{ "table": { "rows": [ [ { "type": "label", "value": { "text" : "A label", "horizontal-align": "right" } } ] ] } }')

#Putting all the label alignments together
rhtmlPictographs::graphic('{ "font-color": "lightblue", "font-family": "Arvo, serif", "table": { "rows": [ [ { "type": "label", "value": { "padding-top": "5", "padding-inner": "5", "padding-left": "15", "padding-right": "15", "labels": [ { "text" : "Left Aligned", "horizontal-align": "left" }, { "text" : "Center Aligned", "horizontal-align": "center" }, { "text" : "Right Aligned", "horizontal-align": "right" } ] } } ] ] } }')

#Using small capital letters
##The font-variant small-caps can be set, which renders all lower case letters as small upper case letters.
rhtmlPictographs::graphic('{ "font-color": "lightblue", "font-family": "Arvo, serif", "table": { "rows": [ [ { "type": "label", "value": { "padding-left" : 5, "padding-inner" : 5, "labels": [ { "horizontal-align": "left", "text" : "abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ", "font-variant": "small-caps" }, { "horizontal-align": "left", "text" : "abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ", "font-variant": "normal" } ] } } ] ] } }')
