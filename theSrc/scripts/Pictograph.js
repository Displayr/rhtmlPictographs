
import d3 from 'd3';
import $ from 'jquery';
import BaseCell from './BaseCell';
import GraphicCell from './GraphicCell';
import LabelCell from './LabelCell';
import ColorFactory from './ColorFactory';
import RhtmlSvgWidget from './rhtmlSvgWidget';

class Pictograph extends RhtmlSvgWidget {

  static get validRootAttributes() {
    return [
      'background-color',
      'css',
      'font-color',
      'font-family',
      'font-size',
      'font-weight',
      'table',
      'table-id',
      'resizable',
      'preserveAspectRatio',
    ];
  }

  static get validTableAttributes() {
    return [
      'colors',
      'columnGutterLength',
      'colWidths',
      'lines',
      'rowGutterLength',
      'rowHeights',
      'rows',
    ];
  }

  static get cssDefaults() {
    return {
      'font-family': 'Verdana,sans-serif',
      'font-weight': '900',
      'font-size': '24px',
      'font-color': 'black',
    };
  }

  constructor(el, width, height) {
    super(el, width, height);
    this._initializeSizing(width, height);
  }

  // Push to SVG class
  _initializeSizing(initialWidth, initialHeight) {
    this.sizes = {
      specifiedContainerWidth: initialWidth,
      specifiedContainerHeight: initialHeight,

      actualWidth: initialWidth, // we will override this with data from jquery
      actualHeight: initialHeight, // we will override this with data from jquery

      viewBoxWidth: initialWidth,
      viewBoxHeight: initialHeight,

      ratios: {
        textSize: null,
        containerDelta: { // NB this represents "on each resize how did size change"
          width: null,
          height: null,
        },
        containerToViewBox: { // NB this is ratio between current Actual, and the viewBox
          width: null,
          height: null,
        },
      },
    };
  }

  _recomputeSizing(newSpecifiedWidth, newSpecifiedHeight) {
    // TODO can I use this.outerSvg here instead ?
    const rootElement = $(`#${this.config['table-id']}`);
    const newActualWidth = rootElement.width();
    const newActualHeight = rootElement.height();

    const ratios = this.sizes.ratios;
    ratios.containerToViewBox.width = (newActualWidth * 1.0) / this.sizes.viewBoxWidth;
    ratios.containerToViewBox.height = (newActualHeight * 1.0) / this.sizes.viewBoxHeight;
    ratios.containerDelta.width = (newActualWidth * 1.0) / this.sizes.actualWidth;
    ratios.containerDelta.height = (newActualHeight * 1.0) / this.sizes.actualHeight;

    this.sizes.actualWidth = newActualWidth;
    this.sizes.actualHeight = newActualHeight;
    if (newSpecifiedWidth) { this.sizes.newSpecifiedWidth = newSpecifiedWidth; }
    if (newSpecifiedHeight) { this.sizes.newSpecifiedHeight = newSpecifiedHeight; }

    // TODO do I need to check for preserveAspectRatio and if == node then always take height ?
    ratios.textSize = 1.0 / Math.min(ratios.containerToViewBox.width, ratios.containerToViewBox.height);
  }

  resize(newSpecifiedWidth, newSpecifiedHeight) {
    if (this.config.resizable === false) { return; }

    this._recomputeSizing(newSpecifiedWidth, newSpecifiedHeight);

    this.cellInstances.forEach(cellInstance =>
      cellInstance.resize(this.sizes));
  }

  // NB I am overriding this method from the baseclass so I can support string input
  setConfig(config) {
    this.config = config;
    if (_.isString(this.config)) {
      this.config = { variableImage: this.config };
    }
    return super.setConfig(this.config);
  }

