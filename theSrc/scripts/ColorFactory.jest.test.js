
const ColorFactory = require('./ColorFactory')

// TODO get rid of this ranOnce
let ranOnce = false

describe('ColorFactory class', function () {
  beforeEach(function () {
    // NB this doesn't follow test isolation but works for testing ColorFactory
    if (!ranOnce) {
      ranOnce = true
      ColorFactory.processNewConfig({
        palettes: {
          test: ['red', 'blue', 'green']
        },
        aliases: {
          primary: 'brown',
          secondary: 'yellow'
        }
      })
    }
  })

  it('round robins through a color palette', function () {
    expect(ColorFactory.getColor('test')).toEqual('red')
    expect(ColorFactory.getColor('test')).toEqual('blue')
    expect(ColorFactory.getColor('test')).toEqual('green')
    return expect(ColorFactory.getColor('test')).toEqual('red')
  })

  it('returns aliases', function () {
    expect(ColorFactory.getColor('primary')).toEqual('brown')
    return expect(ColorFactory.getColor('secondary')).toEqual('yellow')
  })

  it('passes everything else through', function () {
    expect(ColorFactory.getColor('pink')).toEqual('pink')
  })

  it('allows new aliases to be added', function () {
    ColorFactory.processNewConfig({ aliases: { anotheralias: 'blue'
    } })
    expect(ColorFactory.getColor('anotheralias')).toEqual('blue')
    expect(ColorFactory.getColor('primary')).toEqual('brown')
  })

  it('allows new palettes to be added', function () {
    ColorFactory.processNewConfig({ palettes: { anotherpalette: ['yellow'] } })
    expect(ColorFactory.getColor('anotherpalette')).toEqual('yellow')
    expect(ColorFactory.getColor('test')).toEqual('blue')
  }) // I will break if tests are added above ...

  it('accepts and overrides on duplicate definition of alias', function () {
    expect(() => ColorFactory.processNewConfig({ aliases: { primary: 'blue' } })).not.toThrow()
    expect(ColorFactory.getColor('primary')).toEqual('blue')
  })

  it('throws error on duplicate definition of alias that is an palette', function () {
    expect(() => ColorFactory.processNewConfig({ palettes: { primary: ['blue'] } })).toThrow()
  })

  it('accepts and overrides on duplicate definition of palette', function () {
    expect(() => ColorFactory.processNewConfig({ palettes: { test: ['pink'] } })).not.toThrow()
    expect(ColorFactory.getColor('test')).toEqual('pink')
  })

  it('throws error on duplicate definition of palette that is an alias', function () {
    expect(() => ColorFactory.processNewConfig({ palettes: { primary: ['blue'] } })).toThrow()
  })
})
