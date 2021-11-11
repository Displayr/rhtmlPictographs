const _ = require('lodash')
const BaseCell = require('./BaseCell')
const GraphicCell = require('./GraphicCell')
const LabelCell = require('./LabelCell')
const EmptyCell = require('./EmptyCell')
const ColorFactory = require('./ColorFactory')
const { ensureObjectHasValidFontSize } = require('./utils/fontSizeCleaner')
const InsufficientContainerSizeError = require('./InsufficientContainerSizeError')

class PictographConfig {
  static initClass () {
    this.widgetIndex = -1
  }

  static get validRootAttributes () {
    return [
      'width', // TODO deprecate
      'height', // TODO deprecate
      'background-color',
      'css',
      'font-color',
      'font-family',
      'font-size',
      'font-weight',
      'horizontal-align',
      'preserveAspectRatio',
      'resizable',
      'table',
      'table-id',
      'vertical-align',
      'table-header',
      'table-footer',
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
      'rows',
    ]
  }

  static get cssDefaults () {
    return {
      'font-family': 'Verdana,sans-serif',
      'font-weight': '900',
      'font-size': '24',
      'font-color': 'black',
    }
  }

  get totalAllocatedHorizontalSpace () {
    return _(this.gridInfo.sizes.column)
      .filter(columnSizeData => columnSizeData.size)
      .map('size')
      .sum() + (this.gridInfo.dimensions.column - 1) * this.size.gutter.column
  }

  get totalAllocatedVerticalSpace () {
    return this.tableHeaderHeight + this.gridHeight + this.tableFooterHeight
  }

  get gridHeight () {
    return _(this.gridInfo.sizes.row)
      .filter(rowSizeData => rowSizeData.size)
      .map('size')
      .sum() + (this.gridInfo.dimensions.row - 1) * this.size.gutter.row
  }

  get tableHeaderHeight () {
    if (this.tableHeader) {
      return this.tableHeader.padding.top + this.tableHeader.padding.bottom + this.tableHeader['font-size']
    }

    return 0
  }

  get tableFooterHeight () {
    if (this.tableFooter) {
      return this.tableFooter.padding.top + this.tableFooter.padding.bottom + this.tableFooter['font-size']
    }

    return 0
  }

  constructor () {
    PictographConfig.widgetIndex++

    this.cells = [] // array of arrays

    this.alignment = {
      horizontal: 'center', // left|center|right
      vertical: 'center', // top|center|bottom
    }

    this.size = {
      container: { width: null, height: null }, // what is the actual size (via jquery inspection)
      gutter: { row: 0, column: 0 },
    }

    this.gridInfo = {
      dimensions: { row: null, column: null },
      flexible: { row: false, column: false },
      sizes: { row: [], column: [] },
      // TODO constraints should be cached
      constraints: { row: [], column: [] },
    }

    this.lines = {
      horizontal: [],
      vertical: [],
      style: 'stroke:black;stroke-width:2',
      padding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      },
    }

    this.resizable = null // boolean
    this.cssCollector = null
    this.tableHeader = null
    this.tableFooter = null

