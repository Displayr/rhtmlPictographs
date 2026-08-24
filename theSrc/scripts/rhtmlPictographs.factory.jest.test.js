/**
 * These specs touch document/window, so they need the jsdom environment. jest 29 defaults
 * testEnvironment to node, and rhtmlBuildUtils runs testSpecs without a jest config, so it is
 * declared per file rather than globally -- the puppeteer suites under theSrc/test/bin must stay
 * on the node environment.
 *
 * @jest-environment jsdom
 */
const widgetFactory = require('./rhtmlPictographs.factory')

test('VIS-1004: no error if resize called before renderValue', () => {
  const el = document.createElement('div')
  const factory = widgetFactory(el, 500, 400, () => {})
  factory.resize(600, 500)
})
