import _ from 'lodash';
import $ from 'jquery';
import d3 from 'd3';
import BaseCell from './BaseCell';
import GraphicCell from './GraphicCell';

describe('GraphicCell class', function () {
  const makeRatioTestsFor = function (key, baseConfig) {
    if (baseConfig == null) { baseConfig = {}; }
    const makeConfig = function (v) {
      const config = baseConfig;
      config[key] = v;
      return config;
    };

    describe('must be an float between 0 and 1 inclusive:', function () {
      it(`${key}=-1 causes errors`, function () {
        expect(() => this.withConfig(makeConfig(-1))).to.throw(new RegExp(`${key}`));
      });
      it(`${key}=2 causes errors`, function () {
        expect(() => this.withConfig(makeConfig(2))).to.throw(new RegExp(`${key}`));
      });
      it(`${key}='dogs' causes errors`, function () {
        expect(() => this.withConfig(makeConfig('dogs'))).to.throw(new RegExp(`${key}`));
      });
      it(`${key}='0' is ok`, function () {
        expect(() => this.withConfig(makeConfig('0'))).not.to.throw();
      });
      it(`${key}='0.5' is ok`, function () {
        expect(() => this.withConfig(makeConfig('0.5'))).not.to.throw();
      });
    });
  };

  const maketextHandlingTestsFor = function (key) {
    const makeConfig = function (v, baseConfig) {
      if (baseConfig == null) { baseConfig = {}; }
      const config = baseConfig;
      config[key] = v;
      return config;
    };

    beforeEach(function () {
      this.baseCellSetCssSpy = sinon.spy(BaseCell.prototype, 'setCss');
      BaseCell.setDefault('font-size', '24px');

      this.wasSet = function (param) {
        const cssThatWasSet = this.baseCellSetCssSpy.args.map(callValues => callValues[1]);
        expect(cssThatWasSet).to.include(param);
      };
    });

    afterEach(function () {
      BaseCell.prototype.setCss.restore();
      return BaseCell.resetDefaults();
    });

    describe('string as input:', function () {
      it('builds the config object with defaults', function () {
        this.withConfig(makeConfig('test-text'));
        expect(this.instance.config[key]).to.deep.equal({
          text: 'test-text',
          'font-size': '24px',
          'horizontal-align': 'middle',
          'vertical-align': 'center',
          'padding-top': 1,
          'padding-right': 1,
          'padding-bottom': 1,
          'padding-left': 1,
        });
      });
    });

    describe('object as input:', function () {
      it('must have a text field', function () {
        expect(() => this.withConfig(makeConfig({}))).to.throw(new RegExp('must have text field'));
      });

      beforeEach(function () {
        this.withConfig(makeConfig({
          text: 'test-text',
          'font-size': '12px',
          'font-family': 'fam',
          'font-color': 'blue',
          'font-weight': '900',
        }));
      });

      it('builds the config object with defaults', function () {
        expect(this.instance.config[key]).to.deep.equal({
          text: 'test-text',
          'font-size': '12px',
          'font-family': 'fam',
          'font-color': 'blue',
          'font-weight': '900',
          'horizontal-align': 'middle',
          'vertical-align': 'center',
          'padding-top': 1,
          'padding-right': 1,
          'padding-bottom': 1,
          'padding-left': 1,
        });
      });

      it('calls setCss on all its members', function () {
        this.wasSet('font-family');
        this.wasSet('font-color');
        this.wasSet('font-weight');
      });

      describe('horizontal-alignment', function () {
        beforeEach(function () {
          this.testHorizontalAlignConfigHandling = function (input, expectedOut) {
            this.withConfig(makeConfig({ text: 'foo', 'horizontal-align': input }));
            expect(this.instance.config[key]['horizontal-align']).to.equal(expectedOut);
          };
        });

        it('accepts centre', function () { return this.testHorizontalAlignConfigHandling('centre', 'middle'); });
        it('accepts center', function () { return this.testHorizontalAlignConfigHandling('center', 'middle'); });
        it('accepts middle', function () { return this.testHorizontalAlignConfigHandling('middle', 'middle'); });
        it('accepts left', function () { return this.testHorizontalAlignConfigHandling('left', 'start'); });
        it('accepts start', function () { return this.testHorizontalAlignConfigHandling('start', 'start'); });
        it('accepts end', function () { return this.testHorizontalAlignConfigHandling('end', 'end'); });
        it('accepts right', function () { return this.testHorizontalAlignConfigHandling('right', 'end'); });

        return it('rejects everything else', function () {
          expect(() => this.withConfig(makeConfig({ text: 'foo', 'horizontal-align': 'cats' }))).to.throw(new RegExp('Invalid horizontal align'));
        });
      });

      describe('"proportion" keyword:', function () {
        it('accepts proportion in string form and uses the proportion as text value', function () {
          this.withConfig(makeConfig('proportion', { proportion: '0.123', variableImage: 'circle:fromleft' }));
          expect(this.instance.config[key].text).to.equal('0.123');
        });

        it('accepts proportion in string form and uses the proportion as text value', function () {
          this.withConfig(makeConfig({ text: 'proportion' }, { proportion: '0.123', variableImage: 'circle:fromleft' }));
          expect(this.instance.config[key].text).to.equal('0.123');
        });

        it('does not display insignificant 0 characters', function () {
          this.withConfig(makeConfig({ text: 'proportion' }, { proportion: '0.5', variableImage: 'circle:fromleft' }));
          expect(this.instance.config[key].text).to.equal('0.5');
        });
      });

      describe('"percentage" keyword:', function () {
        it('accepts percentage in string form and uses the percentage as text value', function () {
          this.withConfig(makeConfig('percentage', { proportion: '=2/3', variableImage: 'circle:fromleft' }));
          expect(this.instance.config[key].text).to.equal('66.7%');
        });

        it('accepts percentage in string form and uses the percentage as text value', function () {
          this.withConfig(makeConfig({ text: 'percentage' }, { proportion: '=2/3', variableImage: 'circle:fromleft' }));
          expect(this.instance.config[key].text).to.equal('66.7%');
        });

        it('does not display insignificant 0 characters', function () {
          this.withConfig(makeConfig({ text: 'percentage' }, { proportion: '=1/2', variableImage: 'circle:fromleft' }));
          expect(this.instance.config[key].text).to.equal('50%');
        });
      });
    });
  };

  beforeEach(function () {
    this.withConfig = function (config, width, height) {
      if (width == null) { width = 100; }
      if (height == null) { height = 100; }
      const sizes = {
        ratios: {
          textSize: 1,
        },
      };

      this.instance = new GraphicCell('dummySvg', ['parentSelector'], width, height, sizes);

      if (config.variableImage == null) { config.variableImage = 'image1'; }
      this.instance.setConfig(config);
    };
  });

  describe('setConfig():', function () {
    it('clones config so cannot be manipulated from outside', function () {
      this.outerConfig = { variableImage: 'image1' };
      this.withConfig(this.outerConfig);
      this.outerConfig.mittens = 'foo';

      expect(this.instance.config).not.to.have.property('mittens');
    });

    it('rejects unknown root attributes', function () {
      this.unknownVariables = { foo: 'bar' };
      expect(() => this.withConfig(this.unknownVariables)).to.throw(/foo/);
    });

    describe('variableImage:', function () {
      it('is required', function () {
        const thrower = () => {
          this.instance = new GraphicCell('dummySvg', ['parentSelector'], 100, 100);
          this.instance.setConfig({});
        };
        expect(thrower).to.throw(new RegExp("Must specify 'variableImage'"));
      });
    });

    describe('baseImage:', function () {
      it('is optional', function () {
        expect(() => this.withConfig({})).not.to.throw();
      });
    });

    describe('width/height:', function () {
      it('default to 1', function () {
        const g = new GraphicCell('dummySvg', ['parentSelector']);
        expect(g.width).to.equal(1);
        expect(g.height).to.equal(1);
      });

      return it('must be positive', function () {
        expect(() => this.withConfig({}, 0, 1)).to.throw(new RegExp(/width/));
        expect(() => this.withConfig({}, 1, 0)).to.throw(new RegExp(/height/));
      });
    });

    describe('numRows/numCols/numImages:', function () {
      describe('defaults:', function () {
        beforeEach(function () { return this.withConfig({}); });
        it('numImages defaults to 1', function () { expect(this.instance.config.numImages).to.equal(1); });
        it('numRows defaults to undefined', function () { expect(this.instance.config).not.to.have.property('numRows'); });
        it('numCols defaults to undefined', function () { expect(this.instance.config).not.to.have.property('numCols'); });
      });

      describe('only accepts positive integers:', function () {
        it('numRows=0 causes errors', function () { expect(() => this.withConfig({ numRows: 0 })).to.throw(new RegExp('Must be positive integer')); });
        it('numCols=0 causes errors', function () { expect(() => this.withConfig({ numCols: 0 })).to.throw(new RegExp('Must be positive integer')); });
        it('numImages=0 causes errors', function () { expect(() => this.withConfig({ numImages: 0 })).to.throw(new RegExp('Must be positive integer')); });

        it('numRows=dogs causes errors', function () { expect(() => this.withConfig({ numRows: 'dogs' })).to.throw(new RegExp('Must be integer')); });
        it('numCols=dogs causes errors', function () { expect(() => this.withConfig({ numCols: 'dogs' })).to.throw(new RegExp('Must be integer')); });
        it('numImages=dogs causes errors', function () { expect(() => this.withConfig({ numImages: 'dogs' })).to.throw(new RegExp('Must be integer')); });

        it('numRows="2" is ok', function () { expect(() => this.withConfig({ numRows: '2' })).not.to.throw(); });
        it('numCols="2" is ok', function () { expect(() => this.withConfig({ numCols: '2' })).not.to.throw(); });
        it('numImages="2" is ok', function () { expect(() => this.withConfig({ numImages: '2' })).not.to.throw(); });
      });

      it('throws error when both numRows and numCols is provided', function () {
        expect(() => this.withConfig({
          numRows: 2,
          numCols: 2,
        })).to.throw(new RegExp('Cannot specify both numRows and numCols'));
      });
    });

    describe('"proportion" handling:', function () {
      it('defaults to 1', function () {
        this.withConfig({});
        expect(this.instance.config.proportion).to.equal(1);
      });

      makeRatioTestsFor('proportion', { variableImage: 'circle:fromleft' });

      describe('interpret strings starting with "="', function () {
        it('proportion="=3/4" will compute to 0.75', function () {
          this.withConfig({ proportion: '=3/4', variableImage: 'circle:fromleft' });
          expect(this.instance.config.proportion).to.equal(0.75);
        });

        it('proportion="=5/4" will throw error (out of bounds)', function () {
          expect(() => this.withConfig({ proportion: '=5/4' })).to.throw(new RegExp('proportion'));
        });
      });

      it('throws error if proportion < 1 and no scaling instruction is provided (string config)', function () {
        expect(() => this.withConfig({
          proportion: '0.75',
          variableImage: 'circle',
        })).to.throw(new RegExp('scaling strategy'));
      });

      it('does not throw error if proportion == 1 and no scaling instruction is provided (string config)', function () {
        expect(() => this.withConfig({ proportion: '1', variableImage: 'circle' })).not.to.throw();
      });

      it('throws error if proportion < 1 and no scaling instruction is provided (object config)', function () {
        expect(() => this.withConfig({ proportion: '0.75', variableImage: { type: 'circle' } })).to.throw();
      });

      it('does not throw error if proportion == 1 and no scaling instruction is provided (object config)', function () {
        expect(() => this.withConfig({ proportion: '1', variableImage: { type: 'circle' } })).not.to.throw();
      });
    });

    describe('"padding" handling:', function () {
      describe('defaults:', function () {
        beforeEach(function () { return this.withConfig({}); });
        it('rowGutter set to 0.05', function () { expect(this.instance.config.rowGutter).to.equal(0.05); });
        it('columnGutter set to 0.05', function () { expect(this.instance.config.columnGutter).to.equal(0.05); });
        it('sets padding to all zeros', function () { expect(this.instance.config.padding).to.deep.equal({ top: 0, right: 0, bottom: 0, left: 0 }); });
      });

      describe('must be an float between 0 and 1 inclusive:', function () {
        makeRatioTestsFor('rowGutter');
        makeRatioTestsFor('columnGutter');
      });

      it('parses the padding string', function () {
        this.withConfig({ padding: '10 15 20 25' });
        expect(this.instance.config.padding).to.deep.equal({ top: 10, right: 15, bottom: 20, left: 25 });
      });

      it('rejects non Integer padding values', function () {
        expect(() => this.withConfig({ padding: 'twelve 15 20 25' })).to.throw(/Invalid padding/);
      });
    });

    describe('text handling:', function () {
      describe('text-header', function () {
        maketextHandlingTestsFor('text-header');
      });

      describe('text-overlay', function () {
        maketextHandlingTestsFor('text-overlay');
      });

      describe('text-footer', function () {
        maketextHandlingTestsFor('text-footer');
      });

      describe('floating-labels', function () {
        beforeEach(function () {
          this.baseCellSetCssSpy = sinon.spy(BaseCell.prototype, 'setCss');
          BaseCell.setDefault('font-size', '24px');

          this.wasSet = function (key, param) {
            const cssKeysThatWereUsed = this.baseCellSetCssSpy.args.map(callValues => callValues[0]);
            const cssThatWasSet = this.baseCellSetCssSpy.args.map(callValues => callValues[1]);
            expect(cssKeysThatWereUsed).to.include(key);
            expect(cssThatWasSet).to.include(param);
          };
        });

        afterEach(function () {
          BaseCell.prototype.setCss.restore();
          return BaseCell.resetDefaults();
        });

        describe('config transformation', function () {
          beforeEach(function () {
            this.withConfig({ floatingLabels: [
              { position: '1:2', text: 'foo', 'font-family': 'arial', 'font-weight': '600', 'font-color': 'red' },
              { position: '3:4', text: 'bar' },
            ] });
          });

          it('each array in config is converted to an object keyed by row then column', function () {
            expect(this.instance.config.floatingLabels[1][2]).to.deep.equal({
              className: 'floating-label-1-2',
              text: 'foo',
              'horizontal-align': 'middle',
              'vertical-align': 'center',
              'padding-left': 1,
              'padding-right': 1,
              'padding-top': 1,
              'padding-bottom': 1,
              'font-size': '24px',
              'font-family': 'arial',
              'font-weight': '600',
              'font-color': 'red',
            });
          });

          it('calls css on font-family and uses a class name specific to the floating-label', function () {
            this.wasSet('floating-label-1-2', 'font-family');
            this.wasSet('floating-label-1-2', 'font-weight');
            this.wasSet('floating-label-1-2', 'font-color');
          });

          it('also processes the second (and all other) items in the array', function () {
            expect(this.instance.config.floatingLabels[3][4].text).to.equal('bar');
          });

          return it('accepts padding string and converts to padding-* params', function () {
            this.withConfig({ floatingLabels: [
              { position: '1:2', text: 'foo', padding: '2 2 2 2' },
            ] });

            expect(this.instance.config.floatingLabels[1][2]).to.deep.equal({
              className: 'floating-label-1-2',
              text: 'foo',
              'horizontal-align': 'middle',
              'vertical-align': 'center',
              'padding-left': 2,
              'padding-right': 2,
              'padding-top': 2,
              'padding-bottom': 2,
              'font-size': '24px',
            });
          });
        });

        describe('error handling', function () {
          it('missing position causes error', function () {
            expect(() => this.withConfig({ floatingLabels: [{ text: '12' }] })).to.throw(/missing position/);
          });

          it('invalid position (not int:int)', function () {
            expect(() => this.withConfig({ floatingLabels: [{ position: '1:foo', text: '12' }] })).to.throw(/must be int:int/);
          });

          it('missing text', function () {
            expect(() => this.withConfig({ floatingLabels: [{ position: '1:1' }] })).to.throw(/missing text/);
          });

          // may want to support this later
          it('no double labels in same position', function () {
            expect(() => this.withConfig({ floatingLabels: [{ position: '1:1', text: '12' }, { position: '1:1', text: '12' }] })).to.throw(/same image slot/);
          });

          describe('invalid padding parameters', () =>
            _(['padding-left', 'padding-right', 'padding-top', 'padding-bottom']).forEach(paddingField =>
              it(`${paddingField} must be Int`, function () {
                const floatingLabelConfig = { position: '1:1', text: '12' };
                floatingLabelConfig[paddingField] = 'invalid';
                expect(() => this.withConfig({ floatingLabels: [floatingLabelConfig] })).to.throw(/padding.*integer/);
              }),
            ),
          );
        });
      });
    });

    describe('layout:', function () {
      it('rejects invalid values', function () {
        expect(() => this.withConfig({ layout: 'good layout' })).to.throw(/Invalid layout/);
      });
    });
  });

  describe('_computeDimensions():', function () {
    beforeEach(function () {
      this.width = 500;
      this.height = 500;
      this.textHeader = 18;
      this.textFooter = 36;
      this.paddingTop = 4;
      this.paddingRight = 6;
      this.paddingBottom = 8;
      this.paddingLeft = 10;

      this.withConfig({
        'text-header': { 'font-size': `${this.textHeader}px`, text: 'foo' },
        'text-footer': { 'font-size': `${this.textFooter}px`, text: 'foo' },
        padding: `${this.paddingTop} ${this.paddingRight} ${this.paddingBottom} ${this.paddingLeft}`,
      }, this.width, this.height);
      this.instance._computeDimensions();

      this.d = function (k) { return this.instance.dimensions[k]; };

      this.expectedGraphicHeight = this.height -
        this.textHeader -
        this.textFooter -
        this.paddingTop -
        this.paddingBottom;
    });

    it('calculate headerWidth correctly', function () { expect(this.d('headerWidth')).to.equal(this.width - this.paddingLeft - this.paddingRight); });
    it('calculates headerHeight correctly', function () { expect(this.d('headerHeight')).to.equal(this.textHeader); });
    it('calculate headerXOffset correctly', function () { expect(this.d('headerXOffset')).to.equal(this.paddingLeft); });
    it('calculate headerYOffset correctly', function () { expect(this.d('headerYOffset')).to.equal(this.paddingTop); });

    it('calculates graphicWidth correctly', function () { expect(this.d('graphicWidth')).to.equal(this.width - this.paddingLeft - this.paddingRight); });
    it('calculates graphicHeight correctly', function () { expect(this.d('graphicHeight')).to.equal(this.expectedGraphicHeight); });
    it('calculate graphicXOffset correctly', function () { expect(this.d('graphicXOffset')).to.equal(this.paddingLeft); });
    it('calculates graphicYOffset correctly', function () { expect(this.d('graphicYOffset')).to.equal(this.textHeader + this.paddingTop); });

    it('calculates footerWidth correctly', function () { expect(this.d('footerWidth')).to.equal(this.width - this.paddingLeft - this.paddingRight); });
    it('calculates footerHeight correctly', function () { expect(this.d('footerHeight')).to.equal(this.textFooter); });
    it('calculates footerXOffset correctly', function () { expect(this.d('footerXOffset')).to.equal(this.paddingLeft); });
    it('calculates footerYOffset correctly', function () { expect(this.d('footerYOffset')).to.equal(this.paddingTop + this.textHeader + this.expectedGraphicHeight); });
  });

  describe('_generateDataArray():', function () {
    beforeEach(function () {
      this.withConfig({}); // NB config doesnt matter just get me an @instance!
      this.calc = function (proportion, numImages) { return this.instance._generateDataArray(proportion, numImages); };
    });

    it('single image 100%', function () {
      expect(this.calc(1, 1)).to.deep.equal([{ proportion: 1, i: 0 }]);
    });

    it('single image 50%', function () {
      expect(this.calc(0.5, 1)).to.deep.equal([{ proportion: 0.5, i: 0 }]);
    });

    it('5 image 85%', function () {
      expect(this.calc(0.85, 5)).to.deep.equal([
        { proportion: 1, i: 0 },
        { proportion: 1, i: 1 },
        { proportion: 1, i: 2 },
        { proportion: 1, i: 3 },
        { proportion: 0.25, i: 4 }, // woah 0.85 = 0.25?? 0.8 goes to first 4. 0.05 / 0.2 is 0.25. BAM
      ]);
    });

    it('4 image 25%', function () {
      expect(this.calc(0.25, 4)).to.deep.equal([
        { proportion: 1, i: 0 },
        { proportion: 0, i: 1 },
        { proportion: 0, i: 2 },
        { proportion: 0, i: 3 },
      ]);
    });
  });

  describe('e2e tests:', function () {
    beforeEach(function () {
      this.makeGraphic = function (config, width, height) {
        if (width == null) { width = 500; }
        if (height == null) { height = 500; }
        const unique = `${Math.random()}`.replace(/\./g, '');
        $('body').append(`<div class="${unique}">`);

        const anonSvg = $('<svg class="test-svg">')
          .attr('id', 'test-svg')
          .attr('width', '100%')
          .attr('height', '100%');

        $(`.${unique}`).append(anonSvg);

        this.svg = d3.select(anonSvg[0]);

        this.instance = new GraphicCell(this.svg, ['test-svg'], width, height);
        this.instance.setConfig(config);
        this.instance.draw();

        return unique;
      };
    });

    describe('node classes:', () =>

      beforeEach(function (done) {
        this.uniqueClass = this.makeGraphic({
          proportion: 0.875,
          numImages: 4,
          variableImage: 'circle:blue',
        });
        // 0 sec timeout is necessary because ImageFactory uses a immediately resolving promise.
        // the 0 sec timeout effectively says clear the call stack before proceeding
        setTimeout(done, 0);

        it('generates correct node classes', function () {
          expect($(`.${this.uniqueClass} .node`).length).to.equal(4);
          expect($(`.${this.uniqueClass} .node-index-0`).length).to.equal(1);
          expect($(`.${this.uniqueClass} .node-index-1`).length).to.equal(1);
          expect($(`.${this.uniqueClass} .node-index-2`).length).to.equal(1);
          expect($(`.${this.uniqueClass} .node-index-3`).length).to.equal(1);
          expect($(`.${this.uniqueClass} .node-index-4`).length).to.equal(0);
          expect($(`.${this.uniqueClass} .node-xy-0-0`).length).to.equal(1);
          expect($(`.${this.uniqueClass} .node-xy-0-1`).length).to.equal(1);
          expect($(`.${this.uniqueClass} .node-xy-1-0`).length).to.equal(1);
          expect($(`.${this.uniqueClass} .node-xy-1-1`).length).to.equal(1);
          expect($(`.${this.uniqueClass} .node-xy-2-0`).length).to.equal(0);
        });
      }),
    );

    describe('multi image clipped from left graphic:', function () {
      beforeEach(function (done) {
        this.uniqueClass = this.makeGraphic({
          proportion: 0.875,
          numImages: 4,
          variableImage: 'circle:fromleft:blue',
        });
        // 0 sec timeout is necessary because ImageFactory uses a immediately resolving promise.
        // the 0 sec timeout effectively says clear the call stack before proceeding
        setTimeout(done, 0);
      });

      it('applies a clip path to hide part of the fourth graphic', function () {
        const firstImageClipWidth = parseFloat($(`.${this.uniqueClass} .node-xy-0-0 clippath rect`).attr('width'));
        const fourthImageClipWidth = parseFloat($(`.${this.uniqueClass} .node-xy-1-1 clippath rect`).attr('width'));

        expect(fourthImageClipWidth / firstImageClipWidth).to.be.closeTo(0.5, 0.001);
      });
    });

    describe('multi image vertical clipped graphic:', function () {
      beforeEach(function (done) {
        this.uniqueClass = this.makeGraphic({
          proportion: 0.875,
          numImages: 4,
          variableImage: 'circle:frombottom:blue',
          columnGutter: 0,
          rowGutter: 0,
        }, 200, 200);
        // 0 sec timeout is necessary because ImageFactory uses a immediately resolving promise.
        // the 0 sec timeout effectively says clear the call stack before proceeding
        setTimeout(done, 0);
      });

      it('applies a clip path to hide part of the top right (01) graphic', function () {
        const height00 = parseFloat($(`.${this.uniqueClass} .node-xy-0-0 clippath rect`).attr('height')).toFixed(0);
        const height01 = parseFloat($(`.${this.uniqueClass} .node-xy-0-1 clippath rect`).attr('height')).toFixed(0);
        const height10 = parseFloat($(`.${this.uniqueClass} .node-xy-1-0 clippath rect`).attr('height')).toFixed(0);
        const height11 = parseFloat($(`.${this.uniqueClass} .node-xy-1-1 clippath rect`).attr('height')).toFixed(0);

        expect(`${height00} ${height01} ${height10} ${height11}`).to.equal('100 50 100 100');
      });
    });

    describe('multi circle proportion scaled graphic:', function () {
      beforeEach(function (done) {
        this.uniqueClass = this.makeGraphic({
          proportion: 0.875,
          numImages: 4,
          variableImage: 'circle:scale:blue',
        });
        // 0 sec timeout is necessary because ImageFactory uses a immediately resolving promise.
        // the 0 sec timeout effectively says clear the call stack before proceeding
        setTimeout(done, 0);
      });


      it('shrinks the circle', function () {
        const firstImageRadius = parseFloat($(`.${this.uniqueClass} .node-xy-0-0 circle`).attr('r'));
        const fourthImageRadius = parseFloat($(`.${this.uniqueClass} .node-xy-1-1 circle`).attr('r'));

        expect(fourthImageRadius / firstImageRadius).to.be.closeTo(0.5, 0.001);
      });
    });

    describe('multi image proportion scaled graphic:', function () {
      beforeEach(function (done) {
        this.uniqueClass = this.makeGraphic({
          proportion: 0.875,
          numImages: 4,
          variableImage: 'url:scale:/image1.jpg',
        });
        // 0 sec timeout is necessary because ImageFactory uses a immediately resolving promise.
        // the 0 sec timeout effectively says clear the call stack before proceeding
        setTimeout(done, 0);
      });

      it('applies a clip path to hide part of the fourth image', function () {
        const firstImageWidth = parseFloat($(`.${this.uniqueClass} .node-xy-0-0 image`).attr('width'));
        const fourthImageWidth = parseFloat($(`.${this.uniqueClass} .node-xy-1-1 image`).attr('width'));
        const firstImageHeight = parseFloat($(`.${this.uniqueClass} .node-xy-0-0 image`).attr('height'));
        const fourthImageHeight = parseFloat($(`.${this.uniqueClass} .node-xy-1-1 image`).attr('height'));

        expect(fourthImageWidth / firstImageWidth).to.be.closeTo(0.5, 0.001);
        expect(fourthImageHeight / firstImageHeight).to.be.closeTo(0.5, 0.001);
      });
    });
  });
});
