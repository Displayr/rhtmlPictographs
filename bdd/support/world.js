const chai = require('chai')
const initializeApplitools = require('../../build/scripts/initializeApplitools')

module.exports = function () {
  this.context = {}

  this.expect = chai.expect

  // TODO remove global passing and use browser.params
  this.eyes = initializeApplitools.getEyes(global.visualDiffConfig)
}
