const _ = require('lodash')
const ImageFactory = require('./ImageFactory')

describe('ImageFactory class:', function () {
  describe('parseConfig():', function () {
    const runTest = function (configString, expectConfig) {
      const actualConfig = ImageFactory.parseConfig(configString)
      expect(actualConfig).toEqual(expectConfig)
    }

    describe('shapes:', function () {
      // NB config parsing of shapes is currently identical, so the detailed testing is done in circle,
      // and this block just tests existence
      it('parses correctly', function () { runTest('circle', { type: 'circle' }) })
      it('parses correctly', function () { runTest('ellipse', { type: 'ellipse' }) })
      it('parses correctly', function () { runTest('square', { type: 'square' }) })
      it('parses correctly', function () { runTest('rect', { type: 'rect' }) })
    })

    describe('keyword handlers:', function () {
      describe('scaling techniques:', function () {
        it('parses correctly', function () { runTest('circle:scale', { type: 'circle', scale: true }) })
        it('parses correctly', function () { runTest('circle:vertical', { type: 'circle', clip: 'frombottom' }) })
        it('parses correctly', function () { runTest('circle:horizontal', { type: 'circle', clip: 'fromleft' }) })
        it('parses correctly', function () { runTest('circle:radial', { type: 'circle', clip: 'radial' }) })
        it('parses correctly', function () { runTest('circle:pie', { type: 'circle', clip: 'radial' }) })
        it('parses correctly', function () { runTest('circle:fromleft', { type: 'circle', clip: 'fromleft' }) })
        it('parses correctly', function () { runTest('circle:fromright', { type: 'circle', clip: 'fromright' }) })
        it('parses correctly', function () { runTest('circle:frombottom', { type: 'circle', clip: 'frombottom' }) })
        it('parses correctly', function () { runTest('circle:fromtop', { type: 'circle', clip: 'fromtop' }) })
      })
    })

    describe('specify colors:', function () {
      it('parses correctly', function () { runTest('circle', { type: 'circle' }) })
      it('parses correctly', function () { runTest('circle:redcoat', { type: 'circle', color: 'redcoat' }) })
      it('parses correctly', function () { runTest('circle:scale:redcoat', { type: 'circle', scale: true, color: 'redcoat' }) })
      it('parses correctly', function () { runTest('circle:redcoat:scale', { type: 'circle', scale: true, color: 'redcoat' }) })
      it('parses correctly', function () { runTest('circle:#123456:scale', { type: 'circle', scale: true, color: '#123456' }) })
    })

    describe('url:', function () {
      it('parses correctly', function () { runTest('http://example.com/foo', { type: 'url', url: 'http://example.com/foo' }) })
      it('parses correctly', function () { runTest('https://example.com/foo', { type: 'url', url: 'https://example.com/foo' }) })
      it('parses correctly', function () { runTest('url:http://example.com/foo', { type: 'url', url: 'http://example.com/foo' }) })
      it('parses correctly', function () { runTest('url:scale:http://example.com/foo', { type: 'url', url: 'http://example.com/foo', scale: true }) })
      it('parses correctly', function () { runTest('url:scale:foo.jpg', { type: 'url', url: 'foo.jpg', scale: true }) })
      it('parses correctly', function () { runTest('url:/local/image.jpg', { type: 'url', url: '/local/image.jpg' }) })
    })

    describe('data urls:', function () {
      it('parses correctly', function () { runTest('data:image/png;base64,iVBOBblahblahX+=', { type: 'data', url: 'data:image/png;base64,iVBOBblahblahX+=' }) })
      it('parses correctly', function () { runTest('data:scale:image/png;base64,iVBOBblahblahX+=', { type: 'data', url: 'data:image/png;base64,iVBOBblahblahX+=', scale: true }) })
    })

    describe('recolored svg urls:', function () {
      it('parses correctly', function () { runTest('url:red:/local/image.svg', { type: 'recoloredExternalSvg', url: '/local/image.svg', color: 'red' }) })

      it('rejects other types of url recolor requests', function () {
        const thrower = function () {
          ImageFactory.parseConfig('url:red:/local/image.jpg')
        }
        expect(thrower).toThrow('unsupported image type')
      })
    })

    describe('preserveAspectRatio validation:', function () {
      const tests = [
        'none : valid',
        'xMinYMin : valid',
        'xMidYMin : valid',
        'xMaxYMin : valid',
        'xMinYMid : valid',
        'xMidYMid : valid',
        'xMaxYMid : valid',
        'xMinYMax : valid',
        'xMidYMax : valid',
        'xMaxYMax : valid',

        'xMinYMin slice : valid',
        'xMidYMin slice : valid',
        'xMaxYMin slice : valid',
        'xMinYMid slice : valid',
        'xMidYMid slice : valid',
        'xMaxYMid slice : valid',
        'xMinYMax slice : valid',
        'xMidYMax slice : valid',
        'xMaxYMax slice : valid',

        'xMinYMin meet : valid',
        'xMidYMin meet : valid',
        'xMaxYMin meet : valid',
        'xMinYMid meet : valid',
        'xMidYMid meet : valid',
        'xMaxYMid meet : valid',
        'xMinYMax meet : valid',
        'xMidYMax meet : valid',
        'xMaxYMax meet : valid',

        ' : invalid',
        'dogs : invalid',
        'xMinYMin dogs : invalid'
      ]

      _(tests).each((testDefinitionString) => {
        const [testString, valid] = testDefinitionString.split(' : ')
        it(`${testString} is ${valid}`, function () {
          const expectation = expect(() => {
            ImageFactory.parseConfig({
              type: 'url',
              url: '/foo.svg',
              preserveAspectRatio: testString
            })
          })

          if (valid === 'valid') {
            expectation.not.toThrow()
          } else {
            expectation.toThrow(/Invalid preserveAspectRatio string/i)
          }
        })
      })
    })

    describe('invalid config:', function () {
      it('empty string', function () { expect(() => runTest('')).toThrow(/invalid.*empty string/i) })
      it('invalid type', function () { expect(() => runTest('foo:red')).toThrow(/invalid.*unknown.*type/i) })
      it('too many unknowns', function () { expect(() => runTest('circle:red:blue')).toThrow(/too.*many.*unknown/i) })
      it('invalid url config', function () { expect(() => runTest('url')).toThrow(/url string must end with a url/i) })
      it('invalid url config 2', function () { expect(() => runTest('url:scale:/foo.jpg:blue')).toThrow(/url string must end with a url/i) })
    })
  })
})