  _processConfig() {
    // do not accept width and height from config, they were passed to constructor
    delete this.config.width;
    delete this.config.height;

    if (this.config.table == null) {
      const pictographConfig = _.pick(this.config, Pictograph.validRootAttributes);
      const graphicCellConfig = _.pick(this.config, GraphicCell.validRootAttributes);
      // console.log(`keysToKeepInPictograph: ${keysToKeepInPictograph}`)

      pictographConfig.table = { rows: [[{ type: 'graphic', value: graphicCellConfig }]] };
      this.config = pictographConfig;
    }

    const invalidRootAttributes = _.difference(_.keys(this.config), Pictograph.validRootAttributes);
    if (invalidRootAttributes.length > 0) {
      throw new Error(`Invalid attribute(s): ${JSON.stringify(invalidRootAttributes)}`);
    }

    const invalidTableAttributes = _.difference(_.keys(this.config.table), Pictograph.validTableAttributes);
    if (invalidTableAttributes.length > 0) {
      throw new Error(`Invalid table attribute(s): ${JSON.stringify(invalidTableAttributes)}`);
    }

    this._verifyKeyIsInt(this.config.table, 'rowGutterLength', 0);
    this._verifyKeyIsInt(this.config.table, 'columnGutterLength', 0);

    if (this.config.resizable === 'true') { this.config.resizable = true; }
    if (this.config.resizable === 'false') { this.config.resizable = false; }
    if (this.config.resizable == null) { this.config.resizable = true; }
    if (!_.isBoolean(this.config.resizable)) { throw new Error('resizable must be [true|false]'); }

    // @TODO extract CssCollector from BaseCell. This is hacky
    this.cssCollector = new BaseCell(null, `${this.config['table-id']}`);
    this.cssCollector._draw = () => _.noop;

    if (this.config.table.rows == null) { throw new Error("Must specify 'table.rows'"); }

    this.numTableRows = this.config.table.rows.length;
    this.numTableCols = Math.max.apply(null, this.config.table.rows.map(row => row.length));
    this.config.table.rows.forEach((row, rowIndex) => {
      if (!_.isArray(row)) {
        throw new Error(`Invalid rows spec: row ${rowIndex} must be array of cell definitions`);
      }

      if (this.numTableCols !== row.length) {
        _.range(this.numTableCols - row.length).forEach(() => { row.push({ type: 'empty' }); });
      }

      this.config.table.rows[rowIndex] = row.map((cellDefinition) => {
        if (_.isString(cellDefinition)) {
          return this._convertStringDefinitionToCellDefinition(cellDefinition);
        }
        return cellDefinition;
      });
    });

    _.forEach(Pictograph.cssDefaults, (defaultValue, cssAttribute) => {
      const cssValue = this.config[cssAttribute] ? this.config[cssAttribute] : defaultValue;

      // NB font-size must be explicitly provided to child cells (via BaseCell defaults),
      // because it is required for calculating height offsets.
      // All other css values we can leave them implicitly set via CSS inheritance
      // also font-size must be a string (containing a number), so cast it to string

      if (cssAttribute === 'font-size') {
        return BaseCell.setDefault(cssAttribute, `${cssValue}`);
      }

      return this.cssCollector.setCss('', cssAttribute, cssValue);
    });

    if (this.config.css) {
      _.forEach(this.config.css, (cssBlock, cssLocationString) => {
        _.forEach(cssBlock, (cssValue, cssAttribute) => {
          this.cssCollector.setCss(cssLocationString, cssAttribute, cssValue);
        });
      });
    }

    if (this.config.table.colors) { ColorFactory.processNewConfig(this.config.table.colors); }
  }

  _convertStringDefinitionToCellDefinition(stringDefinition) {
    if (stringDefinition.startsWith('label:')) {
      return {
        type: 'label',
        value: stringDefinition.replace(/^label:/, ''),
      };
    }

    return {
      type: 'graphic',
      value: { variableImage: stringDefinition },
    };
  }

