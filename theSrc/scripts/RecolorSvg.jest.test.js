const jQuery = require('jquery')
const RecolorSvg = require('./RecolorSvg')

describe('RecolorSvg:', function () {
  const generateSvgString = function (args) {
    const boilerplate = '<?xml version="1.0" encoding="iso-8859-1" ?> <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG Tiny 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11-tiny.dtd">'

    const svgOpenTag = [
      '<svg ',
      args.width ? `width="${args.width}"` : '',
      args.height ? `height="${args.height}"` : '',
      args.viewBox ? `viewBox="${args.viewBox}"` : '',
      'xmlns="http://www.w3.org/2000/svg" version="1.1" baseProfile="tiny" xmlns:xlink="http://www.w3.org/1999/xlink">',
    ].filter(s => s.length > 0).join(' ')

    const svgCloseTag = '</svg>'

    return boilerplate + svgOpenTag + (args.content || '') + svgCloseTag
  }

  const build = function (svgString, newColor = 'color', newX = 0, newY = 0, newWidth = 100, newHeight = 100) {
    const xmlObject = jQuery.parseXML(svgString)
    const origSvgObject = jQuery(xmlObject).find('svg')
    const newSvgString = RecolorSvg.recolor({
      svg: origSvgObject,
      color: newColor,
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight,
    })
    return jQuery(jQuery.parseXML(newSvgString)).find('svg')
  }

  describe('simple svg file:', function () {
    const svgString = generateSvgString({
      width: '512px',
      height: '512px',
      content: '<circle id="circle" cx="0" cy="0" r="512" fill="blue" class="circle"/>',
    })

    const newSvgObject = build(svgString, 'color', 10, 10, 100, 100)

    it('overrides width on outer svg', function () {
      expect(newSvgObject.attr('width')).toEqual('100')
    })

    it('overrides height on outer svg', function () {
      expect(newSvgObject.attr('height')).toEqual('100')
    })

    it('overrides x on outer svg', function () {
      expect(newSvgObject.attr('x')).toEqual('10')
    })

    it('overrides y on outer svg', function () {
      expect(newSvgObject.attr('y')).toEqual('10')
    })

    it('changes fill="blue" to fill="color"', function () {
      expect(newSvgObject.find('circle').attr('fill')).toEqual('color')
    })
  })

  describe('creates viewBox:', function () {
    it('if one is absent and there are width and height set on svg', function () {
      const svgString = generateSvgString({ width: '512px', height: '512px' })
      const newSvgObject = build(svgString)

      expect(newSvgObject.attr('viewBox')).toEqual('0 0 512 512')
    })

    it('it does not override an existing viewBox', function () {
      const svgString = generateSvgString({ width: '512px', height: '512px', viewBox: '0 0 1000 1000' })
      const newSvgObject = build(svgString)

      expect(newSvgObject.attr('viewBox')).toEqual('0 0 1000 1000')
    })
  })

  describe('fill and stroke replacements:', function () {
    const testcases = [
      { i: "fill='blue'", o: "fill='red'" },
      { i: 'fill="blue"', o: 'fill="red"' },
      { i: 'style="fill:blue"', o: 'style="fill:red"' },

      { i: "stroke='blue'", o: "stroke='red'" },
      { i: 'stroke="blue"', o: 'stroke="red"' },
      { i: 'style="stroke:blue"', o: 'style="stroke:red"' },

      { i: 'style="foo:bar;fill:blue"', o: 'style="foo:bar;fill:red"' },
      { i: 'style="foo:bar; fill:blue"', o: 'style="foo:bar; fill:red"' },
      { i: "style='foo:bar; fill:blue'", o: "style='foo:bar; fill:red'" },
      { i: 'style="fill:blue; foo:bar"', o: 'style="fill:red; foo:bar"' },
      { i: 'style="fill:blue ; foo:bar"', o: 'style="fill:red; foo:bar"' },
      { i: 'style="fill:none ; foo:bar"', o: 'style="fill:none ; foo:bar"' },
    ]

    testcases.forEach((testcase) => {
      it('replaces fill and stroke unless its none', function () {
        expect(RecolorSvg.fillReplacer(testcase.i, testcase.r || 'red')).toEqual(testcase.o)
      })
    })
  })
})