    this.id = this.assignTableId()
  }

  processUserConfig (userConfig) {
    let userConfigObject = (_.isString(userConfig)) ? { variableImage: userConfig } : userConfig
    if (userConfigObject.table == null) {
      userConfigObject = this._transformGraphicCellConfigToPictographConfig(userConfigObject)
    }
    if (userConfigObject.table.rows == null) { throw new Error("Must specify 'table.rows'") }

    this._throwOnInvalidAttributes(userConfigObject)
    this._userConfig = userConfigObject

    // TODO validate preserveAspectRatio
    this.preserveAspectRatio = this._userConfig.preserveAspectRatiox

    // TODO validate background-color
    this['background-color'] = this._userConfig['background-color']

    if (this._userConfig.table.colors) { ColorFactory.processNewConfig(this._userConfig.table.colors) }

    this._processResizable()
    this._processPictographPadding()
    this._processCssConfig()
    this._processTableHeader()
    this._processTableFooter()
    this._processGridDimensions()
    this._processCellDefinitions()
    this._processGridWidthSpec() // NB these must be recomputed every time there is a resize
    this._processGridHeightSpec() // NB these must be recomputed every time there is a resize

    // NB TODO temporary limitation (remove this - hard tho ...)
    if (this.gridInfo.flexible.row && this.gridInfo.flexible.column) {
      throw new Error('Cannot currently handle flexible rows and columns: must choose one or fix all dimensions')
    }

    this._processLineConfig(userConfigObject)
  }

  _processTableHeader (userConfigObject = this._userConfig, cssCollector = this.cssCollector) {
    // TODO extract this duplicated code (from graphicCell) in to library
    if (_.has(userConfigObject, 'table-header')) {
      const textConfig = _.isString(userConfigObject['table-header']) ? { text: userConfigObject['table-header'] } : userConfigObject['table-header']

      if (textConfig.text == null) { throw new Error(`Invalid table-header config: must have text field`) }

      if (textConfig['horizontal-align'] == null) { textConfig['horizontal-align'] = 'middle' }

      if (['center', 'centre'].includes(textConfig['horizontal-align'])) { textConfig['horizontal-align'] = 'middle' }
      if (['left'].includes(textConfig['horizontal-align'])) { textConfig['horizontal-align'] = 'start' }
      if (['right'].includes(textConfig['horizontal-align'])) { textConfig['horizontal-align'] = 'end' }
      if (!['start', 'middle', 'end'].includes(textConfig['horizontal-align'])) {
        throw new Error(`Invalid horizontal align ${textConfig['horizontal-align']} : must be one of ['left', 'center', 'right']`)
      }

      if (textConfig.padding) {
        const [paddingTop, paddingRight, paddingBottom, paddingLeft] = textConfig.padding.split(' ')
        delete textConfig.padding

        textConfig.padding = {
          top: this._verifyInt({ input: paddingTop.replace(/(px|em)/, ''), message: 'invalid table-header padding' }),
          right: this._verifyInt({ input: paddingRight.replace(/(px|em)/, ''), message: 'invalid table-header padding' }),
          bottom: this._verifyInt({ input: paddingBottom.replace(/(px|em)/, ''), message: 'invalid table-header padding' }),
          left: this._verifyInt({ input: paddingLeft.replace(/(px|em)/, ''), message: 'invalid table-header padding' }),
        }
      } else {
        textConfig.padding = {
          top: 1,
          right: 0,
          bottom: 1,
          left: 0,
        }
      }

      // NB vertical align is only used by floating labels
      if (textConfig['vertical-align'] == null) { textConfig['vertical-align'] = 'center' }
      if (['middle', 'centre'].includes(textConfig['vertical-align'])) { textConfig['vertical-align'] = 'center' }
      if (!['top', 'center', 'bottom'].includes(textConfig['vertical-align'])) {
        throw new Error(`Invalid vertical align ${textConfig['vertical-align']} : must be one of ['top', 'center', 'bottom']`)
      }

      textConfig['dominant-baseline'] = (() => {
        switch (true) {
          case textConfig['vertical-align'] === 'top':
            return 'text-before-edge'
          case textConfig['vertical-align'] === 'center':
            return 'central'
          case textConfig['vertical-align'] === 'bottom':
            return 'text-after-edge'
          default:
            throw new Error(`Invalid vertical-align: ${textConfig['vertical-align']}`)
        }
      })()

      // font-size must be present to compute dimensions
      ensureObjectHasValidFontSize(textConfig, BaseCell.getDefault('font-size'))
      _(['font-family', 'font-weight', 'font-color']).each((cssAttribute) => {
        if (textConfig[cssAttribute] != null) { cssCollector.setCss('table-header', cssAttribute, textConfig[cssAttribute]) }
      })

      this.tableHeader = textConfig
    } else {
      this.tableHeader = null
    }
  }

  _processTableFooter (userConfigObject = this._userConfig, cssCollector = this.cssCollector) {
    // TODO extract this duplicated code (from graphicCell) in to library
    if (_.has(userConfigObject, 'table-footer')) {
      const textConfig = _.isString(userConfigObject['table-footer']) ? { text: userConfigObject['table-footer'] } : userConfigObject['table-footer']

      if (textConfig.text == null) { throw new Error(`Invalid table-footer config: must have text field`) }

      if (textConfig['horizontal-align'] == null) { textConfig['horizontal-align'] = 'middle' }

      if (['center', 'centre'].includes(textConfig['horizontal-align'])) { textConfig['horizontal-align'] = 'middle' }
      if (['left'].includes(textConfig['horizontal-align'])) { textConfig['horizontal-align'] = 'start' }
      if (['right'].includes(textConfig['horizontal-align'])) { textConfig['horizontal-align'] = 'end' }
      if (!['start', 'middle', 'end'].includes(textConfig['horizontal-align'])) {
        throw new Error(`Invalid horizontal align ${textConfig['horizontal-align']} : must be one of ['left', 'center', 'right']`)
      }

      if (textConfig.padding) {
        const [paddingTop, paddingRight, paddingBottom, paddingLeft] = textConfig.padding.split(' ')
        delete textConfig.padding

        textConfig.padding = {
          top: this._verifyInt({ input: paddingTop.replace(/(px|em)/, ''), message: 'invalid table-footer padding' }),
          right: this._verifyInt({ input: paddingRight.replace(/(px|em)/, ''), message: 'invalid table-footer padding' }),
          bottom: this._verifyInt({ input: paddingBottom.replace(/(px|em)/, ''), message: 'invalid table-footer padding' }),
          left: this._verifyInt({ input: paddingLeft.replace(/(px|em)/, ''), message: 'invalid table-footer padding' }),
        }
      } else {
        textConfig.padding = {
          top: 1,
          right: 0,
          bottom: 1,
          left: 0,
        }
      }

      // NB vertical align is only used by floating labels
      if (textConfig['vertical-align'] == null) { textConfig['vertical-align'] = 'center' }
      if (['middle', 'centre'].includes(textConfig['vertical-align'])) { textConfig['vertical-align'] = 'center' }
      if (!['top', 'center', 'bottom'].includes(textConfig['vertical-align'])) {
        throw new Error(`Invalid vertical align ${textConfig['vertical-align']} : must be one of ['top', 'center', 'bottom']`)
      }

      textConfig['dominant-baseline'] = (() => {
        switch (true) {
          case textConfig['vertical-align'] === 'top':
            return 'text-before-edge'
          case textConfig['vertical-align'] === 'center':
            return 'central'
          case textConfig['vertical-align'] === 'bottom':
            return 'text-after-edge'
          default:
            throw new Error(`Invalid vertical-align: ${textConfig['vertical-align']}`)
        }
      })()

      // font-size must be present to compute dimensions
      ensureObjectHasValidFontSize(textConfig, BaseCell.getDefault('font-size'))
      _(['font-family', 'font-weight', 'font-color']).each((cssAttribute) => {
        if (textConfig[cssAttribute] != null) { cssCollector.setCss('table-footer', cssAttribute, textConfig[cssAttribute]) }
      })

      this.tableFooter = textConfig
    } else {
      this.tableFooter = null
    }
  }

  _processResizable (userConfigObject = this._userConfig) {
    // TODO something better here
    if (userConfigObject.resizable === 'true') { this.resizable = true }
    if (userConfigObject.resizable === true) { this.resizable = true }
    if (userConfigObject.resizable === 'false') { this.resizable = false }
    if (userConfigObject.resizable === false) { this.resizable = false }
    if (userConfigObject.resizable == null) { this.resizable = true }
    if (!_.isBoolean(this.resizable)) { throw new Error('resizable must be [true|false]') }
  }

  _processPictographPadding (userConfigObject = this._userConfig) {
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

  _processCssConfig (userConfigObject = this._userConfig) {
    // @TODO extract CssCollector from BaseCell. This is hacky
    this.cssCollector = new BaseCell()
    this.cssCollector.setCssSelector(this.id)
    this.cssCollector._draw = () => _.noop

    _.forEach(PictographConfig.cssDefaults, (defaultValue, cssAttribute) => {
      const cssValue = userConfigObject[cssAttribute] ? userConfigObject[cssAttribute] : defaultValue

      // NB font-size must be explicitly provided to child cells (via BaseCell defaults),
      // because it is required for calculating height offsets.
      // All other css values we can leave them implicitly set via CSS inheritance
      // also font-size must be a string (containing a number), so cast it to string and remove any px/em/rem

      if (cssAttribute === 'font-size') {
        return BaseCell.setDefault(cssAttribute, `${cssValue}`.replace(/^(\d+).*$/, '$1'))
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

  _processGridDimensions (userConfigObject = this._userConfig) {
    this.gridInfo.dimensions.row = userConfigObject.table.rows.length
    this.gridInfo.dimensions.column = Math.max.apply(null, userConfigObject.table.rows.map(row => row.length))
  }

  _processCellDefinitions (userConfigObject = this._userConfig) {
    this.cells = userConfigObject.table.rows.map((row, rowIndex) => {
      if (!_.isArray(row)) {
        throw new Error(`Invalid rows spec: row ${rowIndex} must be array of cell definitions`)
      }

      if (this.gridInfo.dimensions.column !== row.length) {
        _.range(this.gridInfo.dimensions.column - row.length).forEach(() => { row.push({ type: 'empty' }) })
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
          column: columnIndex,
        }
      })
    })
  }

  _processGridWidthSpec (userConfigObject = this._userConfig) {
    const tableConfig = userConfigObject.table

    this.size.gutter.column = this._extractInt({ input: tableConfig, key: 'columnGutterLength', defaultValue: 0 })
    const totalWidthAvailable = this.size.container.width - ((this.gridInfo.dimensions.column - 1) * this.size.gutter.column)
    if (tableConfig.colWidths) {
      if (!_.isArray(tableConfig.colWidths)) {
        throw new Error('colWidths must be array')
      }

      if (tableConfig.colWidths.length !== this.gridInfo.dimensions.column) {
        throw new Error('colWidths length must match num columns specified')
      }

      this.gridInfo.sizes.column = tableConfig.colWidths.map((candidate) => {
        return this._processGridSizeSpec(candidate, totalWidthAvailable)
      })
    } else {
      this.gridInfo.sizes.column = _.range(this.gridInfo.dimensions.column).map(() => {
        return {
          min: parseInt(totalWidthAvailable / this.gridInfo.dimensions.column),
          max: parseInt(totalWidthAvailable / this.gridInfo.dimensions.column),
          size: parseInt(totalWidthAvailable / this.gridInfo.dimensions.column),
          flexible: false,
          dynamicMargins: {
            width: {
              positive: 0,
              negative: 0,
            },
            height: {
              positive: 0,
              negative: 0,
            },
          },
        }
      })
    }
    this.gridInfo.flexible.column = (_.findIndex(this.gridInfo.sizes.column, { flexible: true }) !== -1)

    // NB we use Math.floor here to avoid throwing error on small rounding diffs.
    if (Math.ceil(this.totalAllocatedHorizontalSpace) > Math.ceil(this.size.container.width)) {
      throw new InsufficientContainerSizeError(`Cannot specify columnWidth/columnGutterLength where sum(columns+padding) exceeds table width: ${Math.ceil(this.totalAllocatedHorizontalSpace)} > ${Math.ceil(this.size.container.width)}`)
    }
  }

  _processGridHeightSpec (userConfigObject = this._userConfig) {
    const tableConfig = userConfigObject.table

    this.size.gutter.row = this._extractInt({ input: tableConfig, key: 'rowGutterLength', defaultValue: 0 })
    const totalHeightAvailable = this.size.container.height -
      ((this.gridInfo.dimensions.row - 1) * this.size.gutter.row) -
      this.tableHeaderHeight -
      this.tableFooterHeight

    if (tableConfig.rowHeights) {
      if (!_.isArray(tableConfig.rowHeights)) {
        throw new Error('rowHeights must be array')
      }

      if (tableConfig.rowHeights.length !== this.gridInfo.dimensions.row) {
        throw new Error(`rowHeights length (${tableConfig.rowHeights.length}) must match num rows specified (${this.gridInfo.dimensions.row})`)
      }

      this.gridInfo.sizes.row = tableConfig.rowHeights.map((candidate) => {
        return this._processGridSizeSpec(candidate, totalHeightAvailable)
      })
    } else {
      this.gridInfo.sizes.row = _.range(this.gridInfo.dimensions.row).map(() => {
        return {
          min: parseInt(totalHeightAvailable / this.gridInfo.dimensions.row),
          max: parseInt(totalHeightAvailable / this.gridInfo.dimensions.row),
          size: parseInt(totalHeightAvailable / this.gridInfo.dimensions.row),
          flexible: false,
          dynamicMargins: {
            width: {
              positive: 0,
              negative: 0,
            },
            height: {
              positive: 0,
              negative: 0,
            },
          },
        }
      })
    }
    this.gridInfo.flexible.row = (_.findIndex(this.gridInfo.sizes.row, { flexible: true }) !== -1)

    // NB we use Math.floor here to avoid throwing error on rounding diff. e.g., exceeds table height: 372.99996000000004 !< 372.99996
    if (Math.floor(this.totalAllocatedVerticalSpace) > Math.floor(this.size.container.height)) {
      throw new InsufficientContainerSizeError(`Cannot specify rowHeights/rowGutterLength where sum(rows+padding) exceeds table height: ${this.totalAllocatedVerticalSpace} !< ${this.size.container.height}`)
    }
  }

  _processLineConfig (userConfigObject = this._userConfig) {
    const tableConfig = userConfigObject.table

    if (!tableConfig.lines) { return }
    this.lines.horizontal = (tableConfig.lines.horizontal || []).sort().map((lineValue) => {
      const linePlacement = this._verifyFloat({
        input: lineValue,
        message: `Invalid horizontal line value '${lineValue}: must be float`,
      })

      if (linePlacement > this.gridInfo.dimensions.row || linePlacement < 0) {
        throw new Error(`Cannot create horizontal line at '${linePlacement}': out of bounds`)
      }

      return linePlacement
    })
    this.lines.vertical = (tableConfig.lines.vertical || []).sort().map((lineValue) => {
      const linePlacement = this._verifyFloat({
        input: lineValue,
        message: `Invalid vertical line value '${lineValue}: must be float`,
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
        message: `Invalid line padding-${paddingAttr} '${tableConfig.lines[`padding-${paddingAttr}`]}': must be Integer`,
      })
    })

    if (_.has(userConfigObject, 'style')) {
      this.lines.style = userConfigObject.style
    }
  }

  _processGridSizeSpec (input, range) {
    const output = {
      dynamicMargins: {
        width: {
          positive: 0,
          negative: 0,
        },
        height: {
          positive: 0,
          negative: 0,
        },
      },
    }

    let match = false

    if (!_.isNaN(parseInt(input))) {
      match = true
      const size = parseInt(input)
      output.min = size
      output.max = size
      output.size = size
      output.flexible = false
    }

    if (`${input}`.match(/^proportion:.+$/)) {
      match = true
      let [, proportion] = input.match(/^proportion:(.+)$/)

      if (proportion.startsWith('=')) {
        // TODO - do this safely as this does come from user
        proportion = eval(proportion.substring(1)) // eslint-disable-line no-eval
      }

      const size = range * parseFloat(proportion)
      output.min = 0
      output.max = size
      output.size = size
      output.flexible = false
      output.type = 'proportion'
      output.preference = 'min'
    }

    if (input === 'flexible:graphic') {
      match = true
      output.min = null
      output.max = null
      output.size = null
      output.flexible = true
      output.type = 'graphic' // TODO is this used?
    }

    if (input === 'flexible:label') {
      match = true
      output.min = null
      output.max = null
      output.size = null
      output.flexible = true
      output.type = 'label' // TODO is this used?
    }

    if (input === 'fixedsize:graphic') {
      // the graphic cell will compute the fixed size and the
      // output.[min|max|size] will be filled in in Pictograph._computeCellSizes
      match = true
      output.min = null
      output.max = null
      output.size = null
      output.flexible = false
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

    cellInstance.setCssSelector([
      this.id,
      `table-cell-${rowIndex}-${columnIndex}`,
    ])

    cellInstance.setConfig(cellDefinition.value)

    return cellInstance
  }

  setDimensions (dimensions) {
    this.recomputeSizing({ actualWidth: dimensions.width, actualHeight: dimensions.height })
  }

  setWidth (newValue) {
    this.recomputeSizing({ actualWidth: newValue })
  }

  setHeight (newValue) {
    this.recomputeSizing({ actualHeight: newValue })
  }

  recomputeSizing ({ actualWidth, actualHeight }) {
    const size = this.size
    if (actualWidth) { size.container.width = parseFloat(actualWidth) }
    if (actualHeight) { size.container.height = parseFloat(actualHeight) }
  }

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

    pictographConfig.table = { rows: [[{ type: 'graphic', value: graphicCellConfig }]] }

    return pictographConfig
  }

  _convertStringDefinitionToCellDefinition (stringDefinition) {
    if (stringDefinition.startsWith('label:')) {
      return {
        type: 'label',
        value: stringDefinition.replace(/^label:/, ''),
      }
    }

    return {
      type: 'graphic',
      value: { variableImage: stringDefinition },
    }
  }

  _extractInt ({ input, key, defaultValue, message = 'Must be integer' }) {
    if (!_.isUndefined(defaultValue)) {
      if (!_.has(input, key)) {
        return defaultValue
      }
    }

    return this._verifyInt({ input: input[key], message: `invalid '${key}': ${input[key]}. ${message}.` })
  }

  _verifyKeyIsInt (input, key, defaultValue, message = 'Must be integer') {
    if (!_.isUndefined(defaultValue)) {
      if (!_.has(input, key)) {
        input[key] = defaultValue
        return
      }
    }

    if (_.isNaN(parseInt(input[key]))) {
      throw new Error(`invalid '${key}': ${input[key]}. ${message}.`)
    }

    input[key] = _.verifyInt({
      input: input[key],
      message: `invalid '${key}': ${input[key]}. ${message}.`,
    })
  }

  _verifyInt ({ input, message = 'Must be integer' }) {
    const result = parseInt(input)
    if (_.isNaN(result)) {
      throw new Error(message)
    }
    return result
  }

  _verifyFloat ({ input, message = 'Must be integer' }) {
    const result = parseFloat(input)
    if (_.isNaN(result)) {
      throw new Error(message)
    }
    return result
  }
}
PictographConfig.initClass()

module.exports = PictographConfig
