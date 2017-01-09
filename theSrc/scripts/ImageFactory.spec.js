import ImageFactory from './ImageFactory';

describe('ImageFactory class:', function () {
  describe('parseConfigString():', function () {
    beforeEach(function () {
      this.run = function (configString, expectConfig) {
        ImageFactory.parseConfigString(configString);
        expect(ImageFactory.parseConfigString(configString)).to.deep.equal(expectConfig);
      };
    });

    describe('shapes:', function () {
      // NB config parsing of shapes is currently identical, so the detailed testing is done in circle,
      // and this block just tests existence
      it('is good', function () { this.run('circle', { type: 'circle' }); });
      it('is good', function () { this.run('ellipse', { type: 'ellipse' }); });
      it('is good', function () { this.run('square', { type: 'square' }); });
      it('is good', function () { this.run('rect', { type: 'rect' }); });
    });

    describe('keyword handlers:', () =>
      describe('scaling techniques:', function () {
        it('is good', function () { this.run('circle:scale', { type: 'circle', scale: true }); });
        it('is good', function () { this.run('circle:vertical', { type: 'circle', clip: 'fromBottom' }); });
        it('is good', function () { this.run('circle:horizontal', { type: 'circle', clip: 'fromLeft' }); });
        it('is good', function () { this.run('circle:radial', { type: 'circle', radialclip: true }); });
        it('is good', function () { this.run('circle:pie', { type: 'circle', radialclip: true }); });
        it('is good', function () { this.run('circle:fromleft', { type: 'circle', clip: 'fromLeft' }); });
        it('is good', function () { this.run('circle:fromright', { type: 'circle', clip: 'fromRight' }); });
        it('is good', function () { this.run('circle:frombottom', { type: 'circle', clip: 'fromBottom' }); });
        it('is good', function () { this.run('circle:fromtop', { type: 'circle', clip: 'fromTop' }); });
      }));

    describe('specify colors:', function () {
      it('is good', function () { this.run('circle', { type: 'circle' }); });
      it('is good', function () { this.run('circle:redcoat', { type: 'circle', color: 'redcoat' }); });
      it('is good', function () { this.run('circle:scale:redcoat', { type: 'circle', scale: true, color: 'redcoat' }); });
      it('is good', function () { this.run('circle:redcoat:scale', { type: 'circle', scale: true, color: 'redcoat' }); });
      it('is good', function () { this.run('circle:#123456:scale', { type: 'circle', scale: true, color: '#123456' }); });
    });

    describe('url:', function () {
      it('is good', function () { this.run('http://example.com/foo', { type: 'url', url: 'http://example.com/foo' }); });
      it('is good', function () { this.run('https://example.com/foo', { type: 'url', url: 'https://example.com/foo' }); });
      it('is good', function () { this.run('url:http://example.com/foo', { type: 'url', url: 'http://example.com/foo' }); });
      it('is good', function () { this.run('url:scale:http://example.com/foo', { type: 'url', url: 'http://example.com/foo', scale: true }); });
      it('is good', function () { this.run('url:scale:foo.jpg', { type: 'url', url: 'foo.jpg', scale: true }); });
      it('is good', function () { this.run('url:/local/image.jpg', { type: 'url', url: '/local/image.jpg' }); });
    });

    describe('data urls:', function () {
      it('is good', function () { this.run('data:image/png;base64,iVBOBblahblahX+=', { type: 'data', url: 'data:image/png;base64,iVBOBblahblahX+=' }); });
      it('is good', function () { this.run('data:scale:image/png;base64,iVBOBblahblahX+=', { type: 'data', url: 'data:image/png;base64,iVBOBblahblahX+=', scale: true }); });
    });

    describe('invalid strings:', function () {
      it('empty string', function () { expect(() => this.run('')).to.throw(/invalid.*empty string/i); });
      it('invalid type', function () { expect(() => this.run('foo:red')).to.throw(/invalid.*unknown.*type/i); });
      it('too many unknowns', function () { expect(() => this.run('circle:red:blue')).to.throw(/too.*many.*unknown/i); });
      it('invalid url config', function () { expect(() => this.run('url')).to.throw(/url string must end with a url/i); });
      it('invalid url config 2', function () { expect(() => this.run('url:scale:/foo.jpg:blue')).to.throw(/url string must end with a url/i); });
    });
  });
});
