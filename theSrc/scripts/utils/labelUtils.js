const _ = require('lodash')

// NB Our method for caclulating label dimensions is pretty good but is not exact
const labelSizeCorrection = {
  width: { relative: 1.02, fixed: 0 },
  height: { relative: 1.02, fixed: 0 },
}

const makeDivForEstimation = (labelConfig) => {
  // TODO copied from cssDefaults in Pictograph
  const defaults = {
    'font-family': 'Verdana,sans-serif',
    'font-weight': '900',
    'font-size': '24',
  }

  function getAttribute (attribute) {
    if (_.has(labelConfig, attribute)) {
      return labelConfig[attribute]
    }
    return defaults[attribute]
  }

  // Build the measurement div with DOM APIs and set the label via textContent
  // so untrusted label text is never parsed as HTML (RS-22478).
  const div = document.createElement('div')
  div.style.fontSize = getAttribute('font-size')
  div.style.fontFamily = getAttribute('font-family')
  div.style.fontWeight = getAttribute('font-weight')
  div.textContent = labelConfig.text
  return div
}

const ensureFontSizeHasPx = (labelConfig) => {
  labelConfig['font-size'] = `${labelConfig['font-size']}px`
  return labelConfig
}

module.exports = {
  calculateLabelDimensions: function (incomingLabels, padding) {
    const labels = (_.isArray(incomingLabels))
      ? _.cloneDeep(incomingLabels)
      : [_.cloneDeep(incomingLabels)]

    const labelDivsForEstimation = _(labels)
      .map(ensureFontSizeHasPx)
      .map(makeDivForEstimation).value()
    const divWrapper = document.createElement('div')
    divWrapper.style.position = 'fixed'
    divWrapper.style.visibility = 'hidden'
    divWrapper.style.width = 'max-content'
    labelDivsForEstimation.forEach((div) => divWrapper.appendChild(div))
    document.body.appendChild(divWrapper)
    const { width: textWidth, height: textHeight } = divWrapper.getBoundingClientRect()
    divWrapper.remove()

    const height = textHeight +
      ((_.has(padding, 'inner')) ? padding.inner * (labels.length - 1) : 0) +
      padding.top +
      padding.bottom

    const width = textWidth +
      padding.left +
      padding.right

    return {
      width: width * labelSizeCorrection.width.relative + labelSizeCorrection.width.fixed,
      height: height * labelSizeCorrection.height.relative + labelSizeCorrection.height.fixed,
    }
  },
}
