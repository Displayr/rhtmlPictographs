import d3 from 'd3';

/* eslint-disable no-unused-vars */
import d3Grid from './d3Grid'; // this import initializes d3.layout.grid
/* eslint-enable no-unused-vars */

import BaseCell from './BaseCell';
import ImageFactory from './ImageFactory';
import DisplayError from './DisplayError';

class GraphicCell extends BaseCell {

  static get validRootAttributes() {
    return [
      'background-color',
      'baseImage',
      'columnGutter',
      'debugBorder',
      'font-color',
      'font-family',
      'font-size',
      'font-weight',
      'layout',
      'numCols',
      'numImages',
      'numRows',
      'padding',
      'proportion',
      'rowGutter',
      'image-background-color',
      'text-footer',
      'text-header',
      'text-overlay',
      'variableImage',
      'floatingLabels',
    ];
  }

  setConfig(config) {
    this.config = _.cloneDeep(config);

    const invalidRootAttributes = _.difference(_.keys(this.config), GraphicCell.validRootAttributes);
    if (invalidRootAttributes.length > 0) {
      throw new Error(`Invalid attribute(s): ${JSON.stringify(invalidRootAttributes)}`);
    }

    if (this.config.variableImage == null) { throw new Error("Must specify 'variableImage'"); }

    if (_.isString(this.config.proportion) && this.config.proportion.startsWith('=')) {
      // TODO - do this safely as this does come from user
      this.config.proportion = eval(this.config.proportion.substring(1));
    }

    this._verifyKeyIsFloat(this.config, 'proportion', 1, 'Must be number between 0 and 1');
    this._verifyKeyIsRatio(this.config, 'proportion');

    this._throwErrorIfProportionSetAndNoScalingStrategyProvided();

    this._verifyKeyIsPositiveInt(this.config, 'numImages', 1);
    if (this.config.numRows != null) { this._verifyKeyIsPositiveInt(this.config, 'numRows', 1); }
    if (this.config.numCols != null) { this._verifyKeyIsPositiveInt(this.config, 'numCols', 1); }
    if ((this.config.numRows != null) && (this.config.numCols != null)) {
      throw new Error('Cannot specify both numRows and numCols. Choose one, and use numImages to control exact dimensions.');
    }

    this._verifyKeyIsFloat(this.config, 'columnGutter', 0.05, 'Must be number between 0 and 1');
    this._verifyKeyIsRatio(this.config, 'columnGutter');
    this._verifyKeyIsFloat(this.config, 'rowGutter', 0.05, 'Must be number between 0 and 1');
    this._verifyKeyIsRatio(this.config, 'rowGutter');

    if (this.config['text-header']) { this.config['text-header'] = this._processTextConfig(this.config['text-header'], 'text-header'); }
    if (this.config['text-overlay']) { this.config['text-overlay'] = this._processTextConfig(this.config['text-overlay'], 'text-overlay'); }
    if (this.config['text-footer']) { this.config['text-footer'] = this._processTextConfig(this.config['text-footer'], 'text-footer'); }

    if (this.config.floatingLabels) {
      const floatingLabelsInput = this.config.floatingLabels;
      this.config.floatingLabels = {};
      _(floatingLabelsInput).each((labelConfig) => {
        if (!labelConfig.text) {
          throw new Error('Invalid floating label, missing text');
        }

        if (!labelConfig.position) {
          throw new Error('Invalid floating label, missing position');
        }

        const [row, col] = labelConfig.position.split(':').map(positionString => parseInt(positionString));

        if (_.isNaN(row) || _.isNaN(col)) {
          throw new Error(`Invalid floating label position '${labelConfig.position}', must be int:int`);
        }

        if (this.config.floatingLabels[row] == null) { this.config.floatingLabels[row] = {}; }

        if (_.has(this.config.floatingLabels[row], col)) {
          throw new Error('Cannot place two floating labels in same image slot');
        }

        const className = `floating-label-${row}-${col}`;
        this.config.floatingLabels[row][col] = this._processTextConfig(_.omit(labelConfig, 'position'), className);
        this.config.floatingLabels[row][col].className = className;
      });
    } else {
      this.config.floatingLabels = {};
    }

    if (this.config.padding) {
      const [paddingTop, paddingRight, paddingBottom, paddingLeft] = this.config.padding.split(' ');

      this.config.padding = {
        top: parseInt(paddingTop.replace(/(px|em)/, '')),
        right: parseInt(paddingRight.replace(/(px|em)/, '')),
        bottom: parseInt(paddingBottom.replace(/(px|em)/, '')),
        left: parseInt(paddingLeft.replace(/(px|em)/, '')),
      };
      _.forEach(this.config.padding, (value, paddingKey) => {
        if (_.isNaN(this.config.padding[paddingKey])) {
          throw new Error(`Invalid padding ${this.config.padding}: ${paddingKey} must be Integer`);
        }
      });
    } else {
      this.config.padding = { top: 0, right: 0, bottom: 0, left: 0 };
    }

    if (this.config.layout) {
      const validLayoutValues = d3.layout.grid().validDirections();
      if (!validLayoutValues.includes(this.config.layout)) {
        throw new Error(`Invalid layout ${this.config.layout}. Valid values: [${validLayoutValues.join('|')}]`);
      }
    }
  }

