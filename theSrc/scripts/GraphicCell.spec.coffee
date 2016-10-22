describe 'GraphicCell class', ->

  makeRatioTestsFor = (key) ->

    #NB this is hard to understand, but basically i cant do a one line object generation when the key is dynamic
    makeConfig = (v) ->
      c = {}
      c[key] = v
      c

    describe 'must be an float between 0 and 1 inclusive:', ->
      it "#{key}=-1 causes errors", -> expect(=> @withConfig makeConfig(-1)).to.throw new RegExp "#{key}"
      it "#{key}=2 causes errors", -> expect(=> @withConfig makeConfig(2)).to.throw new RegExp "#{key}"
      it "#{key}='dogs' causes errors", -> expect(=> @withConfig makeConfig('dogs')).to.throw new RegExp "#{key}"
      it "#{key}='0' is ok", -> expect(=> @withConfig makeConfig('0')).not.to.throw()
      it "#{key}='0.5' is ok", -> expect(=> @withConfig makeConfig('0.5')).not.to.throw()

  maketextHandlingTestsFor = (key) ->

    #NB this is hard to understand, but basically i cant do a one line object generation when the key is dynamic
    makeConfig = (v, extra={}) ->
      c = {}
      c[key] = v
      _.extend c, extra

    beforeEach ->
      @baseCellSetCssSpy = sinon.spy BaseCell.prototype, 'setCss'
      BaseCell.setDefault 'font-size', '24px'

      @wasSet = (param) ->
        cssThatWasSet = @baseCellSetCssSpy.args.map (callValues) -> callValues[1]
        expect(cssThatWasSet).to.include param

    afterEach ->
      BaseCell.prototype.setCss.restore()
      BaseCell.resetDefaults()

    describe 'string as input:', ->
        it 'builds the config object and uses BaseCell.default font-size', ->
          @withConfig makeConfig 'test-text'
          expect(@instance.config[key]).to.deep.equal {
            text: 'test-text'
            'font-size': '24px'
            'horizontal-align': 'middle'
            'padding-left': 1
            'padding-right': 1
          }

    describe 'object as input:', ->
      it 'must have a text field', ->
        expect( => @withConfig makeConfig {}).to.throw new RegExp 'must have text field'

      it 'calls setCss on all its members', ->
        @withConfig makeConfig {
          text: 'test-text'
          'font-size': '12px'
          'font-family': 'fam'
          'font-color': 'blue'
          'font-weight': '900'
        }

        expect(@instance.config[key]).to.deep.equal {
          text: 'test-text'
          'font-size': '12px'
          'font-family': 'fam'
          'font-color': 'blue'
          'font-weight': '900'
          'horizontal-align': 'middle'
          'padding-left': 1
          'padding-right': 1
        }

        @wasSet 'font-family'
        @wasSet 'font-color'
        @wasSet 'font-weight'

      describe 'horizontal-alignment', ->
        beforeEach ->
          @testHorizontalAlignConfigHandling = (input, expectedOut) ->
            @withConfig makeConfig { text: 'foo', 'horizontal-align' : input }
            expect(@instance.config[key]['horizontal-align']).to.equal expectedOut

        it 'accepts centre', -> @testHorizontalAlignConfigHandling('centre', 'middle')
        it 'accepts center', -> @testHorizontalAlignConfigHandling('center', 'middle')
        it 'accepts middle', -> @testHorizontalAlignConfigHandling('middle', 'middle')
        it 'accepts left', -> @testHorizontalAlignConfigHandling('left', 'start')
        it 'accepts start', -> @testHorizontalAlignConfigHandling('start', 'start')
        it 'accepts end', -> @testHorizontalAlignConfigHandling('end', 'end')
        it 'accepts right', -> @testHorizontalAlignConfigHandling('right', 'end')

        it 'rejects everything else', ->
          expect( => @withConfig makeConfig { text: 'foo', 'horizontal-align' : 'cats' }).to.throw new RegExp 'Invalid horizontal align'

      describe '"proportion" keyword:', ->

        it 'accepts proportion in string form and uses the proportion as text value', ->
          @withConfig makeConfig 'proportion', { proportion: '0.123' }
          expect(@instance.config[key].text).to.equal '0.123'

        it 'accepts proportion in string form and uses the proportion as text value', ->
          @withConfig makeConfig { text: 'proportion' }, { proportion: '0.123' }
          expect(@instance.config[key].text).to.equal '0.123'

        it 'does not display insignificant 0 characters', ->
          @withConfig makeConfig { text: 'proportion' }, { proportion: '0.5' }
          expect(@instance.config[key].text).to.equal '0.5'

      describe '"percentage" keyword:', ->

        it 'accepts percentage in string form and uses the percentage as text value', ->
          @withConfig makeConfig 'percentage', { proportion: '=2/3' }
          expect(@instance.config[key].text).to.equal '66.7%'

        it 'accepts percentage in string form and uses the percentage as text value', ->
          @withConfig makeConfig { text: 'percentage' }, { proportion: '=2/3' }
          expect(@instance.config[key].text).to.equal '66.7%'

        it 'does not display insignificant 0 characters', ->
          @withConfig makeConfig { text: 'percentage' }, { proportion: '=1/2' }
          expect(@instance.config[key].text).to.equal '50%'

  beforeEach ->
    @withConfig = (config, width=100, height=100) ->
      sizes = ratios: textSize: 1
      @instance = new GraphicCell 'dummySvg', ['parentSelector'], width, height, sizes

      config.variableImage ?= 'image1'
      @instance.setConfig config

  describe 'setConfig():', ->

    it 'clones config so cannot be manipulated from outside', ->
      @outerConfig = { variableImage: 'image1' }
      @withConfig @outerConfig
      @outerConfig.mittens = 'foo'

      expect(@instance.config).not.to.have.property 'mittens'

    it 'rejects unknown root attributes', ->
      @unknownVariables = { foo: 'bar' }
      expect(=> @withConfig @unknownVariables).to.throw(/foo/)

    describe 'variableImage:', ->
      it 'is required', ->
        thrower = () =>
          @instance = new GraphicCell 'dummySvg', ['parentSelector'], 100, 100
          @instance.setConfig {}
        expect(thrower).to.throw new RegExp "Must specify 'variableImage'"

    describe 'baseImage:', ->
      it 'is optional', ->
        expect( => @withConfig {}).not.to.throw()

    describe 'width/height:', ->
      it 'are required', ->
        expect( => new GraphicCell 'dummySvg', ['parentSelector']).to.throw new RegExp /width/
        expect( => new GraphicCell 'dummySvg', ['parentSelector'], width=4).to.throw new RegExp /height/

      it 'must be positive', ->
        expect( => @withConfig {}, 0, 1).to.throw new RegExp /width/
        expect( => @withConfig {}, 1, 0).to.throw new RegExp /height/

    describe 'numRows/numCols/numImages:', ->

      describe 'defaults:', ->
        beforeEach -> @withConfig {}
        it 'numImages defaults to 1', -> expect(@instance.config.numImages).to.equal 1
        it 'numRows defaults to undefined', -> expect(@instance.config).not.to.have.property 'numRows'
        it 'numCols defaults to undefined', -> expect(@instance.config).not.to.have.property 'numCols'

      describe 'only accepts positive integers:', ->
        it 'numRows=0 causes errors', -> expect(=> @withConfig { numRows: 0 }).to.throw new RegExp 'Must be positive integer'
        it 'numCols=0 causes errors', -> expect(=> @withConfig { numCols: 0 }).to.throw new RegExp 'Must be positive integer'
        it 'numImages=0 causes errors', -> expect(=> @withConfig { numImages: 0 }).to.throw new RegExp 'Must be positive integer'

        it 'numRows=dogs causes errors', -> expect(=> @withConfig { numRows: 'dogs' }).to.throw new RegExp 'Must be integer'
        it 'numCols=dogs causes errors', -> expect(=> @withConfig { numCols: 'dogs' }).to.throw new RegExp 'Must be integer'
        it 'numImages=dogs causes errors', -> expect(=> @withConfig { numImages: 'dogs' }).to.throw new RegExp 'Must be integer'

        it 'numRows="2" is ok', -> expect(=> @withConfig { numRows: '2' }).not.to.throw()
        it 'numCols="2" is ok', -> expect(=> @withConfig { numCols: '2' }).not.to.throw()
        it 'numImages="2" is ok', -> expect(=> @withConfig { numImages: '2' }).not.to.throw()

      it 'throws error when both numRows and numCols is provided', ->
        expect(=> @withConfig { numRows: 2, numCols: 2 }).to.throw new RegExp 'Cannot specify both numRows and numCols'

    describe '"proportion" handling:', ->

      it 'defaults to 1', ->
        @withConfig {}
        expect(@instance.config.proportion).to.equal 1

      makeRatioTestsFor 'proportion'

      describe 'interpret strings starting with "="', ->
        it 'proportion="=3/4" will compute to 0.75', ->
          @withConfig { proportion: '=3/4' }
          expect(@instance.config.proportion).to.equal 0.75

        it 'proportion="=5/4" will throw error (out of bounds)', -> expect(=> @withConfig { proportion: '=5/4' }).to.throw new RegExp 'proportion'

    describe '"padding" handling:', ->
      describe 'defaults:', ->
        beforeEach -> @withConfig {}
        it 'rowGutter set to 0.05', -> expect(@instance.config.rowGutter).to.equal 0.05
        it 'columnGutter set to 0.05', -> expect(@instance.config.columnGutter).to.equal 0.05
        it 'sets padding to all zeros', -> expect(@instance.config.padding).to.deep.equal { top: 0, right: 0, bottom: 0, left: 0 }

      describe 'must be an float between 0 and 1 inclusive:', ->
        makeRatioTestsFor 'rowGutter'
        makeRatioTestsFor 'columnGutter'

      it 'parses the padding string', ->
        @withConfig { padding: '10 15 20 25' }
        expect(@instance.config.padding).to.deep.equal { top: 10, right: 15, bottom: 20, left: 25 }

      it 'rejects non Integer padding values', ->
        expect( => @withConfig { padding: 'twelve 15 20 25' }).to.throw(/Invalid padding/)

    describe 'text handling:', ->

      describe 'text-header', ->
        maketextHandlingTestsFor 'text-header'

      describe 'text-overlay', ->
        maketextHandlingTestsFor 'text-overlay'

      describe 'text-footer', ->
        maketextHandlingTestsFor 'text-footer'

    describe 'layout:', ->

      it 'rejects invalid values', ->
        expect( => @withConfig { layout: 'good layout' }).to.throw(/Invalid layout/)

  describe '_computeDimensions():', ->
    beforeEach ->
      @width = 500
      @height = 500
      @textHeader = 18
      @textFooter = 36
      @paddingTop = 4
      @paddingRight = 6
      @paddingBottom = 8
      @paddingLeft = 10

      @withConfig {
        'text-header': { 'font-size': "#{@textHeader}px", text: 'foo' }
        'text-footer': { 'font-size': "#{@textFooter}px", text: 'foo' }
        'padding' : "#{@paddingTop} #{@paddingRight} #{@paddingBottom} #{@paddingLeft}"
      }, @width, @height
      @instance._computeDimensions()

      @d = (k) -> @instance.dimensions[k]

      @expectedGraphicHeight = @height - @textHeader - @textFooter - @paddingTop - @paddingBottom

    it 'calculate headerWidth correctly', -> expect(@d 'headerWidth').to.equal @width - @paddingLeft - @paddingRight
    it 'calculates headerHeight correctly', -> expect(@d 'headerHeight').to.equal @textHeader
    it 'calculate headerXOffset correctly', -> expect(@d 'headerXOffset').to.equal @paddingLeft
    it 'calculate headerYOffset correctly', -> expect(@d 'headerYOffset').to.equal @paddingTop

    it 'calculates graphicWidth correctly', -> expect(@d 'graphicWidth').to.equal @width - @paddingLeft - @paddingRight
    it 'calculates graphicHeight correctly', -> expect(@d 'graphicHeight').to.equal @expectedGraphicHeight
    it 'calculate graphicXOffset correctly', -> expect(@d 'graphicXOffset').to.equal @paddingLeft
    it 'calculates graphicYOffset correctly', -> expect(@d 'graphicYOffset').to.equal @textHeader + @paddingTop

    it 'calculates footerWidth correctly', -> expect(@d 'footerWidth').to.equal @width - @paddingLeft - @paddingRight
    it 'calculates footerHeight correctly', -> expect(@d 'footerHeight').to.equal @textFooter
    it 'calculates footerXOffset correctly', -> expect(@d 'footerXOffset').to.equal @paddingLeft
    it 'calculates footerYOffset correctly', -> expect(@d 'footerYOffset').to.equal @paddingTop + @textHeader + @expectedGraphicHeight

  describe '_generateDataArray():', ->

    beforeEach ->
      @withConfig {} #NB config doesnt matter just get me an @instance!
      @calc = (proportion, numImages) -> @instance._generateDataArray proportion, numImages

    it 'single image 100%', ->
      expect(@calc percent=1, numImages=1).to.deep.equal [{ proportion: 1, i: 0 }]

    it 'single image 50%', ->
      expect(@calc percent=0.5, numImages=1).to.deep.equal [{ proportion: 0.5, i: 0 }]

    it '5 image 85%', ->
      expect(@calc percent=0.85, numImages=5).to.deep.equal [
        { proportion: 1, i: 0 }
        { proportion: 1, i: 1 }
        { proportion: 1, i: 2 }
        { proportion: 1, i: 3 }
        { proportion: 0.25, i: 4 } # woah 0.85 = 0.25?? 0.8 goes to first 4. 0.05 / 0.2 is 0.25. BAM
      ]

    it '4 image 25%', ->
      expect(@calc percent=0.25, numImages=4).to.deep.equal [
        { proportion: 1, i: 0 }
        { proportion: 0, i: 1 }
        { proportion: 0, i: 2 }
        { proportion: 0, i: 3 }
      ]

  describe 'e2e tests:', ->

    beforeEach ->
      @makeGraphic = (config, width=500, height=500) ->
        unique = "#{Math.random()}".replace(/\./g,'')
        $('body').append("<div class=\"#{unique}\">")

        anonSvg = $('<svg class="test-svg">')
          .attr 'id', 'test-svg'
          .attr 'width', '100%'
          .attr 'height', '100%'

        $(".#{unique}").append(anonSvg)

        @svg = d3.select(anonSvg[0])

        @instance = new GraphicCell @svg, ['test-svg'], width, height
        @instance.setConfig config
        @instance.draw()

        return unique

    describe 'node classes:', ->

      beforeEach (done) ->
        @uniqueClass = @makeGraphic {
          proportion: 0.875
          numImages: 4
          variableImage: 'circle:blue'
        }
        # 0 sec timeout is necessary because ImageFactory uses a immediately resolving promise.
        # the 0 sec timeout effectively says clear the call stack before proceeding
        setTimeout done, 0

        it 'generates correct node classes', ->
          expect($(".#{@uniqueClass} .node").length).to.equal 4
          expect($(".#{@uniqueClass} .node-index-0").length).to.equal 1
          expect($(".#{@uniqueClass} .node-index-1").length).to.equal 1
          expect($(".#{@uniqueClass} .node-index-2").length).to.equal 1
          expect($(".#{@uniqueClass} .node-index-3").length).to.equal 1
          expect($(".#{@uniqueClass} .node-index-4").length).to.equal 0
          expect($(".#{@uniqueClass} .node-xy-0-0").length).to.equal 1
          expect($(".#{@uniqueClass} .node-xy-0-1").length).to.equal 1
          expect($(".#{@uniqueClass} .node-xy-1-0").length).to.equal 1
          expect($(".#{@uniqueClass} .node-xy-1-1").length).to.equal 1
          expect($(".#{@uniqueClass} .node-xy-2-0").length).to.equal 0

    describe 'multi image clipped from left graphic:', ->

      beforeEach (done) ->
        @uniqueClass = @makeGraphic {
          proportion: 0.875
          numImages: 4
          variableImage: 'circle:fromleft:blue'
        }
        # 0 sec timeout is necessary because ImageFactory uses a immediately resolving promise.
        # the 0 sec timeout effectively says clear the call stack before proceeding
        setTimeout done, 0

      it 'applies a clip path to hide part of the fourth graphic', ->
        firstImageClipWidth = parseFloat($(".#{@uniqueClass} .node-xy-0-0 clippath rect").attr('width'))
        fourthImageClipWidth = parseFloat($(".#{@uniqueClass} .node-xy-1-1 clippath rect").attr('width'))

        expect(fourthImageClipWidth / firstImageClipWidth).to.be.closeTo(0.5, 0.001);

    describe 'multi image vertical clipped graphic:', ->
      beforeEach (done) ->
        @uniqueClass = @makeGraphic {
          proportion: 0.875
          numImages: 4
          variableImage: 'circle:frombottom:blue'
          columnGutter: 0
          rowGutter: 0
        }, width=200, height=200
        # 0 sec timeout is necessary because ImageFactory uses a immediately resolving promise.
        # the 0 sec timeout effectively says clear the call stack before proceeding
        setTimeout done, 0

      it 'applies a clip path to hide part of the top right (01) graphic', ->
        height00 = parseFloat($(".#{@uniqueClass} .node-xy-0-0 clippath rect").attr('height')).toFixed(0)
        height01 = parseFloat($(".#{@uniqueClass} .node-xy-0-1 clippath rect").attr('height')).toFixed(0)
        height10 = parseFloat($(".#{@uniqueClass} .node-xy-1-0 clippath rect").attr('height')).toFixed(0)
        height11 = parseFloat($(".#{@uniqueClass} .node-xy-1-1 clippath rect").attr('height')).toFixed(0)

        expect("#{height00} #{height01} #{height10} #{height11}").to.equal '100 50 100 100'

    describe 'multi circle proportion scaled graphic:', ->

      beforeEach (done) ->
        @uniqueClass = @makeGraphic {
          proportion: 0.875
          numImages: 4
          variableImage: 'circle:scale:blue'
        }
        # 0 sec timeout is necessary because ImageFactory uses a immediately resolving promise.
        # the 0 sec timeout effectively says clear the call stack before proceeding
        setTimeout done, 0


      it 'shrinks the circle', ->
        firstImageRadius = parseFloat($(".#{@uniqueClass} .node-xy-0-0 circle").attr('r'))
        fourthImageRadius = parseFloat($(".#{@uniqueClass} .node-xy-1-1 circle").attr('r'))

        expect(fourthImageRadius / firstImageRadius).to.be.closeTo(0.5, 0.001);

    describe 'multi image proportion scaled graphic:', ->

      beforeEach (done) ->
        @uniqueClass = @makeGraphic {
          proportion: 0.875
          numImages: 4
          variableImage: 'url:scale:/image1.jpg'
        }
        # 0 sec timeout is necessary because ImageFactory uses a immediately resolving promise.
        # the 0 sec timeout effectively says clear the call stack before proceeding
        setTimeout done, 0

      it 'applies a clip path to hide part of the fourth image', ->
        firstImageWidth = parseFloat($(".#{@uniqueClass} .node-xy-0-0 image").attr('width'))
        fourthImageWidth = parseFloat($(".#{@uniqueClass} .node-xy-1-1 image").attr('width'))
        firstImageHeight = parseFloat($(".#{@uniqueClass} .node-xy-0-0 image").attr('height'))
        fourthImageHeight = parseFloat($(".#{@uniqueClass} .node-xy-1-1 image").attr('height'))

        expect(fourthImageWidth / firstImageWidth).to.be.closeTo(0.5, 0.001);
        expect(fourthImageHeight / firstImageHeight).to.be.closeTo(0.5, 0.001);
