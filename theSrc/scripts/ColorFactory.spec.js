
import ColorFactory from './ColorFactory';

// TODO get rid of this ranOnce
let ranOnce = false;

describe('ColorFactory class', function () {
  beforeEach(function () {
    // NB this doesn't follow test isolation but works for testing ColorFactory
    if (!ranOnce) {
      ranOnce = true;
      ColorFactory.processNewConfig({
        palettes: {
          test: ['red', 'blue', 'green'],
        },
        aliases: {
          primary: 'brown',
          secondary: 'yellow',
        },
      });
    }
  });

  it('round robins through a color palette', function () {
    expect(ColorFactory.getColor('test')).to.equal('red');
    expect(ColorFactory.getColor('test')).to.equal('blue');
    expect(ColorFactory.getColor('test')).to.equal('green');
    return expect(ColorFactory.getColor('test')).to.equal('red');
  });

  it('returns aliases', function () {
    expect(ColorFactory.getColor('primary')).to.equal('brown');
    return expect(ColorFactory.getColor('secondary')).to.equal('yellow');
  });

  it('passes everything else through', function () {
    expect(ColorFactory.getColor('pink')).to.equal('pink');
  });

  it('allows new aliases to be added', function () {
    ColorFactory.processNewConfig({ aliases: { anotheralias: 'blue',
    } });
    expect(ColorFactory.getColor('anotheralias')).to.equal('blue');
    expect(ColorFactory.getColor('primary')).to.equal('brown');
  });

  it('allows new palettes to be added', function () {
    ColorFactory.processNewConfig({ palettes: { anotherpalette: ['yellow'] } });
    expect(ColorFactory.getColor('anotherpalette')).to.equal('yellow');
    expect(ColorFactory.getColor('test')).to.equal('blue');
  }); // I will break if tests are added above ...

  it('throws error on duplicate definition of alias', function () {
    expect(() => ColorFactory.processNewConfig({ aliases: { primary: 'blue' } })).to.throw();
  });

  it('throws error on duplicate definition of alias that is an palette', function () {
    expect(() => ColorFactory.processNewConfig({ palettes: { primary: ['blue'] } })).to.throw();
  });

  it('throws error on duplicate definition of palette', function () {
    expect(() => ColorFactory.processNewConfig({ palettes: { test: ['blue'] } })).to.throw();
  });

  return it('throws error on duplicate definition of palette that is an alias', function () {
    expect(() => ColorFactory.processNewConfig({ palettes: { primary: ['blue'] } })).to.throw();
  });
});
