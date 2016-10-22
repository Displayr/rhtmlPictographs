describe 'ImageFactory class:', ->

  describe 'parseConfigString():', ->

    beforeEach ->
      @run = (configString, expectConfig) ->
        ImageFactory.parseConfigString configString
        expect(ImageFactory.parseConfigString configString).to.deep.equal expectConfig

    describe 'shapes:', ->
      # config parsing of shapes is currently identical, so detailed testing is in circle, this block just tests existence
      it 'is good', -> @run 'circle', { type: 'circle' }
      it 'is good', -> @run 'ellipse', { type: 'ellipse' }
      it 'is good', -> @run 'square', { type: 'square' }
      it 'is good', -> @run 'rect', { type: 'rect' }

    describe 'keyword handlers:', ->
      describe 'scaling techniques:', ->
        it 'is good', -> @run 'circle:scale', { type: 'circle', scale: true }
        it 'is good', -> @run 'circle:vertical', { type: 'circle', clip: 'fromBottom' }
        it 'is good', -> @run 'circle:horizontal', { type: 'circle', clip: 'fromLeft' }
        it 'is good', -> @run 'circle:radial', { type: 'circle', radialclip: true }
        it 'is good', -> @run 'circle:pie', { type: 'circle', radialclip: true }
        it 'is good', -> @run 'circle:fromleft', { type: 'circle', clip: 'fromLeft' }
        it 'is good', -> @run 'circle:fromright', { type: 'circle', clip: 'fromRight' }
        it 'is good', -> @run 'circle:frombottom', { type: 'circle', clip: 'fromBottom' }
        it 'is good', -> @run 'circle:fromtop', { type: 'circle', clip: 'fromTop' }

    describe 'specify colors:', ->
      it 'is good', -> @run 'circle', { type: 'circle' }
      it 'is good', -> @run 'circle:redcoat', { type: 'circle', color: 'redcoat' }
      it 'is good', -> @run 'circle:scale:redcoat', { type: 'circle', scale: true, color: 'redcoat' }
      it 'is good', -> @run 'circle:redcoat:scale', { type: 'circle', scale: true, color: 'redcoat' }
      it 'is good', -> @run 'circle:#123456:scale', { type: 'circle', scale: true, color: '#123456' }

    describe 'url:', ->
      it 'is good', -> @run 'http://example.com/foo', { type: 'url', url: 'http://example.com/foo' }
      it 'is good', -> @run 'https://example.com/foo', { type: 'url', url: 'https://example.com/foo' }
      it 'is good', -> @run 'url:http://example.com/foo', { type: 'url', url: 'http://example.com/foo' }
      it 'is good', -> @run 'url:scale:http://example.com/foo', { type: 'url', url: 'http://example.com/foo', scale: true }
      it 'is good', -> @run 'url:scale:foo.jpg', { type: 'url', url: 'foo.jpg', scale: true }
      it 'is good', -> @run 'url:/local/image.jpg', { type: 'url', url: '/local/image.jpg' }

    describe 'data urls:', ->
      it 'is good', -> @run 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgAAAAIMopbX+=', { type: 'data', url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgAAAAIMopbX+=' }
      it 'is good', -> @run 'data:scale:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgAAAAIMopbX+=', { type: 'data', url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgAAAAIMopbX+=', 'scale': true }

    describe 'invalid strings:', ->
      it 'empty string', -> expect( => @run '').to.throw(/invalid.*empty string/i)
      it 'invalid type', -> expect( => @run 'foo:red').to.throw(/invalid.*unknown.*type/i)
      it 'too many unknowns', -> expect( => @run 'circle:red:blue').to.throw(/too.*many.*unknown/i)
      it 'invalid url config', -> expect( => @run 'url').to.throw(/url string must end with a url/i)
      it 'invalid url config 2', -> expect( => @run 'url:scale:/foo.jpg:blue').to.throw(/url string must end with a url/i)
