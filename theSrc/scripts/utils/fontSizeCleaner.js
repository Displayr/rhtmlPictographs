const _ = require('lodash')

module.exports = {
  ensureObjectHasValidFontSize: function (obj, defaultFontSize) {
    if (!_.has(obj, 'font-size')) {
      obj['font-size'] = parseFloat(defaultFontSize)
      return
    }
    obj['font-size'] = parseFloat(obj['font-size'].replace(/^(\d+).*$/, '$1'))
  },
}
