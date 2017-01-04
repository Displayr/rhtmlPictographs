import jQuery from 'jquery';
import RecolorSvg from './RecolorSvg';

describe('RecolorSvg:', function () {
  describe('simple svg file:', function () {
    beforeEach(function () {
      const svgString = this.generateSvgString({
        width: '512px',
        height: '512px',
        content: '<circle id="circle" cx="0" cy="0" r="512" fill="blue" class="circle"/>',
      });

      this.build(svgString, 'color', 10, 10, 100, 100);
    });

    it('overrides width on outer svg', function () {
      expect(this.newSvgObject.attr('width')).to.equal('100');
    });

    it('overrides height on outer svg', function () {
      expect(this.newSvgObject.attr('height')).to.equal('100');
    });

    it('overrides x on outer svg', function () {
      expect(this.newSvgObject.attr('x')).to.equal('10');
    });

    it('overrides y on outer svg', function () {
      expect(this.newSvgObject.attr('y')).to.equal('10');
    });

    it('changes fill="blue" to fill="color"', function () {
      expect(this.newSvgObject.find('circle').attr('fill')).to.equal('color');
    });
  });

  describe('creates viewBox:', function () {
    it('if one is absent and there are width and height set on svg', function () {
      const svgString = this.generateSvgString({ width: '512px', height: '512px' });
      this.build(svgString);

      expect(this.newSvgObject.attr('viewBox')).to.equal('0 0 512 512');
    });

    it('it does not override an existing viewBox', function () {
      const svgString = this.generateSvgString({ width: '512px', height: '512px', viewBox: '0 0 1000 1000' });
      this.build(svgString);

      expect(this.newSvgObject.attr('viewBox')).to.equal('0 0 1000 1000');
    });
  });

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
    ];

    testcases.forEach((testcase) => {
      it('replaces fill and stroke unless its none', function () {
        expect(RecolorSvg.fillReplacer(testcase.i, testcase.r || 'red')).to.equal(testcase.o);
      });
    });
  });

  beforeEach(function () {
    this.generateSvgString = function (args) {
      const boilerplate = '<?xml version="1.0" encoding="iso-8859-1" ?> <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG Tiny 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11-tiny.dtd">';

      const svgOpenTag = [
        '<svg ',
        args.width ? `width="${args.width}"` : '',
        args.height ? `height="${args.height}"` : '',
        args.viewBox ? `viewBox="${args.viewBox}"` : '',
        'xmlns="http://www.w3.org/2000/svg" version="1.1" baseProfile="tiny" xmlns:xlink="http://www.w3.org/1999/xlink">',
      ].filter(s => s.length > 0).join(' ');

      const svgCloseTag = '</svg>';

      return boilerplate + svgOpenTag + (args.content || '') + svgCloseTag;
    };

    this.build = function (svgString, newColor, newX, newY, newWidth, newHeight) {
      if (newColor == null) { newColor = 'color'; }
      if (newX == null) { newX = 0; }
      if (newY == null) { newY = 0; }
      if (newWidth == null) { newWidth = 100; }
      if (newHeight == null) { newHeight = 100; }
      const xmlObject = jQuery.parseXML(svgString);
      const origSvgObject = jQuery(xmlObject).find('svg');
      this.newSvgString = RecolorSvg.recolor(origSvgObject, newColor, newX, newY, newWidth, newHeight);
      this.newSvgObject = jQuery(jQuery.parseXML(this.newSvgString)).find('svg');
    };
  });
});
