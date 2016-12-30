
ranOnce = false

describe 'ColorFactory class', ->

  beforeEach ->
    #NB this doesn't follow test isolation but works for testing ColorFactory
    unless ranOnce
      ranOnce = true
      ColorFactory.processNewConfig {
        palettes:
          test: ['red', 'blue', 'green' ]
        aliases:
          primary: 'brown'
          secondary: 'yellow'
      }

  it 'round robins through a color palette', ->

    expect(ColorFactory.getColor('test')).to.equal 'red'
    expect(ColorFactory.getColor('test')).to.equal 'blue'
    expect(ColorFactory.getColor('test')).to.equal 'green'
    expect(ColorFactory.getColor('test')).to.equal 'red'

  it 'returns aliases', ->

    expect(ColorFactory.getColor('primary')).to.equal 'brown'
    expect(ColorFactory.getColor('secondary')).to.equal 'yellow'

  it 'passes everything else through', ->

    expect(ColorFactory.getColor('pink')).to.equal 'pink'

  it 'allows new aliases to be added', ->
    ColorFactory.processNewConfig aliases: anotheralias: 'blue'
    expect(ColorFactory.getColor('anotheralias')).to.equal 'blue'
    expect(ColorFactory.getColor('primary')).to.equal 'brown'

  it 'allows new palettes to be added', ->
    ColorFactory.processNewConfig palettes: anotherpalette: ['yellow']
    expect(ColorFactory.getColor('anotherpalette')).to.equal 'yellow'
    expect(ColorFactory.getColor('test')).to.equal 'blue' # I will break if tests are added above ...

  it 'accepts and overrides on duplicate definition of alias', ->
    expect(-> ColorFactory.processNewConfig aliases: primary: 'blue').not.to.throw()
    #TODO test the override

  it 'throws error on duplicate definition of alias that is an palette', ->
    expect(-> ColorFactory.processNewConfig palettes: primary: ['blue']).to.throw()

  it 'accepts and overrides on duplicate definition of palette', ->
    expect(-> ColorFactory.processNewConfig palettes: test: ['blue']).not.to.throw()
    #TODO test the override

  it 'throws error on duplicate definition of palette that is an alias', ->
    expect(-> ColorFactory.processNewConfig palettes: primary: ['blue']).to.throw()
