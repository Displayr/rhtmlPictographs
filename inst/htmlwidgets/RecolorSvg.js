// Generated by CoffeeScript 1.8.0
var RecolorSvg;

RecolorSvg = (function() {
  function RecolorSvg() {}

  RecolorSvg.fillReplacer = function(inputString, replacementValue) {
    var reducer, regexes, replacer;
    replacer = function(matchedString, prefix, fillValue, suffix, wholeString) {
      var replacement;
      replacement = fillValue.indexOf('none') !== -1 ? fillValue : replacementValue;
      return "" + prefix + replacement + suffix;
    };
    regexes = [new RegExp(/((?:fill|stroke)=")([^"]+)(")/g), new RegExp(/((?:fill|stroke)=')([^']+)(')/g), new RegExp(/((?:fill|stroke):)([^;'"]+)([;"'])/g)];
    reducer = function(newString, regex) {
      return newString.replace(regex, replacer);
    };
    return _.reduce(regexes, reducer, inputString);
  };

  RecolorSvg.recolor = function(svgObject, newColor, width, height) {
    var currentHeight, currentWidth, svgString;
    currentWidth = svgObject.attr('width');
    currentHeight = svgObject.attr('height');
    svgObject.attr('width', width);
    svgObject.attr('height', height);
    if (currentWidth && currentHeight && !svgObject.attr('viewBox')) {
      svgObject.attr('viewBox', "0 0 " + (currentWidth.replace(/(px|em)/, '')) + " " + (currentHeight.replace(/(px|em)/, '')));
    }
    svgString = $('<div />').append(svgObject).html();
    return RecolorSvg.fillReplacer(svgString, newColor);
  };

  return RecolorSvg;

})();