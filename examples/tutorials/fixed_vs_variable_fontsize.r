#This file is auto generated from /tutorials/fixed_vs_variable_fontsize.html
#The html examples and tutorial are the source of truth and are far more readable and beneficial. Start there (see readme for how).
#Use these r files for reference, but know that some instructional content is not transferred from the html to the r examples files
#TL;DR View the tutorial/example the way it was meant to be: in HTML format!

#Font size is fixed by default, can be configured
##By default, if no font-size is specified, then fonts will be fixed size and will stay the same size when the pictograph is resized.
##Any font that is specified in units of "px" will also stay the same size when the pictograph is resized.
##Any font that is specified without a unit, will resize when the pictograph is resized.
##Other font units, such as 'em' should not be used as they are not explicitly supported. They might work, but dont do it.
rhtmlPictographs::graphic('{ "font-size": "10px", "table": { "rows": [ [ "label:A", "label:A", "label:A", "label:A", "label:A" ], [ { "type": "label", "value": { "text": "A", "font-size": "10" } } ], [ "label:A" ], [ "label:A" ], [ "label:A" ] ] }} ')
rhtmlPictographs::graphic('{ "font-size": "10", "table": { "rows": [ [ "label:A", "label:A", "label:A", "label:A", "label:A" ], [ { "type": "label", "value": { "text": "A", "font-size": "10px" } } ], [ "label:A" ], [ "label:A" ], [ "label:A" ] ] }} ')
rhtmlPictographs::graphic('{ "table": { "rows": [ [ { "type": "graphic", "value": { "variableImage": "circle:lightblue", "text-overlay": { "text": "A", "font-size": "10" } } }, { "type": "graphic", "value": { "variableImage": "circle:lightblue", "text-overlay": { "text": "A", "font-size": "10px" } } } ] ] }} ')
