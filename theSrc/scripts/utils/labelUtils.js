const _ = require('lodash')
const $ = require('jquery')

// NB Our method for caclulating label dimensions is pretty good but is not exact
const labelSizeCorrection = {
  width: { relative: 1.02, fixed: 0 },
  height: { relative: 1.02, fixed: 0 }
}

const makeDivForEstimation = (labelConfig) => {
  // TODO copied from cssDefaults in Pictograph
  const defaults = {
    'font-family': 'Verdana,sans-serif',
    'font-weight': '900',
    'font-size': '24'
  }

  function getAttribute (attribute) {
    if (_.has(labelConfig, attribute)) {
      return labelConfig[attribute]
    }
    return defaults[attribute]
  }

  const styleComponents = [
    `font-size:${getAttribute('font-size')}`,
    `font-family:${getAttribute('font-family')}`,
    `font-weight:${getAttribute('font-weight')}`
  ]
  return `<div style="${styleComponents.join(';')}">${labelConfig.text}</div>`
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

    const uniqueId = `${Math.random()}`.replace('.', '')
    const textDivsForEstimation = _(labels)
      .map(ensureFontSizeHasPx)
      .map(makeDivForEstimation).value()
    const divWrapper = $(`<div id="${uniqueId}" style="display:inline-block">`)

    divWrapper.html(textDivsForEstimation)
    $(document.body).append(divWrapper)
    const { width: textWidth, height: textHeight } = document.getElementById(uniqueId).getBoundingClientRect()
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
      height: height * labelSizeCorrection.height.relative + labelSizeCorrection.height.fixed
    }
  }
}
