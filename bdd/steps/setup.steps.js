const Pictograph = require('../pageObjects/pictograph.page')

module.exports = function () {
  this.Before(function () {
    this.context.pictograph = new Pictograph()
  })
}
