const UrlType = require('./url.imagetype')

// VIS-932: image was temporarily shown in the background
test('that temporary image appended to body is not visible', () => {
  const urlType = new UrlType(null, { url: '' }, 0, 0, null, null)
  urlType._getImageWidthAndHeight()
  expect(document.body.children[0].style.visibility).toEqual('hidden')
})