  _computeTableLinesLayout() {
    const numGuttersAt = index => index;
    const table = this.config.table;

    if (!table.lines) { table.lines = {}; }
    table.lines.horizontal = (table.lines.horizontal || []).sort();
    table.lines.vertical = (table.lines.vertical || []).sort();

    ['padding-left', 'padding-right', 'padding-top', 'padding-bottom'].forEach(attr => this._verifyKeyIsInt(table.lines, attr, 0));

    const calcLineVariableDimension = function (linePosition, cellSizes, paddingSize) {
      const numCellsPast = Math.floor(linePosition);
      const fractionOfCell = linePosition - numCellsPast;
      const sizeOfNumCellsPast = _.sum(_.slice(cellSizes, 0, numCellsPast));

      let sizeOfGuttersPast = 0;
      if (numCellsPast > 0 && numCellsPast < cellSizes.length) {
        sizeOfGuttersPast = (numGuttersAt(numCellsPast) * paddingSize) - (0.5 * paddingSize);
      } else if (numCellsPast > 0 && numCellsPast === cellSizes.length) {
        sizeOfGuttersPast = numGuttersAt(numCellsPast - 1) * paddingSize;
      }

      let sizeOfFraction = 0;
      if (numCellsPast === 0) {
        sizeOfFraction = fractionOfCell * cellSizes[numCellsPast];
      } else if (numCellsPast < cellSizes.length) {
        sizeOfFraction = fractionOfCell * (cellSizes[numCellsPast] + paddingSize);
      }

      return sizeOfNumCellsPast + sizeOfGuttersPast + sizeOfFraction;
    };

    const parseAndValidateLineIndex = function (lineType, lineIndexCandidate, maxLines) {
      const lineIndex = parseFloat(lineIndexCandidate);
      if (_.isNaN(lineIndex)) {
        throw new Error(`Invalid ${lineType} line position '${lineIndexCandidate}': must be numeric`);
      }

      if (lineIndex > maxLines || lineIndex < 0) {
        throw new Error(`Cannot create line at '${lineIndex}': past end of table`);
      }

      return lineIndex;
    };

    table.lines.horizontal = table.lines.horizontal.map((lineIndexCandidate) => {
      const lineIndex = parseAndValidateLineIndex('horizontal', lineIndexCandidate, this.numTableRows);

      const y = calcLineVariableDimension(lineIndex, table.rowHeights, table.rowGutterLength);
      return {
        position: lineIndex,
        x1: 0 + table.lines['padding-left'],
        x2: this.initialWidth - table.lines['padding-right'],
        y1: y,
        y2: y,
        style: table.lines.style || 'stroke:black;stroke-width:2',
      };
    });

    table.lines.vertical = table.lines.vertical.map((lineIndexCandidate) => {
      const lineIndex = parseAndValidateLineIndex('vertical', lineIndexCandidate, this.numTableCols);

      const x = calcLineVariableDimension(lineIndex, table.colWidths, table.columnGutterLength);
      return {
        position: lineIndex,
        x1: x,
        x2: x,
        y1: 0 + table.lines['padding-top'],
        y2: this.initialHeight - table.lines['padding-bottom'],
        style: table.lines.style || 'stroke:black;stroke-width:2',
      };
    });
  }

