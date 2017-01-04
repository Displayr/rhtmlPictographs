import $ from 'jquery';
import _ from 'lodash';

class RecolorSvg {

  static fillReplacer(inputString, replacementValue) {
    const replacer = function (matchedString, prefix, fillValue, suffix) {
      const replacement = fillValue.indexOf('none') !== -1 ? fillValue : replacementValue;
      return `${prefix}${replacement}${suffix}`;
    };

    const regexes = [
      new RegExp(/((?:fill|stroke)=")([^"]+)(")/g),
      new RegExp(/((?:fill|stroke)=')([^']+)(')/g),
      new RegExp(/((?:fill|stroke):)([^;'"]+)([;"'])/g),
    ];

    const reducer = (newString, regex) => newString.replace(regex, replacer);

    return _.reduce(regexes, reducer, inputString);
  }

  static recolor(svgObject, newColor, x, y, width, height) {
    const currentWidth = svgObject.attr('width');
    const currentHeight = svgObject.attr('height');

    svgObject.attr('x', x);
    svgObject.attr('y', y);
    svgObject.attr('width', width);
    svgObject.attr('height', height);
    svgObject.attr('preserveAspectRatio', 'xMidYMid meet');

    if (currentWidth && currentHeight && !svgObject.attr('viewBox')) {
      svgObject.attr('viewBox', `0 0 ${currentWidth.replace(/(px|em)/, '')} ${currentHeight.replace(/(px|em)/, '')}`);
    }

    const svgString = $('<div />').append(svgObject).html();

    return RecolorSvg.fillReplacer(svgString, newColor);
  }
}

module.exports = RecolorSvg;
