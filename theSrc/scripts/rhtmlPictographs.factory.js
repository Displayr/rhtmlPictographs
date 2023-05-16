const _ = require('lodash')
const d3 = require('d3')
const Pictograph = require('./Pictograph')
const DisplayError = require('./DisplayError')
const InsufficientContainerSizeError = require('./InsufficientContainerSizeError')
const UserError = require('./UserError')

module.exports = function (element, width, height, stateChangedCallback) {
  const instance = new Pictograph(element)
  let isRenderValueCalled = false // temporary flag for VIS-1004
  return {
    renderValue (inputConfig, userState) {
      isRenderValueCalled = true
      let config = null
      try {
        config = _parseConfig(inputConfig)
      } catch (err) {
        const readableError = new Error(`Pictograph error : Cannot parse 'settingsJsonString': ${err}`)
        _showError(readableError, element)
      }

      try {
        instance.setConfig(config)
        instance.draw()
      } catch (err) {
        if (err.type === UserError.type) {
          // Show error on widget since we can't do warnings in R htmlwidgets but don't rethrow error
          const errorHandler = new DisplayError(element, err)
          errorHandler.draw()
          d3.select(instance.rootElement).attr(`rhtmlwidget-status`, 'ready')
        } else if (err.type === InsufficientContainerSizeError.type) {
          console.log(err.message)
          d3.select(instance.rootElement).attr(`rhtmlwidget-status`, 'ready')
        } else {
          _showError(err, element)
        }
      }
    },

    resize (newWidth, newHeight) {
      if (!isRenderValueCalled) { return }
      instance.resize()
    },
  }
}

function _parseConfig (inputConfig) {
  if (_.isString(inputConfig) && inputConfig.match(/^{/)) {
    return JSON.parse(inputConfig)
  } else {
    return inputConfig
  }
}

function _showError (error, element) {
  console.error(error.stack)
  const errorHandler = new DisplayError(element, error)
  errorHandler.draw()
  throw new Error(error)
}