  _throwErrorIfProportionSetAndNoScalingStrategyProvided() {
    if (this.config.proportion >= 1) { return; }
    let matchingScalingStrategies = null;
    if (_.isString(this.config.variableImage)) {
      matchingScalingStrategies = _.find(ImageFactory.validScalingStrategyStrings, (validStrategyString) => {
        return this.config.variableImage.indexOf(validStrategyString) !== -1;
      });
    } else {
      matchingScalingStrategies = _.find(ImageFactory.validScalingStrategyKeys, (validStrategyKey) => {
        _.has(this.config.variableImage, validStrategyKey);
      });
    }

    if (_.isUndefined(matchingScalingStrategies)) {
      throw new Error('Cannot have proportion < 1 without providing a scaling strategy to the variableImage');
    }
  }

  _processTextConfig(input, cssName) {
    const textConfig = _.isString(input) ? { text: input } : input;

    if (textConfig.text == null) { throw new Error(`Invalid ${cssName} config: must have text field`); }

    if ((textConfig != null) && textConfig.text.match(/^percentage$/)) {
      textConfig.text = `${(100 * this.config.proportion).toFixed(1).replace(/\.0$/, '')}%`;
    }

    if ((textConfig != null) && textConfig.text.match(/^proportion$/)) {
      textConfig.text = `${(this.config.proportion).toFixed(3).replace(/0+$/, '')}`;
    }

    if (textConfig['horizontal-align'] == null) { textConfig['horizontal-align'] = 'middle'; }

    if (['center', 'centre'].includes(textConfig['horizontal-align'])) { textConfig['horizontal-align'] = 'middle'; }
    if (['left'].includes(textConfig['horizontal-align'])) { textConfig['horizontal-align'] = 'start'; }
    if (['right'].includes(textConfig['horizontal-align'])) { textConfig['horizontal-align'] = 'end'; }
    if (!['start', 'middle', 'end'].includes(textConfig['horizontal-align'])) {
      throw new Error(`Invalid horizontal align ${textConfig['horizontal-align']} : must be one of ['left', 'center', 'right']`);
    }

    if (textConfig.padding) {
      [textConfig['padding-top'], textConfig['padding-right'], textConfig['padding-bottom'], textConfig['padding-left']] = textConfig.padding.split(' ');
      delete textConfig.padding;
    }

    this._verifyKeyIsPositiveInt(textConfig, 'padding-left', 1);
    this._verifyKeyIsPositiveInt(textConfig, 'padding-right', 1);
    this._verifyKeyIsPositiveInt(textConfig, 'padding-top', 1);
    this._verifyKeyIsPositiveInt(textConfig, 'padding-bottom', 1);

    // NB vertical align is only used by floating labels
    if (textConfig['vertical-align'] == null) { textConfig['vertical-align'] = 'center'; }
    if (['middle', 'centre'].includes(textConfig['vertical-align'])) { textConfig['vertical-align'] = 'center'; }
    if (!['top', 'center', 'bottom'].includes(textConfig['vertical-align'])) {
      throw new Error(`Invalid vertical align ${textConfig['vertical-align']} : must be one of ['top', 'center', 'bottom']`);
    }

    // font-size must be present to compute dimensions
    if (textConfig['font-size'] == null) { textConfig['font-size'] = BaseCell.getDefault('font-size'); }
    ['font-family', 'font-weight', 'font-color'].forEach((cssAttribute) => {
      if (textConfig[cssAttribute] != null) { this.setCss(cssName, cssAttribute, textConfig[cssAttribute]); }
    });

    return textConfig;
  }

