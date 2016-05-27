
class RecolorSvg

  @fillReplacer: (inputString, replacementValue) ->

    replacer = (matchedString, prefix, fillValue, suffix, wholeString) ->
      replacement = if fillValue.indexOf('none') != -1 then fillValue else replacementValue
      "#{prefix}#{replacement}#{suffix}"

    regexes = [
      new RegExp(/((?:fill|stroke)=")([^"]+)(")/g)
      new RegExp(/((?:fill|stroke)=')([^']+)(')/g)
      new RegExp(/((?:fill|stroke):)([^;'"]+)([;"'])/g)
    ]

    reducer = (newString, regex) ->
      newString.replace(regex, replacer)

    _.reduce(regexes, reducer, inputString)

  @recolor: (svgObject, newColor, width, height) ->

    currentWidth = svgObject.attr 'width'
    currentHeight = svgObject.attr 'height'

    svgObject.attr 'width', width
    svgObject.attr 'height', height

    if currentWidth and currentHeight and !svgObject.attr('viewBox')
      svgObject.attr 'viewBox', "0 0 #{currentWidth.replace(/(px|em)/, '')} #{currentHeight.replace(/(px|em)/, '')}"

    svgString = $('<div />').append(svgObject).html();

    return RecolorSvg.fillReplacer svgString, newColor

