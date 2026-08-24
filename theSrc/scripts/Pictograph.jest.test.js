/**
 * These specs touch document/window, so they need the jsdom environment. jest 29 defaults
 * testEnvironment to node, and rhtmlBuildUtils runs testSpecs without a jest config, so it is
 * declared per file rather than globally -- the puppeteer suites under theSrc/test/bin must stay
 * on the node environment.
 *
 * @jest-environment jsdom
 */
const Pictograph = require('./Pictograph')

test('VIS-895: no error if resize called when not attached to document', () => {
  const el = document.createElement('div') // not attached to document
  const pictograph = new Pictograph(el)
  pictograph.resize()
})
