const widgetFactory = require('./rhtmlPictographs.factory')

test('VIS-1004: no error if resize called before renderValue', () => {
  const el = document.createElement('div')
  const factory = widgetFactory(el, 500, 400, () => {})
  factory.resize(600, 500)
})
