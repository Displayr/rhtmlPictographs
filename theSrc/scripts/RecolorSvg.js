const $ = require('jquery')
const _ = require('lodash')

class RecolorSvg {
  static fillReplacer (inputString, replacementValue) {
    const replacer = function (matchedString, prefix, fillValue, suffix) {
      const replacement = fillValue.indexOf('none') !== -1 ? fillValue : replacementValue
      return `${prefix}${replacement}${suffix}`
    }

    const regexes = [
      new RegExp(/((?:fill|stroke)=")([^"]+)(")/g),
      new RegExp(/((?:fill|stroke)=')([^']+)(')/g),
      new RegExp(/((?:fill|stroke):)([^;'"]+)([;"'])/g)
    ]

    const reducer = (newString, regex) => newString.replace(regex, replacer)

    return _.reduce(regexes, reducer, inputString)
  }

  static recolor ({ svg, color, x, y, width, height, preserveAspectRatio = 'xMidYMid meet' }) {
    const currentWidth = svg.attr('width')
    const currentHeight = svg.attr('height')

    svg.attr('x', x)
    svg.attr('y', y)
    svg.attr('width', width)
    svg.attr('height', height)
    svg.attr('preserveAspectRatio', preserveAspectRatio)

    if (currentWidth && currentHeight && !svg.attr('viewBox')) {
      svg.attr('viewBox', `0 0 ${currentWidth.replace(/(px|em)/, '')} ${currentHeight.replace(/(px|em)/, '')}`)
    }

    const svgString = $('<div />').append(svg).html()

    return RecolorSvg.fillReplacer(svgString, color)
  }
}

module.exports = RecolorSvg
