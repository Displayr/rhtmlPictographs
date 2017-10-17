module.exports = function () {
  this.When(/^I resize the widget to ([0-9]+)x([0-9]+)$/, function (width, height) {
    function resize (width, height) {
      return window.resizeHook(parseInt(width), parseInt(height))
    }

    return browser.executeScript(resize, width, height)
  })
}
