
import _ from 'lodash'
import d3 from 'd3'
import $ from 'jquery'
import BaseCell from './BaseCell'
import GraphicCell from './GraphicCell'
import LabelCell from './LabelCell'
import EmptyCell from './EmptyCell'
import ColorFactory from './ColorFactory'

class Pictograph {
  static initClass () {
    this.widgetIndex = -1
  }

  static get validRootAttributes () {
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
      'preserveAspectRatio'
    ]
  }

  static get validTableAttributes () {
    return [
      'colors',
      'columnGutterLength',
      'colWidths',
      'lines',
      'rowGutterLength',
      'rowHeights',
      'rows'
    ]
  }

  static get cssDefaults () {
    return {
      'font-family': 'Verdana,sans-serif',
      'font-weight': '900',
      'font-size': '24px',
      'font-color': 'black'
    }
  }

  constructor (el, width, height) {
    Pictograph.widgetIndex++
    this.rootElement = _.has(el, 'length') ? el[0] : el
    this.initialWidth = width
    this.initialHeight = height
    this.specifiedWidth = width
    this.specifiedHeight = height
    this._initializeSizing(width, height)
  }

  // Push to SVG class
  _initializeSizing (initialWidth, initialHeight) {
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
          height: null
        },
        containerToViewBox: { // NB this is ratio between current Actual, and the viewBox
          width: null,
          height: null
        }
      }
    }
  }

  _recomputeSizing (newSpecifiedWidth, newSpecifiedHeight) {
    // TODO can I use this.outerSvg here instead ?
    const rootElement = $(`#${this.config['table-id']}`)
    const newActualWidth = rootElement.width()
    const newActualHeight = rootElement.height()

    const ratios = this.sizes.ratios
    ratios.containerToViewBox.width = (newActualWidth * 1.0) / this.sizes.viewBoxWidth
    ratios.containerToViewBox.height = (newActualHeight * 1.0) / this.sizes.viewBoxHeight
    ratios.containerDelta.width = (newActualWidth * 1.0) / this.sizes.actualWidth
    ratios.containerDelta.height = (newActualHeight * 1.0) / this.sizes.actualHeight

    this.sizes.actualWidth = newActualWidth
    this.sizes.actualHeight = newActualHeight
    if (newSpecifiedWidth) { this.sizes.newSpecifiedWidth = newSpecifiedWidth }
    if (newSpecifiedHeight) { this.sizes.newSpecifiedHeight = newSpecifiedHeight }

    // TODO do I need to check for preserveAspectRatio and if == node then always take height ?
    ratios.textSize = 1.0 / Math.min(ratios.containerToViewBox.width, ratios.containerToViewBox.height)
  }

  resize (newSpecifiedWidth, newSpecifiedHeight) {
    if (this.config.resizable === false) { return }

    this._recomputeSizing(newSpecifiedWidth, newSpecifiedHeight)

    this.cellInstances.forEach(cellInstance =>
      cellInstance.resize(this.sizes))
  }

  // NB I am overriding this method from the baseclass so I can support string input
  setConfig (config) {
    this.config = config
    if (_.isString(this.config)) {
      this.config = { variableImage: this.config }
    }
    if (!this.config['table-id']) { this.config['table-id'] = `rhtmlwidget-${Pictograph.widgetIndex}` }
    return this._processConfig()
  }

  _processSimpleSingleGraphicCellConfig (config) {
    const pictographConfig = _.pick(config, Pictograph.validRootAttributes)
    const graphicCellConfig = _.pick(config, GraphicCell.validRootAttributes)

    pictographConfig.table = { rows: [[{ type: 'graphic', value: graphicCellConfig }]] }

    return pictographConfig
  }

  // TODO break into two, take valid as input param, move to utility
  _checkForInvalidAttributes (config) {
    const invalidRootAttributes = _.difference(_.keys(config), Pictograph.validRootAttributes)
    if (invalidRootAttributes.length > 0) {
      throw new Error(`Invalid attribute(s): ${JSON.stringify(invalidRootAttributes)}`)
    }

    const invalidTableAttributes = _.difference(_.keys(config.table), Pictograph.validTableAttributes)
    if (invalidTableAttributes.length > 0) {
      throw new Error(`Invalid table attribute(s): ${JSON.stringify(invalidTableAttributes)}`)
    }
  }

  _processConfig () {
    // update the specified width/height used in the baseclass used to redraw the SVG
    if (this.config.width) { this.specifiedWidth = this.config.width; delete this.config.width }
    if (this.config.height) { this.specifiedHeight = this.config.height; delete this.config.height }

    if (this.config.table == null) {
      this.config = this._processSimpleSingleGraphicCellConfig(this.config)
    }

    this._checkForInvalidAttributes(this.config)

    this._verifyKeyIsInt(this.config.table, 'rowGutterLength', 0)
    this._verifyKeyIsInt(this.config.table, 'columnGutterLength', 0)

    if (this.config.resizable === 'true') { this.config.resizable = true }
    if (this.config.resizable === 'false') { this.config.resizable = false }
    if (this.config.resizable == null) { this.config.resizable = true }
    if (!_.isBoolean(this.config.resizable)) { throw new Error('resizable must be [true|false]') }

    // @TODO extract CssCollector from BaseCell. This is hacky
    this.cssCollector = new BaseCell()
    this.cssCollector.setCssSelector(this.config['table-id'])
    this.cssCollector._draw = () => _.noop

    if (this.config.table.rows == null) { throw new Error("Must specify 'table.rows'") }

    _.forEach(Pictograph.cssDefaults, (defaultValue, cssAttribute) => {
      const cssValue = this.config[cssAttribute] ? this.config[cssAttribute] : defaultValue

      // NB font-size must be explicitly provided to child cells (via BaseCell defaults),
      // because it is required for calculating height offsets.
      // All other css values we can leave them implicitly set via CSS inheritance
      // also font-size must be a string (containing a number), so cast it to string

      if (cssAttribute === 'font-size') {
        return BaseCell.setDefault(cssAttribute, `${cssValue}`)
      }

      return this.cssCollector.setCss('', cssAttribute, cssValue)
    })

    if (this.config.css) {
      _.forEach(this.config.css, (cssBlock, cssLocationString) => {
        _.forEach(cssBlock, (cssValue, cssAttribute) => {
          this.cssCollector.setCss(cssLocationString, cssAttribute, cssValue)
        })
      })
    }

    if (this.config.table.colors) { ColorFactory.processNewConfig(this.config.table.colors) }

    this.numTableRows = this.config.table.rows.length
    this.numTableCols = Math.max.apply(null, this.config.table.rows.map(row => row.length))
    this.config.table.rows.forEach((row, rowIndex) => {
      if (!_.isArray(row)) {
        throw new Error(`Invalid rows spec: row ${rowIndex} must be array of cell definitions`)
      }

      if (this.numTableCols !== row.length) {
        _.range(this.numTableCols - row.length).forEach(() => { row.push({ type: 'empty' }) })
      }

      this.config.table.rows[rowIndex] = row.map((cellDefinition, columnIndex) => {
        if (_.isString(cellDefinition)) {
          cellDefinition = this._convertStringDefinitionToCellDefinition(cellDefinition)
        }
        cellDefinition.rowIndex = rowIndex
        cellDefinition.columnIndex = columnIndex
        // creating this now might cause rerender issues
        cellDefinition.instance = this.createCellInstance(cellDefinition)
        return cellDefinition
      })
    })
  }

  createCellInstance (cellDefinition) {
    let cellInstance = null
    if (cellDefinition.type === 'graphic') {
      cellInstance = new GraphicCell()
    } else if (cellDefinition.type === 'label') {
      cellInstance = new LabelCell()
    } else if (cellDefinition.type === 'empty') {
      cellInstance = new EmptyCell()
    } else {
      throw new Error(`Invalid cell definition: ${JSON.stringify(cellDefinition)} : missing or invalid type`)
    }

    cellInstance.setCssSelector([
      this.config['table-id'],
      `table-cell-${cellDefinition.rowIndex}-${cellDefinition.columnIndex}`
    ])

    cellInstance.setConfig(cellDefinition.value)

    return cellInstance
  }

  getAllCellsInColumn (columnIndex) {
    return _.range(this.numTableRows).map((rowIndex) => {
      return this.getCell(rowIndex, columnIndex)
    })
  }

  getCell (rowIndex, columnIndex) {
    return this.config.table.rows[rowIndex][columnIndex]
  }

  _convertStringDefinitionToCellDefinition (stringDefinition) {
    if (stringDefinition.startsWith('label:')) {
      return {
        type: 'label',
        value: stringDefinition.replace(/^label:/, '')
      }
    }

    return {
      type: 'graphic',
      value: { variableImage: stringDefinition }
    }
  }

  _computeTableLinesLayout () {
    const numGuttersAt = index => index
    const table = this.config.table

    if (!table.lines) { table.lines = {} }
    table.lines.horizontal = (table.lines.horizontal || []).sort()
    table.lines.vertical = (table.lines.vertical || []).sort();

    ['padding-left', 'padding-right', 'padding-top', 'padding-bottom'].forEach(attr => this._verifyKeyIsInt(table.lines, attr, 0))

    const calcLineVariableDimension = function (linePosition, cellSizes, paddingSize) {
      const numCellsPast = Math.floor(linePosition)
      const fractionOfCell = linePosition - numCellsPast
      const sizeOfNumCellsPast = _.sum(_.slice(cellSizes, 0, numCellsPast))

      let sizeOfGuttersPast = 0
      if (numCellsPast > 0 && numCellsPast < cellSizes.length) {
        sizeOfGuttersPast = (numGuttersAt(numCellsPast) * paddingSize) - (0.5 * paddingSize)
      } else if (numCellsPast > 0 && numCellsPast === cellSizes.length) {
        sizeOfGuttersPast = numGuttersAt(numCellsPast - 1) * paddingSize
      }

      let sizeOfFraction = 0
      if (numCellsPast === 0) {
        sizeOfFraction = fractionOfCell * cellSizes[numCellsPast]
      } else if (numCellsPast < cellSizes.length) {
        sizeOfFraction = fractionOfCell * (cellSizes[numCellsPast] + paddingSize)
      }

      return sizeOfNumCellsPast + sizeOfGuttersPast + sizeOfFraction
    }

    const parseAndValidateLineIndex = function (lineType, lineIndexCandidate, maxLines) {
      const lineIndex = parseFloat(lineIndexCandidate)
      if (_.isNaN(lineIndex)) {
        throw new Error(`Invalid ${lineType} line position '${lineIndexCandidate}': must be numeric`)
      }

      if (lineIndex > maxLines || lineIndex < 0) {
        throw new Error(`Cannot create line at '${lineIndex}': past end of table`)
      }

      return lineIndex
    }

    table.lines.horizontal = table.lines.horizontal.map((lineIndexCandidate) => {
      const lineIndex = parseAndValidateLineIndex('horizontal', lineIndexCandidate, this.numTableRows)

      const y = calcLineVariableDimension(lineIndex, table.rowHeights, table.rowGutterLength)
      return {
        position: lineIndex,
        x1: 0 + table.lines['padding-left'],
        x2: this.specifiedWidth - table.lines['padding-right'],
        y1: y,
        y2: y,
        style: table.lines.style || 'stroke:black;stroke-width:2'
      }
    })

    table.lines.vertical = table.lines.vertical.map((lineIndexCandidate) => {
      const lineIndex = parseAndValidateLineIndex('vertical', lineIndexCandidate, this.numTableCols)

      const x = calcLineVariableDimension(lineIndex, table.colWidths, table.columnGutterLength)
      return {
        position: lineIndex,
        x1: x,
        x2: x,
        y1: 0 + table.lines['padding-top'],
        y2: this.specifiedHeight - table.lines['padding-bottom'],
        style: table.lines.style || 'stroke:black;stroke-width:2'
      }
    })
  }

  _computeTableLayout () {
    const numGuttersAt = index => index
    const table = this.config.table

    const processCellSizeSpec = (input, range) => {
      const output = {}
      let match = false

      if (!_.isNaN(parseInt(input))) {
        match = true
        output.min = parseInt(input)
        output.max = parseInt(input)
        output.size = parseInt(input)
        output.flexible = false
      }

      // TODO catch this number vs string issue earlier
      if (`${input}`.match(/^proportion:[0-9.]+$/)) {
        match = true
        const [, proportion] = input.match(/^proportion:([0-9.]+)$/)
        output.min = range * parseFloat(proportion)
        output.max = range * parseFloat(proportion)
        output.size = range * parseFloat(proportion)
        output.flexible = false
      }

      if (input === 'max') {
        match = true
        output.min = null
        output.max = null
        output.size = null
        output.flexible = true
        output.grow = true
      }

      if (input === 'min') {
        match = true
        output.min = null
        output.max = null
        output.size = null
        output.flexible = true
        output.shrink = true
      }

      if (!match) {
        throw new Error(`Invalid cell size specification: '${input}'`)
      }

      return output
    }

    const _processCellSizeSpecifications = () => {
      const totalHeightAvailable = this.specifiedHeight - ((this.numTableRows - 1) * table.rowGutterLength)
      if (table.rowHeights) {
        if (!_.isArray(table.rowHeights)) {
          throw new Error('rowHeights must be array')
        }

        if (table.rowHeights.length !== this.numTableRows) {
          throw new Error('rowHeights length must match num rows specified')
        }

        table.rowHeights = table.rowHeights.map((candidate) => {
          return processCellSizeSpec(candidate, totalHeightAvailable)
        })
      } else {
        table.rowHeights = _.range(this.numTableRows).map(() => {
          return {
            min: parseInt(totalHeightAvailable / this.numTableRows),
            max: parseInt(totalHeightAvailable / this.numTableRows),
            size: parseInt(totalHeightAvailable / this.numTableRows),
            flexible: false
          }
        })
      }

      const totalWidthAvailable = this.specifiedWidth - ((this.numTableRows - 1) * table.columnGutterLength)
      if (table.colWidths) {
        if (!_.isArray(table.colWidths)) {
          throw new Error('colWidths must be array')
        }

        if (table.colWidths.length !== this.numTableCols) {
          throw new Error('colWidths length must match num columns specified')
        }

        table.colWidths = table.colWidths.map((candidate) => {
          return processCellSizeSpec(candidate, totalWidthAvailable)
        })
      } else {
        table.colWidths = _.range(this.numTableCols).map(() => {
          return {
            min: parseInt(totalWidthAvailable / this.numTableCols),
            max: parseInt(totalWidthAvailable / this.numTableCols),
            size: parseInt(totalWidthAvailable / this.numTableCols),
            flexible: false
          }
        })
      }
    }

    const _computeCellSizes = () => {
      // assume cols first
      const columnPromise = new Promise((resolve, reject) => {
        let totalWidthAvailable = this.specifiedWidth - ((this.numTableRows - 1) * table.columnGutterLength)

        const fixedCellWidths = table.colWidths
          .filter(columnWidthData => !columnWidthData.flexible)
          .map(columnWidthData => columnWidthData.min)

        totalWidthAvailable -= _.sum(fixedCellWidths)

        // get promises for all flexible cells
        const flexibleColumnIndexes = table.colWidths.map((columnWidthData, index) => {
          if (columnWidthData.flexible) {
            return index
          }
          return null
        }).filter(indexOrNull => !_.isNull(indexOrNull))

        // alternate path : stop what we are doing, and focus on
        // combine the configs and the cell instances together
        // add setter / getter

        const someMorePromises = flexibleColumnIndexes.map((flexibleColumnIndex) => {
          const cells = this.getAllCellsInColumn(flexibleColumnIndex)
          const dimensionConstraintPromises = cells.map((cell) => {
            return cell.instance.getDimensionConstraints()
          })

          const columnWidthData = table.colWidths[flexibleColumnIndex]
          return Promise.all(dimensionConstraintPromises).then((dimensionConstraints) => {
            if (columnWidthData.shrink) {
              const maxOfMinSizes = Math.max.apply(null, _(dimensionConstraints).map('minWidth').value())
              columnWidthData.size = maxOfMinSizes
              totalWidthAvailable -= columnWidthData.size
            }

            if (columnWidthData.grow) {
              dimensionConstraints.map((dimensionContraint, rowIndex) => {
                dimensionContraint.minWidth = table.rowHeights[rowIndex].min * dimensionContraint.aspectRatio
                dimensionContraint.maxWidth = table.rowHeights[rowIndex].max * dimensionContraint.aspectRatio
              })

              const minOfMaxSizes = Math.min.apply(null, _(dimensionConstraints).map('maxWidth').value())
              columnWidthData.size = Math.min(minOfMaxSizes, totalWidthAvailable)
              totalWidthAvailable -= columnWidthData.size
            }
          })
        })

        return resolve(Promise.all(someMorePromises))
      })

      // TODO do this
      const rowPromise = new Promise((resolve, reject) => {
        resolve()
      })

      return Promise.all([columnPromise, rowPromise])
    }

    const _computeCellPlacement = () => {
      table.rows.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          cell.x = _.sum(_(table.colWidths).slice(0, colIndex).map('size').value()) + (numGuttersAt(colIndex) * table.columnGutterLength)
          cell.y = _.sum(_(table.rowHeights).slice(0, rowIndex).map('size').value()) + (numGuttersAt(rowIndex) * table.rowGutterLength)
          cell.width = table.colWidths[colIndex].size
          cell.height = table.rowHeights[rowIndex].size
          cell.row = rowIndex
          cell.col = colIndex
        })
      })
      return Promise.resolve()
    }

    return Promise.resolve()
      .then(_processCellSizeSpecifications.bind(this))
      .then(_computeCellSizes.bind(this))
      .then(_computeCellPlacement.bind(this))
  }

  draw () {
    this._manipulateRootElementSize()
    this._addRootSvgToRootElement()
    return this._redraw()
  }

  _redraw () {
    return Promise.resolve(this.cssCollector.draw())
      .then(this._computeTableLayout.bind(this))
      .then(this._computeTableLinesLayout.bind(this))
      .then(this._recomputeSizing.bind(this))
      .then(() => {
        const tableCells = _.flatten(this.config.table.rows)
        
        const addLines = (lineType, data) => this.outerSvg.selectAll(`.${lineType}`)
          .data(data)
          .enter()
          .append('line')
            .attr('x1', d => d.x1)
            .attr('x2', d => d.x2)
            .attr('y1', d => d.y1)
            .attr('y2', d => d.y2)
            .attr('style', d => d.style)
            .attr('class', d => `line ${lineType} line-${d.position}`)

        if (this.config['background-color']) {
          this.outerSvg.append('svg:rect')
          .attr('class', 'background')
          .attr('width', this.specifiedWidth)
          .attr('height', this.specifiedHeight)
          .attr('fill', this.config['background-color'])
        }

        addLines('horizontal-line', this.config.table.lines.horizontal)
        addLines('vertical-line', this.config.table.lines.vertical)

        const enteringCells = this.outerSvg.selectAll('.table-cell')
          .data(tableCells)
          .enter()
          .append('g')
            .attr('class', 'table-cell')
            .attr('transform', d => `translate(${d.x},${d.y})`)

        const { sizes } = this
        const table = this.config.table
        enteringCells.each(function (d) {
          const instance = table.rows[d.row][d.col].instance

          d3.select(this).classed(`table-cell-${d.row}-${d.col}`, true)
          d3.select(this).classed(d.type, true)

          instance.setParentSvg(d3.select(this))
          instance.setWidth(d.width)
          instance.setHeight(d.height)
          instance.setPictographSizeInfo(sizes)
          instance.draw()
        })
      })
      .catch((error) => {
        console.error(`error in pictograph _redraw: ${error.message}`)
        console.error(error.stack)
        throw error
      })
  }

  // TODO pull from shared location
  _verifyKeyIsInt (input, key, defaultValue, message) {
    if (message == null) { message = 'Must be integer' }
    if (!_.isUndefined(defaultValue)) {
      if (!_.has(input, key)) {
        input[key] = defaultValue
        return
      }
    }

    if (_.isNaN(parseInt(input[key]))) {
      throw new Error(`invalid '${key}': ${input[key]}. ${message}.`)
    }

    input[key] = parseInt(input[key])
  }

  _manipulateRootElementSize () {
    // root element has width and height in a style tag. Clear that
    $(this.rootElement).attr('style', '')

    if (this.config.resizable) {
      return $(this.rootElement).width('100%').height('100%')
    }
    return $(this.rootElement).width(this.specifiedWidth).height(this.specifiedHeight)
  }

  _addRootSvgToRootElement () {
    $(this.rootElement).find('*').remove()

    const anonSvg = $('<svg class="rhtmlwidget-outer-svg">')
      .addClass(this.config['table-id'])
      .attr('id', this.config['table-id'])
    // .attr('width', '100%')
    // .attr('height', '100%')

    $(this.rootElement).append(anonSvg)

    this.outerSvg = d3.select(anonSvg[0])

    // NB JQuery insists on lowercasing attributes, so we must use JS directly
    // when setting viewBox and preserveAspectRatio ?!
    document.getElementsByClassName(`${this.config['table-id']} rhtmlwidget-outer-svg`)[0]
      .setAttribute('viewBox', `0 0 ${this.specifiedWidth} ${this.specifiedHeight}`)
    if (this.config.preserveAspectRatio != null) {
      document.getElementsByClassName(`${this.config['table-id']} rhtmlwidget-outer-svg`)[0]
        .setAttribute('preserveAspectRatio', this.config.preserveAspectRatio)
    }

    return null
  }
}
Pictograph.initClass()

module.exports = Pictograph