  _draw() {
    this._computeDimensions();

    // NB the order of append operations matters as SVG is a last on top rendering model

    this.parentSvg.append('svg:rect')
      .attr('width', this.width)
      .attr('height', this.height)
      .attr('class', 'background-rect')
      .attr('fill', this.config['background-color'] || 'none');

    if (this.config['text-header'] != null) {
      const textSpanWidth = this.dimensions.headerXOffset + this.dimensions.headerWidth;
      const yMidpoint = this.dimensions.headerYOffset + (this.dimensions.headerHeight / 2);
      this._addTextTo(this.parentSvg, 'text-header', this.config['text-header'], textSpanWidth, yMidpoint);
    }

    const graphicContainer = this.parentSvg.append('g')
      .attr('class', 'graphic-container')
      .attr('transform', `translate(${this.dimensions.graphicXOffset},${this.dimensions.graphicYOffset})`);

    if (this.config['text-footer'] != null) {
      const textSpanWidth = this.dimensions.footerXOffset + this.dimensions.footerWidth;
      const yMidpoint = this.dimensions.footerYOffset + (this.dimensions.footerHeight / 2);
      this._addTextTo(this.parentSvg, 'text-footer', this.config['text-footer'], textSpanWidth, yMidpoint);
    }

    const d3Data = this._generateDataArray(this.config.proportion, this.config.numImages);

    const gridLayout = d3.layout.grid()
      .bands()
      .size([this.dimensions.graphicWidth, this.dimensions.graphicHeight])
      .padding([this.config.columnGutter, this.config.rowGutter]);

    if (this.config.numRows != null) { gridLayout.rows(this.config.numRows); }
    if (this.config.numCols != null) { gridLayout.cols(this.config.numCols); }

    if (_.isString(this.config.variableImage)) {
      if (this.config.variableImage.match(/fromleft/)) {
        gridLayout.direction('right,down');
      }
      if (this.config.variableImage.match(/fromright/)) {
        gridLayout.direction('left,down');
      }
      if (this.config.variableImage.match(/fromtop/)) {
        gridLayout.direction('right,down');
      }
      if (this.config.variableImage.match(/frombottom/)) {
        gridLayout.direction('right,up');
      }
    }
    if (this.config.layout) {
      gridLayout.direction(this.config.layout);
    }


    const enteringLeafNodes = graphicContainer.selectAll('.node')
      .data(gridLayout(d3Data))
      .enter()
      .append('g')
        .attr('class', function (d) {
          const cssLocation = `node-index-${d.i} node-xy-${d.row}-${d.col}`;
          return `node ${cssLocation}`;
        })
        .attr('transform', d => `translate(${d.x},${d.y})`);

    const imageWidth = gridLayout.nodeSize()[0];
    const imageHeight = gridLayout.nodeSize()[1];

    const backgroundRect = enteringLeafNodes.append('svg:rect')
      .attr('width', imageWidth)
      .attr('height', imageHeight)
      .attr('class', 'single-image-background-rect')
      .attr('fill', this.config['image-background-color'] || 'none');

    if (this.config.debugBorder != null) {
      backgroundRect
        .attr('stroke', 'black')
        .attr('stroke-width', '1');
    }

    // NB To adhere to SVG "last drawn goes on top policy", we coordinate image rendering with promises
    // baseImage first, then variableImage, then text and labels on top
    const { parentSvg } = this;
    const imageErrorHandler = function (error) {
      const de = new DisplayError(parentSvg, error.message);
      de.drawSvg();
      throw error; // NB This is thrown because displayr wants the error too
    };

    let baseImageCompletePromise = Promise.resolve();
    if (this.config.baseImage != null) {
      const baseImageConfig = this.config.baseImage;
      const baseImageRenderPromises = [];
      enteringLeafNodes.each(function (dataAttributes) {
        const d3Node = d3.select(this);
        baseImageRenderPromises.push(
          ImageFactory.addBaseImageTo(d3Node, baseImageConfig, imageWidth, imageHeight, dataAttributes),
        );
      });
      baseImageCompletePromise = Promise.all(baseImageRenderPromises).catch(imageErrorHandler);
    }

    let variableImageCompletePromise = Promise.resolve();
    if (this.config.variableImage != null) {
      const variableImageConfig = this.config.variableImage;
      variableImageCompletePromise = baseImageCompletePromise.then(function () {
        const variableImageRenderPromises = [];
        enteringLeafNodes.each(function (dataAttributes) {
          const d3Node = d3.select(this);
          variableImageRenderPromises.push(
            ImageFactory.addVarImageTo(d3Node, variableImageConfig, imageWidth, imageHeight, dataAttributes),
          );
        });
        return Promise.all(variableImageRenderPromises).catch(imageErrorHandler);
      });
    }

    return variableImageCompletePromise.then(() => {
      if (this.config.tooltip) {
        enteringLeafNodes.append('svg:title')
          .text(this.config.tooltip);
      }

      if (this.config['text-overlay'] != null) {
        const textSpanWidth = gridLayout.nodeSize()[0];
        const yMidpoint = gridLayout.nodeSize()[1] / 2;
        this._addTextTo(enteringLeafNodes, 'text-overlay', this.config['text-overlay'], textSpanWidth, yMidpoint);
      }

      const floatingLabelConfig = this.config.floatingLabels;
      const _graphicCell = this;
      return enteringLeafNodes.each(function (dataAttributes) {
        const d3Node = d3.select(this);
        const rowNum = dataAttributes.rowOrder; // set by d3-grid
        const colNum = dataAttributes.colOrder; // set by d3-grid

        // use .get as [rowNum] may be null
        const textConfig = _.get(floatingLabelConfig, `[${rowNum}][${colNum}]`);
        if (textConfig) {
          const x = (() => {
            switch (true) {
              case textConfig['horizontal-align'] === 'start': return 0 + textConfig['padding-left'];
              case textConfig['horizontal-align'] === 'middle': return imageWidth / 2;
              case textConfig['horizontal-align'] === 'end': return imageWidth - textConfig['padding-right'];
              default: throw new Error(`Invalid horizontal-align: ${textConfig['horizontal-align']}`);
            }
          })();

          const [yMidpoint, dominantBaseline] = (() => {
            switch (true) {
              case textConfig['vertical-align'] === 'top': return [0 + textConfig['padding-top'], 'text-before-edge'];
              case textConfig['vertical-align'] === 'center': return [imageHeight / 2, 'central'];
              case textConfig['vertical-align'] === 'bottom': return [imageHeight - textConfig['padding-bottom'], 'text-after-edge'];
              default: throw new Error(`Invalid vertical-align: ${textConfig['vertical-align']}`);
            }
          })();

          d3Node.append('svg:text')
            .attr('class', `floating-label ${textConfig.className}`)
            .attr('x', x)
            .attr('y', yMidpoint)
            .attr('text-anchor', textConfig['horizontal-align'])
            .style('font-size', _graphicCell.getAdjustedTextSize(textConfig['font-size']))
            .style('dominant-baseline', dominantBaseline)
            .text(textConfig.text);
        }
      });
    });
  }

