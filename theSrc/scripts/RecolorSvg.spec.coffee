describe 'RecolorSvg:', ->
  describe 'simple svg file:', ->
    beforeEach ->

      svgString = @generateSvgString
        width: '512px'
        height: '512px'
        content: '<circle id="circle" cx="0" cy="0" r="512" fill="blue" class="circle"/>'

      @build svgString, newColor='color', x=10, y=10, newWidth=100, newHeight=100

    it 'overrides width on outer svg', ->
      expect(@newSvgObject.attr('width')).to.equal '100'

    it 'overrides height on outer svg', ->
      expect(@newSvgObject.attr('height')).to.equal '100'

    it 'overrides x on outer svg', ->
      expect(@newSvgObject.attr('x')).to.equal '10'

    it 'overrides y on outer svg', ->
      expect(@newSvgObject.attr('y')).to.equal '10'

    it 'changes fill="blue" to fill="color"', ->
      expect(@newSvgObject.find('circle').attr('fill')).to.equal 'color'

  describe 'creates viewBox:', ->

    it 'if one is absent and there are width and height set on svg', ->
      svgString = @generateSvgString width: '512px', height: '512px'
      @build svgString

      expect(@newSvgObject.attr('viewBox')).to.equal '0 0 512 512'

    it 'it does not override an existing viewBox', ->
      svgString = @generateSvgString width: '512px', height: '512px', viewBox: '0 0 1000 1000'
      @build svgString

      expect(@newSvgObject.attr('viewBox')).to.equal '0 0 1000 1000'

  describe 'fill and stroke replacements:', ->

    testcases = [
      { i: "fill='blue'", o: "fill='red'" }
      { i: 'fill="blue"', o: 'fill="red"' }
      { i: 'style="fill:blue"', o: 'style="fill:red"' }

      { i: "stroke='blue'", o: "stroke='red'" }
      { i: 'stroke="blue"', o: 'stroke="red"' }
      { i: 'style="stroke:blue"', o: 'style="stroke:red"' }

      { i: 'style="foo:bar;fill:blue"', o: 'style="foo:bar;fill:red"' }
      { i: 'style="foo:bar; fill:blue"', o: 'style="foo:bar; fill:red"' }
      { i: "style='foo:bar; fill:blue'", o: "style='foo:bar; fill:red'" }
      { i: 'style="fill:blue; foo:bar"', o: 'style="fill:red; foo:bar"' }
      { i: 'style="fill:blue ; foo:bar"', o: 'style="fill:red; foo:bar"' }
      { i: 'style="fill:none ; foo:bar"', o: 'style="fill:none ; foo:bar"' }
    ]

    testcases.forEach (testcase) ->
      it 'replaces fill and stroke unless its none', ->
        expect(RecolorSvg.fillReplacer(testcase.i, testcase.r or 'red')).to.equal(testcase.o)

  beforeEach ->
    @generateSvgString = (args) ->
      boilerplate = '<?xml version="1.0" encoding="iso-8859-1" ?> <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG Tiny 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11-tiny.dtd">'

      svgOpenTag = [
        '<svg '
        if args.width then "width=\"#{args.width}\"" else ''
        if args.height then "height=\"#{args.height}\"" else ''
        if args.viewBox then "viewBox=\"#{args.viewBox}\"" else ''
        'xmlns="http://www.w3.org/2000/svg" version="1.1" baseProfile="tiny" xmlns:xlink="http://www.w3.org/1999/xlink">'
      ].filter( (s) -> s.length > 0 ).join(' ')

      svgCloseTag = '</svg>'

      return boilerplate + svgOpenTag + (args.content || '') + svgCloseTag

    @build = (svgString, newColor='color', newX=0, newY=0, newWidth=100, newHeight=100) ->
      xmlObject = jQuery.parseXML(svgString)
      origSvgObject = jQuery(xmlObject).find('svg');
      @newSvgString = RecolorSvg.recolor(origSvgObject, newColor, newX, newY, newWidth, newHeight)
      @newSvgObject = jQuery(jQuery.parseXML(@newSvgString)).find('svg')
