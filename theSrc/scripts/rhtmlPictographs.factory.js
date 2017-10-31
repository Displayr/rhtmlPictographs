import _ from 'lodash'

import Pictograph from './Pictograph'
import DisplayError from './DisplayError'

module.exports = function (element, width, height, stateChangedCallback) {
  const instance = new Pictograph(element, width, height)
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
        return instance.draw()
      } catch (err) {
        _showError(err, element)
      }
    },

    resize (newWidth, newHeight) {
      return instance.resize(newWidth, newHeight)
    }
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
