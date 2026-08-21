/**
 * These specs touch document/window, so they need the jsdom environment. jest 29 defaults
 * testEnvironment to node, and rhtmlBuildUtils runs testSpecs without a jest config, so it is
 * declared per file rather than globally -- the puppeteer suites under theSrc/test/bin must stay
 * on the node environment.
 *
 * @jest-environment jsdom
 */
const UrlType = require('./url.imagetype')

// VIS-932: image was temporarily shown in the background
test('that temporary image appended to body is not visible', () => {
  const urlType = new UrlType(null, { url: '' }, 0, 0, null, null)
  urlType._getImageWidthAndHeight()
  expect(document.body.children[0].style.visibility).toEqual('hidden')
})