  _computeTableLayout() {
    const numGuttersAt = index => index;
    const table = this.config.table;

    if (table.rowHeights) {
      if (!_.isArray(table.rowHeights)) {
        throw new Error('rowHeights must be array');
      }

      if (table.rowHeights.length !== this.numTableRows) {
        throw new Error('rowHeights length must match num rows specified');
      }

      table.rowHeights = table.rowHeights.map(function (candidate) {
        const rowHeight = parseInt(candidate);
        if (_.isNaN(rowHeight)) {
          throw new Error(`Invalid rowHeight '${candidate}': must be integer`);
        }
        return rowHeight;
      });

      const sumSpecified = _.sum(table.rowHeights) + ((this.numTableRows - 1) * table.rowGutterLength);
      if (sumSpecified > this.initialHeight) {
        throw new Error(`Cannot specify rowHeights/rowGutterLength where sum(rows+padding) exceeds table height: ${sumSpecified} !< ${this.initialHeight}`);
      }
    } else {
      table.rowHeights = _.range(this.numTableRows).map(() => parseInt(this.initialHeight / this.numTableRows));
    }

    if (table.colWidths) {
      if (!_.isArray(table.colWidths)) {
        throw new Error('colWidths must be array');
      }

      if (table.colWidths.length !== this.numTableCols) {
        throw new Error('colWidths length must match num columns specified');
      }

      table.colWidths = table.colWidths.map(function (candidate) {
        const colWidth = parseInt(candidate);
        if (_.isNaN(colWidth)) {
          throw new Error(`Invalid colWidth '${candidate}': must be integer`);
        }
        return colWidth;
      });

      const sumSpecified = _.sum(table.colWidths) + ((this.numTableCols - 1) * table.columnGutterLength);
      if (sumSpecified > this.initialWidth) {
        throw new Error(`Cannot specify colWidths/columnGutterLength where sum(cols+padding) exceeds table width: : ${sumSpecified} !< ${this.initialWidth}`);
      }
    } else {
      table.colWidths = _.range(this.numTableCols).map(() => parseInt(this.initialWidth / this.numTableCols));
    }

    table.rows.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        cell.x = _.sum(_.slice(table.colWidths, 0, colIndex)) + (numGuttersAt(colIndex) * table.columnGutterLength);
        cell.y = _.sum(_.slice(table.rowHeights, 0, rowIndex)) + (numGuttersAt(rowIndex) * table.rowGutterLength);
        cell.width = table.colWidths[colIndex];
        cell.height = table.rowHeights[rowIndex];
        cell.row = rowIndex;
        cell.col = colIndex;
      });
    });
  }

  _redraw() {
    this.cssCollector.draw();
    this._computeTableLayout(); // @TODO I can be done once not every time
    this._computeTableLinesLayout(); // @TODO I can be done once not every time
    this._recomputeSizing();

    const tableCells = _.flatten(this.config.table.rows);

    const addLines = (lineType, data) => this.outerSvg.selectAll(`.${lineType}`)
      .data(data)
      .enter()
      .append('line')
        .attr('x1', d => d.x1)
        .attr('x2', d => d.x2)
        .attr('y1', d => d.y1)
        .attr('y2', d => d.y2)
        .attr('style', d => d.style)
        .attr('class', d => `line ${lineType} line-${d.position}`);

    if (this.config['background-color']) {
      this.outerSvg.append('svg:rect')
      .attr('class', 'background')
      .attr('width', this.initialWidth)
      .attr('height', this.initialHeight)
      .attr('fill', this.config['background-color']);
    }

    addLines('horizontal-line', this.config.table.lines.horizontal);
    addLines('vertical-line', this.config.table.lines.vertical);

    const enteringCells = this.outerSvg.selectAll('.table-cell')
      .data(tableCells)
      .enter()
      .append('g')
        .attr('class', 'table-cell')
        .attr('transform', d => `translate(${d.x},${d.y})`);

    const tableId = this.config['table-id'];
    this.cellInstances = [];
    const { cellInstances, sizes } = this; // NB make this.cellInstances and this.sizes available for function below
    enteringCells.each(function (d) {
      const cssWrapperClass = `table-cell-${d.row}-${d.col}`;
      d3.select(this).classed(cssWrapperClass, true);

      if (d.type === 'graphic') {
        d3.select(this).classed('graphic', true);
        const graphic = new GraphicCell(d3.select(this), [tableId, cssWrapperClass], d.width, d.height, sizes);
        graphic.setConfig(d.value);
        graphic.draw();
        return cellInstances.push(graphic);
      } else if (d.type === 'label') {
        d3.select(this).classed('label', true);
        const label = new LabelCell(d3.select(this), [tableId, cssWrapperClass], d.width, d.height, sizes);
        label.setConfig(d.value);
        label.draw();
        return cellInstances.push(label);
      } else if (d.type === 'empty') {
        return d3.select(this).classed('empty', true);
      }
      throw new Error(`Invalid cell definition: ${JSON.stringify(d)} : missing or invalid type`);
    });

    return null;
  }

  // TODO pull from shared location
  _verifyKeyIsInt(input, key, defaultValue, message) {
    if (message == null) { message = 'Must be integer'; }
    if (!_.isUndefined(defaultValue)) {
      if (!_.has(input, key)) {
        input[key] = defaultValue;
        return;
      }
    }

    if (_.isNaN(parseInt(input[key]))) {
      throw new Error(`invalid '${key}': ${input[key]}. ${message}.`);
    }

    input[key] = parseInt(input[key]);
  }
}

module.exports = Pictograph;