  _computeDimensions() {
    this.dimensions = {};
    const dim = this.dimensions;
    const padding = this.config.padding;

    // need these first to calc graphicHeight
    dim.headerHeight = 0 + ((this.config['text-header'] != null) ? this.getAdjustedTextSize(this.config['text-header']['font-size']) : 0);
    dim.footerHeight = 0 + ((this.config['text-footer'] != null) ? this.getAdjustedTextSize(this.config['text-footer']['font-size']) : 0);

    dim.headerWidth = this.width - padding.left - padding.right;
    dim.headerXOffset = 0 + padding.left;
    dim.headerYOffset = 0 + padding.top;

    dim.graphicWidth = this.width - padding.left - padding.right;
    dim.graphicHeight = this.height - dim.headerHeight - dim.footerHeight - padding.top - padding.bottom;
    dim.graphicXOffset = 0 + padding.left;
    dim.graphicYOffset = 0 + dim.headerYOffset + dim.headerHeight;

    dim.footerWidth = this.width - padding.left - padding.right;
    dim.footerXOffset = 0 + padding.left;
    dim.footerYOffset = 0 + dim.graphicYOffset + dim.graphicHeight;
  }

  _addTextTo(parent, myClass, textConfig, textSpanWidth, yMidpoint) {
    const x = (() => {
      switch (true) {
        case textConfig['horizontal-align'] === 'start': return 0 + textConfig['padding-left'];
        case textConfig['horizontal-align'] === 'middle': return textSpanWidth / 2;
        case textConfig['horizontal-align'] === 'end': return textSpanWidth - textConfig['padding-right'];
        default: throw new Error(`Invalid horizontal-align: ${textConfig['horizontal-align']}`);
      }
    })();

    return parent.append('svg:text')
      .attr('class', myClass)
      .attr('x', x)
      .attr('y', yMidpoint)
      .attr('text-anchor', textConfig['horizontal-align'])
      .style('font-size', this.getAdjustedTextSize(textConfig['font-size']))
      .style('dominant-baseline', 'central')
      .text(textConfig.text);
  }

  _generateDataArray(proportion, numImages) {
    const d3Data = [];
    // NB the alg uses terms based on assigning 2D area to an array of shapes
    let remainingArea = proportion * numImages;
    _.range(numImages).forEach((i) => {
      const proportionForImageI = (remainingArea > 1) ? 1 : remainingArea;
      remainingArea -= proportionForImageI;
      d3Data.push({ proportion: proportionForImageI, i });
    });
    return d3Data;
  }

  _resize() {
    this.parentSvg.selectAll('*').remove();
    return this._draw();
  }
}

module.exports = GraphicCell;
