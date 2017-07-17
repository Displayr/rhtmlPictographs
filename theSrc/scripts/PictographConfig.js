import _ from 'lodash'
import BaseCell from './BaseCell'
import GraphicCell from './GraphicCell'
import LabelCell from './LabelCell'
import EmptyCell from './EmptyCell'
import ColorFactory from './ColorFactory'

class PictographConfig {
  static initClass () {
    this.widgetIndex = -1
  }

  static get validRootAttributes () {
    return [
      'background-color',
      'width',
      'height',
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

  constructor () {
    PictographConfig.widgetIndex++

    this.alignment = {
      horizontal: 'center', // left|center|right
      vertical: 'center' // top|center|bottom
    }

    this.size = {
      initial: {width: null, height: null}, // what was the first specified dimension
      specified: {width: null, height: null}, // what are the current specified dimensions
      viewBox: {width: null, height: null}, // what are the actual dimensions (via jquery inspection)
      actual: {width: null, height: null}, // what is the actual size (via jquery inspection)
      ratios: {
        textSize: 1,
        containerDelta: {width: 1, height: 1}, // on each resize how did dimensions change
        containerToViewBox: {width: 1, height: 1}  // the ratio between current actual, and the viewBox
      },
      outerPadding: {top: 0, right: 0, bottom: 0, left: 0},
      gutter: {row: 3, column: 4}
    }

    this.gridInfo = {
      dimensions: {row: null, column: null},
      flexible: {row: false, column: false},
      sizes: {row: [], column: []},
      constraints: {row: [], column: []}
    }

    this.lines = {
      horizontal: [],
      vertical: [],
      style: 'stroke:black;stroke-width:2',
      padding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      }
    }

    this.cells = [] // array of arrays

    this.resizable = null // boolean

    this.cssCollector = null

    this.id = this.assignTableId()
  }

  processUserConfig (userConfig) {
    let userConfigObject = (_.isString(userConfig)) ? {variableImage: userConfig} : userConfig
    if (userConfigObject.table == null) {
      userConfigObject = this._transformGraphicCellConfigToPictographConfig(userConfigObject)
    }

    this._throwOnInvalidAttributes(userConfigObject)

    if (userConfigObject.width) { this.setWidth(userConfigObject.width) }
    if (userConfigObject.height) { this.setHeight(userConfigObject.height) }

    // TODO validate preserveAspectRatio
    this.preserveAspectRatio = userConfigObject.preserveAspectRatio

    // TODO validate background-color
    this['background-color'] = userConfigObject['background-color']

    // TODO something better here
    if (userConfigObject.resizable === 'true') { this.resizable = true }
    if (userConfigObject.resizable === true) { this.resizable = true }
    if (userConfigObject.resizable === 'false') { this.resizable = false }
    if (userConfigObject.resizable === false) { this.resizable = false }
    if (userConfigObject.resizable == null) { this.resizable = true }
    if (!_.isBoolean(this.resizable)) { throw new Error('resizable must be [true|false]') }

    if (userConfigObject.table.colors) { ColorFactory.processNewConfig(userConfigObject.table.colors) }

    this._processPictographPadding(userConfigObject)
    this._processCssConfig(userConfigObject)
    this._processGridConfig(userConfigObject)
    this._processLineConfig(userConfigObject)
  }

  _processPictographPadding (userConfigObject) {
    if (userConfigObject['horizontal-align']) {
      if (!['left', 'center', 'right'].includes(userConfigObject['horizontal-align'])) {
        throw new Error(`Invalid horizontal-align '${userConfigObject['horizontal-align']}': must be 'left', 'center', or 'right'`)
      }
      this.alignment.horizontal = userConfigObject['horizontal-align']
    }

    if (userConfigObject['vertical-align']) {
      if (!['top', 'center', 'bottom'].includes(userConfigObject['vertical-align'])) {
        throw new Error(`Invalid vertical-align '${userConfigObject['vertical-align']}': must be 'top', 'center', or 'bottom'`)
      }
      this.alignment.vertical = userConfigObject['vertical-align']
    }
  }

  _processCssConfig (userConfigObject) {
    // @TODO extract CssCollector from BaseCell. This is hacky
    this.cssCollector = new BaseCell()
    this.cssCollector.setCssSelector(this.id)
    this.cssCollector._draw = () => _.noop

    _.forEach(PictographConfig.cssDefaults, (defaultValue, cssAttribute) => {
      const cssValue = userConfigObject[cssAttribute] ? userConfigObject[cssAttribute] : defaultValue

      // NB font-size must be explicitly provided to child cells (via BaseCell defaults),
      // because it is required for calculating height offsets.
      // All other css values we can leave them implicitly set via CSS inheritance
      // also font-size must be a string (containing a number), so cast it to string

      if (cssAttribute === 'font-size') {
        return BaseCell.setDefault(cssAttribute, `${cssValue}`)
      }

      this.cssCollector.setCss('', cssAttribute, cssValue)
    })

    if (userConfigObject.css) {
      _.forEach(userConfigObject.css, (cssBlock, cssLocationString) => {
        _.forEach(cssBlock, (cssValue, cssAttribute) => {
          this.cssCollector.setCss(cssLocationString, cssAttribute, cssValue)
        })
      })
    }
  }

  _processGridConfig (userConfigObject) {
    const tableConfig = userConfigObject.table
    if (tableConfig.rows == null) { throw new Error('Must specify \'table.rows\'') }

    this.size.gutter.row = this._extractInt({input: tableConfig, key: 'rowGutterLength', defaultValue: 0})
    this.size.gutter.column = this._extractInt({input: tableConfig, key: 'columnGutterLength', defaultValue: 0})
    this.gridInfo.dimensions.row = tableConfig.rows.length
    this.gridInfo.dimensions.column = Math.max.apply(null, tableConfig.rows.map(row => row.length))

    this.cells = tableConfig.rows.map((row, rowIndex) => {
      if (!_.isArray(row)) {
        throw new Error(`Invalid rows spec: row ${rowIndex} must be array of cell definitions`)
      }

      if (this.gridInfo.dimensions.column !== row.length) {
        _.range(this.gridInfo.dimensions.column - row.length).forEach(() => { row.push({type: 'empty'}) })
      }

      return row.map((cellDefinition, columnIndex) => {
        if (_.isString(cellDefinition)) {
          cellDefinition = this._convertStringDefinitionToCellDefinition(cellDefinition)
        }

        return {
          instance: this.createCellInstance(cellDefinition, rowIndex, columnIndex),
          type: cellDefinition.type,
          // this null data is completed in Pictograph._computeCellPlacement
          x: null,
          y: null,
          width: null,
          height: null,
          row: rowIndex,
          column: columnIndex
        }
      })
    })

    const totalWidthAvailable = this.size.specified.width - ((this.gridInfo.dimensions.column - 1) * this.size.gutter.column)
    if (tableConfig.colWidths) {
      if (!_.isArray(tableConfig.colWidths)) {
        throw new Error('colWidths must be array')
      }

      if (tableConfig.colWidths.length !== this.gridInfo.dimensions.column) {
        throw new Error('colWidths length must match num columns specified')
      }

      this.gridInfo.sizes.column = tableConfig.colWidths.map((candidate) => {
        return this._processCellSizeSpec(candidate, totalWidthAvailable)
      })
    } else {
      this.gridInfo.sizes.column = _.range(this.gridInfo.dimensions.column).map(() => {
        return {
          min: parseInt(totalWidthAvailable / this.gridInfo.dimensions.column),
          max: parseInt(totalWidthAvailable / this.gridInfo.dimensions.column),
          size: parseInt(totalWidthAvailable / this.gridInfo.dimensions.column),
          flexible: false
        }
      })
    }
    this.gridInfo.flexible.column = (_.findIndex(this.gridInfo.sizes.column, {flexible: true}) !== -1)

    if (this.totalAllocatedHorizontalSpace > this.size.specified.width) {
      throw new Error(`Cannot specify columnWidth/columnGutterLength where sum(rows+padding) exceeds table width: ${this.totalAllocatedHorizontalSpace} !< ${this.size.specified.width}`)
    }

    const totalHeightAvailable = this.size.specified.height - ((this.gridInfo.dimensions.row - 1) * this.size.gutter.row)
    if (tableConfig.rowHeights) {
      if (!_.isArray(tableConfig.rowHeights)) {
        throw new Error('rowHeights must be array')
      }

      if (tableConfig.rowHeights.length !== this.gridInfo.dimensions.row) {
        throw new Error('rowHeights length must match num rows specified')
      }

      this.gridInfo.sizes.row = tableConfig.rowHeights.map((candidate) => {
        return this._processCellSizeSpec(candidate, totalHeightAvailable)
      })
    } else {
      this.gridInfo.sizes.row = _.range(this.gridInfo.dimensions.row).map(() => {
        return {
          min: parseInt(totalHeightAvailable / this.gridInfo.dimensions.row),
          max: parseInt(totalHeightAvailable / this.gridInfo.dimensions.row),
          size: parseInt(totalHeightAvailable / this.gridInfo.dimensions.row),
          flexible: false
        }
      })
    }
    this.gridInfo.flexible.row = (_.findIndex(this.gridInfo.sizes.row, {flexible: true}) !== -1)

    if (this.totalAllocatedVerticalSpace > this.size.specified.height) {
      throw new Error(`Cannot specify rowHeights/rowGutterLength where sum(rows+padding) exceeds table height: ${this.totalAllocatedVerticalSpace} !< ${this.size.specified.height}`)
    }

    if (this.gridInfo.flexible.row && this.gridInfo.flexible.column) {
      throw new Error('Cannot currently handle flexible rows and columns: must choose one or fix all dimensions')
    }
  }

  _processLineConfig (userConfigObject) {
    const tableConfig = userConfigObject.table

    if (!tableConfig.lines) { return }
    this.lines.horizontal = (tableConfig.lines.horizontal || []).sort().map((lineValue) => {
      const linePlacement = this._verifyFloat({
        input: lineValue,
        message: `Invalid horizontal line value '${lineValue}: must be float`
      })

      if (linePlacement > this.gridInfo.dimensions.row || linePlacement < 0) {
        throw new Error(`Cannot create horizontal line at '${linePlacement}': out of bounds`)
      }

      return linePlacement
    })
    this.lines.vertical = (tableConfig.lines.vertical || []).sort().map((lineValue) => {
      const linePlacement = this._verifyFloat({
        input: lineValue,
        message: `Invalid vertical line value '${lineValue}: must be float`
      })

      if (linePlacement > this.gridInfo.dimensions.column || linePlacement < 0) {
        throw new Error(`Cannot create vertical line at '${linePlacement}': out of bounds`)
      }

      return linePlacement
    })

    _.keys(this.lines.padding).forEach(paddingAttr => {
      this.lines.padding[paddingAttr] = this._extractInt({
        input: tableConfig.lines,
        key: `padding-${paddingAttr}`,
        defaultValue: 0,
        message: `Invalid line padding-${paddingAttr} '${tableConfig.lines[`padding-${paddingAttr}`]}': must be Integer`
      })
    })

    if (_.has(userConfigObject, 'style')) {
      this.lines.style = userConfigObject.style
    }
  }

  get totalAllocatedHorizontalSpace () {
    return _(this.gridInfo.sizes.column)
        .filter(columnSizeData => columnSizeData.size)
        .map('size')
        .sum() + (this.gridInfo.dimensions.column - 1) * this.size.gutter.column
  }

  get totalAllocatedVerticalSpace () {
    return _(this.gridInfo.sizes.row)
        .filter(rowSizeData => rowSizeData.size)
        .map('size')
        .sum() + (this.gridInfo.dimensions.row - 1) * this.size.gutter.row
  }

  _processCellSizeSpec (input, range) {
    const output = {}
    let match = false

    if (!_.isNaN(parseInt(input))) {
      match = true
      output.min = parseInt(input)
      output.max = parseInt(input)
      output.size = parseInt(input)
      output.flexible = false
    }

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

  createCellInstance (cellDefinition, rowIndex, columnIndex) {
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

    console.log('cellDefinition')
    console.log(JSON.stringify(cellDefinition, {}, 2))

    cellInstance.setCssSelector([
      this.id,
      `table-cell-${rowIndex}-${columnIndex}`
    ])

    cellInstance.setConfig(cellDefinition.value)

    return cellInstance
  }

  setWidth (newValue) {
    if (!this.size.initial.width) { this.size.initial.width = newValue }
    if (!this.size.viewBox.width) { this.size.viewBox.width = newValue }
    this.size.specified.width = newValue
  }

  setHeight (newValue) {
    if (!this.size.initial.height) { this.size.initial.height = newValue }
    if (!this.size.viewBox.height) { this.size.viewBox.height = newValue }
    this.size.specified.height = newValue
  }

  recomputeSizing ({specifiedWidth, specifiedHeight, actualWidth, actualHeight}) {
    const size = this.size
    const ratios = size.ratios

    ratios.containerToViewBox.width = (actualWidth * 1.0) / size.viewBox.width
    ratios.containerToViewBox.height = (actualHeight * 1.0) / size.viewBox.height
    ratios.containerDelta.width = (actualWidth * 1.0) / size.actual.width
    ratios.containerDelta.height = (actualHeight * 1.0) / size.actual.height

    size.actual.width = actualWidth
    size.actual.height = actualHeight
    if (specifiedWidth) { size.specified.width = specifiedWidth }
    if (specifiedHeight) { size.specified.height = specifiedHeight }

    ratios.textSize = 1.0 / Math.min(ratios.containerToViewBox.width, ratios.containerToViewBox.height)
  }

  // TODO break into two, take valid as input param, move to utility
  _throwOnInvalidAttributes (userInput) {
    const invalidRootAttributes = _.difference(_.keys(userInput), PictographConfig.validRootAttributes)
    if (invalidRootAttributes.length > 0) {
      throw new Error(`Invalid root attribute(s): ${JSON.stringify(invalidRootAttributes)}`)
    }

    const invalidTableAttributes = _.difference(_.keys(userInput.table), PictographConfig.validTableAttributes)
    if (invalidTableAttributes.length > 0) {
      throw new Error(`Invalid table attribute(s): ${JSON.stringify(invalidTableAttributes)}`)
    }
  }

  assignTableId () {
    return `rhtmlwidget-${PictographConfig.widgetIndex}`
  }

  _transformGraphicCellConfigToPictographConfig (config) {
    const pictographConfig = _.pick(config, PictographConfig.validRootAttributes)
    const graphicCellConfig = _.pick(config, GraphicCell.validRootAttributes)

    pictographConfig.table = {rows: [[{type: 'graphic', value: graphicCellConfig}]]}

    return pictographConfig
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
      value: {variableImage: stringDefinition}
    }
  }

  // TODO pull from shared location
  _extractInt ({input, key, defaultValue, message = 'Must be integer'}) {
    if (!_.isUndefined(defaultValue)) {
      if (!_.has(input, key)) {
        return defaultValue
      }
    }

    return this._verifyInt({input: input[key], message: `invalid '${key}': ${input[key]}. ${message}.`})
  }

  _verifyInt ({input, message = 'Must be integer'}) {
    const result = parseInt(input)
    if (_.isNaN(result)) {
      throw new Error(message)
    }
    return result
  }

  _verifyFloat ({input, message = 'Must be integer'}) {
    const result = parseFloat(input)
    if (_.isNaN(result)) {
      throw new Error(message)
    }
    return result
  }
}
PictographConfig.initClass()

module.exports = PictographConfig
