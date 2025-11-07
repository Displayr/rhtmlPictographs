const _ = require('lodash')
const $ = require('jquery')
const InsufficientContainerSizeError = require('./InsufficientContainerSizeError')

// TODO refactor this global leak problem
// TODO I want to pull all the CssCollector bits into a seperate module and have BaseCell Extend that class

class BaseCell {
  static initClass () {
    this.defaults = {}
  }

  static setDefault (k, v) {
    this.defaults[k] = v
  }

  static getDefault (k) {
    return this.defaults[k]
  }

  static resetDefaults () {
    this.defaults = {}
  }

  constructor () {
    this.myCssSelectorArray = []
    this.cssBucket = {}
    this.dynamicMargins = {
      width: {
        positive: 0,
        negative: 0,
      },
      height: {
        positive: 0,
        negative: 0,
      },
    }
    this.width = 1
    this.height = 1
    this.dimensionContraintPromise = null
  }

  setImageFactory (imageFactory) {
    this.imageFactory = imageFactory
  }

  setParentSvg (parentSvg) {
    this.parentSvg = parentSvg
  }

  setCssSelector (myCssSelector) {
    if (_.isString(myCssSelector)) {
      this.myCssSelectorArray = [myCssSelector]
    } else if (_.isArray(myCssSelector)) {
      this.myCssSelectorArray = myCssSelector
    } else {
      throw new Error(`Invalid myCssSelector: ${myCssSelector}`)
    }
  }

  setWidth (width) {
    const integerWidth = parseInt(width)
    if (integerWidth < 1) {
      throw new InsufficientContainerSizeError('Insufficient output width')
    }
    this.width = integerWidth
  }

  setHeight (height) {
    const integerHeight = parseInt(height)
    if (integerHeight < 1) {
      throw new InsufficientContainerSizeError('Insufficient output height')
    }
    this.height = integerHeight
  }

  setDynamicMargins (dynamicMargins) {
    this.dynamicMargins = _.defaultsDeep({}, dynamicMargins, {
      width: {
        positive: 0,
        negative: 0,
      },
      height: {
        positive: 0,
        negative: 0,
      },
    })

    this._verifyKeyIsInt(this.dynamicMargins.width, 'negative')
    this._verifyKeyIsInt(this.dynamicMargins.width, 'positive')
    this._verifyKeyIsInt(this.dynamicMargins.height, 'negative')
    this._verifyKeyIsInt(this.dynamicMargins.height, 'positive')
  }

  setConfig (config) {
    this.config = config
  }

  getDimensionConstraints () {
    if (_.isNull(this.dimensionContraintPromise)) {
      this.dimensionContraintPromise = this._computeDimensionConstraints()
    }
    return this.dimensionContraintPromise
  }

  _computeDimensionConstraints () {
    return Promise.resolve({
      aspectRatio: null,
      width: {
        min: null,
        max: null,
        margins: {
          // NB arrays of { size, overlapInUnitsOfGraphicSize }
          negative: [],
          positive: [],
        },
      },
      height: {
        min: null,
        max: null,
        margins: {
          // NB arrays of { size, overlapInUnitsOfGraphicSize }
          negative: [],
          positive: [],
        },
      },
    })
  }

  draw () {
    this._draw()
    this._generateDynamicCss()
  }

  setCss (cssLocation, cssAttr, cssValue) {
    // NB we are only supporting class and id based selector parts for now
    // and we cast strings to class selectors by default
    const ensurePartsAreSupportedCss = function (cssSelectorParts) {
      return cssSelectorParts.map(function (part) {
        if (_.startsWith(part, '.')) { return part }
        if (_.startsWith(part, '#')) { return part }
        return `.${part}`
      })
    }

    let cssLocationKeyArray = null
    if (cssLocation === '') {
      cssLocationKeyArray = this.myCssSelectorArray
    } else if (_.isString(cssLocation)) {
      cssLocationKeyArray = this.myCssSelectorArray.concat(cssLocation)
    } else if (_.isArray(cssLocation)) {
      cssLocationKeyArray = this.myCssSelectorArray.concat(cssLocation)
    } else {
      throw new Error(`Invalid cssLocation: ${JSON.stringify(cssLocation)}`)
    }

    const validCssLocationKeyArray = ensurePartsAreSupportedCss(cssLocationKeyArray)

    const transformedInstructions = this._transformCssInstructions(validCssLocationKeyArray, cssAttr, cssValue)
    _.forEach(transformedInstructions, (instruction) => {
      const cssSelector = instruction.location.join(' ')
      if (!_.has(this.cssBucket, cssSelector)) { this.cssBucket[cssSelector] = {} }
      this.cssBucket[cssSelector][instruction.attribute] = instruction.value
    })
  }

  _transformCssInstructions (locationArray, inAttr, inValue) {
    const instructions = []

    if (inAttr === 'font-color') {
      const thisLocation = _.clone(locationArray)
      thisLocation[thisLocation.length - 1] = `text${thisLocation[thisLocation.length - 1]}`
      const setFillOnThisElement = { attribute: 'fill', value: inValue, location: thisLocation }

      const setFillOnAllChildElements = { attribute: 'fill', value: inValue, location: locationArray.concat('text') }

      instructions.push(setFillOnThisElement)
      instructions.push(setFillOnAllChildElements)
    } else {
      instructions.push({ location: locationArray, attribute: inAttr, value: inValue })
    }

    return instructions
  }

  _draw () {
    throw new Error('BaseCell._draw must be overridden by child')
  }

  _generateDynamicCss () {
    if (_.keys(this.cssBucket).length > 0) {
      const cssBlocks = _.map(this.cssBucket, function (cssDefinition, cssSelector) {
        const cssDefinitionString = _.map(cssDefinition, (cssValue, cssAttr) => `${cssAttr}: ${cssValue};`).join('\n')
        return `${cssSelector} { ${cssDefinitionString} }`
      })

      const style = $('<style>')
        .attr('type', 'text/css')
        .html(cssBlocks.join('\n'))

      $('head').append(style)
    }
  }

  _verifyKeyIsFloat (input, key, defaultValue, message) {
    if (message == null) { message = 'Must be float' }
    if (!_.isUndefined(defaultValue)) {
      if (!_.has(input, key)) {
        input[key] = defaultValue
        return
      }
    }

    if (_.isNaN(parseFloat(input[key]))) {
      throw new Error(`invalid '${key}': ${input[key]}. ${message}.`)
    }

    input[key] = parseFloat(input[key])
  }

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

  _verifyKeyIsPositiveInt (input, key, defaultValue, message) {
    if (message == null) { message = 'Must be positive integer' }
    this._verifyKeyIsInt.apply(this, arguments)

    if (input[key] < 1) {
      throw new Error(`invalid '${key}': ${input[key]}. ${message}.`)
    }
  }

  _verifyKeyIsRatio (input, key) {
    if (input[key] < 0) { throw new Error(`${key} must be >= 0`) }
    if (input[key] > 1) { throw new Error(`${key} must be <= 1`) }
  }

  _verifyKeyIsBoolean (input, key, defaultValue, message) {
    if (message == null) { message = 'Must be boolean' }
    if (!_.isUndefined(defaultValue)) {
      if (!_.has(input, key)) {
        input[key] = defaultValue
        return
      }
    }

    if (input[key] === 'true') { input[key] = true }
    if (input[key] === 'false') { input[key] = false }

    if (!_.isBoolean(input[key])) {
      throw new Error(`invalid '${key}': ${input[key]}. ${message}.`)
    }
  }
}
BaseCell.initClass()

module.exports = BaseCell
