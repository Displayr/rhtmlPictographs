const Pictograph = require('./Pictograph')

test('VIS-895: no error if resize called when not attached to document', () => {
  const el = document.createElement('div') // not attached to document
  const pictograph = new Pictograph(el)
  pictograph.resize()
})
