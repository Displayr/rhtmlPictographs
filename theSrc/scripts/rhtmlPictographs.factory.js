import _ from 'lodash'
import d3 from 'd3'

import Pictograph from './Pictograph'
import DisplayError from './DisplayError'
import InsufficientContainerSizeError from './InsufficientContainerSizeError'

module.exports = function (element, width, height, stateChangedCallback) {
  const instance = new Pictograph(element)
  const isRendered = false // temporary flag for VIS-1004
  return {
    renderValue (inputConfig, userState) {
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
        if (err.type === InsufficientContainerSizeError.type) {
          console.log(err.message)
          d3.select(instance.rootElement).attr(`rhtmlPictographs-status`, 'ready')
        } else {
          _showError(err, element)
        }
      }
    },

    resize (newWidth, newHeight) {
      if (!isRendered) {
        throw new Error('VIS-1004: resize called before renderValue!')
      }
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
