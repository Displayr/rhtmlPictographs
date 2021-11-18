const { fontSizeWithPixelSuffix } = require('./fontSizeUtils')

test('fontSizeWithPixelSuffix', () => {
  expect(fontSizeWithPixelSuffix(10)).toEqual('10px')
})
