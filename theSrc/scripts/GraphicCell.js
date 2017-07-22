import _ from 'lodash'
import d3 from 'd3'

import GraphicCellGrid from './GraphicCellGrid'
import BaseCell from './BaseCell'
import ImageFactory from './ImageFactory'
import DisplayError from './DisplayError'

class GraphicCell extends BaseCell {
  static get validRootAttributes () {
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
      'floatingLabels'
    ]
  }

  setConfig (config) {
    this.config = _.cloneDeep(config)

    const invalidRootAttributes = _.difference(_.keys(this.config), GraphicCell.validRootAttributes)
    if (invalidRootAttributes.length > 0) {
      throw new Error(`Invalid attribute(s): ${JSON.stringify(invalidRootAttributes)}`)
    }

    if (this.config.variableImage == null) { throw new Error("Must specify 'variableImage'") }

    if (_.isString(this.config.proportion) && this.config.proportion.startsWith('=')) {
      // TODO - do this safely as this does come from user
      this.config.proportion = eval(this.config.proportion.substring(1)) // eslint-disable-line no-eval
    }

    this._verifyKeyIsFloat(this.config, 'proportion', 1, 'Must be number between 0 and 1')
    this._verifyKeyIsRatio(this.config, 'proportion')

    this._throwErrorIfProportionSetAndNoScalingStrategyProvided()

    this._verifyKeyIsPositiveInt(this.config, 'numImages', 1)
    if (this.config.numRows != null) { this._verifyKeyIsPositiveInt(this.config, 'numRows', 1) }
    if (this.config.numCols != null) { this._verifyKeyIsPositiveInt(this.config, 'numCols', 1) }
    if ((this.config.numRows != null) && (this.config.numCols != null)) {
      throw new Error('Cannot specify both numRows and numCols. Choose one, and use numImages to control exact dimensions.')
    }

    this._verifyKeyIsFloat(this.config, 'columnGutter', 0.05, 'Must be number between 0 and 1')
    this._verifyKeyIsRatio(this.config, 'columnGutter')
    this._verifyKeyIsFloat(this.config, 'rowGutter', 0.05, 'Must be number between 0 and 1')
    this._verifyKeyIsRatio(this.config, 'rowGutter')

    if (this.config['text-header']) { this.config['text-header'] = this._processTextConfig(this.config['text-header'], 'text-header') }
    if (this.config['text-overlay']) { this.config['text-overlay'] = this._processTextConfig(this.config['text-overlay'], 'text-overlay') }
    if (this.config['text-footer']) { this.config['text-footer'] = this._processTextConfig(this.config['text-footer'], 'text-footer') }

    if (this.config.floatingLabels) {
      const floatingLabelsInput = this.config.floatingLabels
      this.config.floatingLabels = []
      _(floatingLabelsInput).each((labelConfig) => {
        if (!labelConfig.text) {
          throw new Error('Invalid floating label, missing text')
        }

        if (!labelConfig.position) {
          throw new Error('Invalid floating label, missing position')
        }

        const extractGapAndPosition = (input) => {
          if (input[0] === 'g') {
            return { gutter: true, position: parseFloat(input.substr(1)) }
          } else {
            return { gutter: false, position: parseFloat(input) }
          }
        }

        const [row, col] = labelConfig.position.split(':').map(extractGapAndPosition)

        if (_.isNaN(row.position) || _.isNaN(col.position)) {
          throw new Error(`Invalid floating label position '${labelConfig.position}', must be [g]FLOAT:[g]FLOAT`)
        }

        const className = `floating-label-${labelConfig.position}`.replace(/[.:]/g, '-')
        const newFloatingLabelConfig = this._processTextConfig(_.omit(labelConfig, 'position'), className)
        newFloatingLabelConfig.className = className
        newFloatingLabelConfig.position = {
          row: row,
          col: col
        }
        this.config.floatingLabels.push(newFloatingLabelConfig)
      })
    } else {
      this.config.floatingLabels = []
    }

    if (this.config.padding) {
      const [paddingTop, paddingRight, paddingBottom, paddingLeft] = this.config.padding.split(' ')

      this.config.padding = {
        top: parseInt(paddingTop.replace(/(px|em)/, '')),
        right: parseInt(paddingRight.replace(/(px|em)/, '')),
        bottom: parseInt(paddingBottom.replace(/(px|em)/, '')),
        left: parseInt(paddingLeft.replace(/(px|em)/, ''))
      }
      _.forEach(this.config.padding, (value, paddingKey) => {
        if (_.isNaN(this.config.padding[paddingKey])) {
          throw new Error(`Invalid padding ${this.config.padding}: ${paddingKey} must be Integer`)
        }
      })
    } else {
      this.config.padding = { top: 0, right: 0, bottom: 0, left: 0 }
    }

    if (this.config.layout) {
      const validLayoutValues = GraphicCellGrid.validInputDirections()
      if (!validLayoutValues.includes(this.config.layout)) {
        throw new Error(`Invalid layout ${this.config.layout}. Valid values: [${validLayoutValues.join('|')}]`)
      }
    }
  }

  getDimensionConstraints () {
    const gridLayout = new GraphicCellGrid()
      .rowGutter(this.config.rowGutter)
      .columnGutter(this.config.columnGutter)

    if (this.config.numRows != null) { gridLayout.rows(this.config.numRows) }
    if (this.config.numCols != null) { gridLayout.cols(this.config.numCols) }

    if (_.isString(this.config.variableImage)) {
      if (this.config.variableImage.match(/fromleft/)) {
        gridLayout.direction('right,down')
      }
      if (this.config.variableImage.match(/fromright/)) {
        gridLayout.direction('left,down')
      }
      if (this.config.variableImage.match(/fromtop/)) {
        gridLayout.direction('right,down')
      }
      if (this.config.variableImage.match(/frombottom/)) {
        gridLayout.direction('right,up')
      }
    }
    if (this.config.layout) {
      gridLayout.direction(this.config.layout)
    }

    const d3Data = this._generateDataArray(this.config.proportion, this.config.numImages)
    gridLayout.nodes = d3Data

    gridLayout._calcGridDimensions()
    const numRows = gridLayout.numRows
    const numCols = gridLayout.numCols

    return ImageFactory.calculateAspectRatio(this.config.variableImage).then((imageAspectRatio) => {
      const cellHeightInImageUnits = (1.0 / parseFloat(imageAspectRatio)) * numRows + (numRows - 1) * (1.0 / parseFloat(imageAspectRatio)) * gridLayout.rowGutter()
      const cellWidthInImageUnits = parseFloat(imageAspectRatio) * numCols + (numCols - 1) * parseFloat(imageAspectRatio) * gridLayout.columnGutter()

      return {
        aspectRatio: parseFloat(cellWidthInImageUnits / cellHeightInImageUnits),
        width: {min: null, max: null},
        height: {min: null, max: null}
      }
    })
  }

  _computeEnteringLeafNodeData () {
    const gridLayout = new GraphicCellGrid()
      .containerWidth(this.dimensions.graphicWidth)
      .containerHeight(this.dimensions.graphicHeight)
      .rowGutter(this.config.rowGutter)
      .columnGutter(this.config.columnGutter)

    if (this.config.numRows != null) { gridLayout.rows(this.config.numRows) }
    if (this.config.numCols != null) { gridLayout.cols(this.config.numCols) }

    if (_.isString(this.config.variableImage)) {
      if (this.config.variableImage.match(/fromleft/)) {
        gridLayout.direction('right,down')
      }
      if (this.config.variableImage.match(/fromright/)) {
        gridLayout.direction('left,down')
      }
      if (this.config.variableImage.match(/fromtop/)) {
        gridLayout.direction('right,down')
      }
      if (this.config.variableImage.match(/frombottom/)) {
        gridLayout.direction('right,up')
      }
    }
    if (this.config.layout) {
      gridLayout.direction(this.config.layout)
    }

    return gridLayout
  }

  _throwErrorIfProportionSetAndNoScalingStrategyProvided () {
    if (this.config.proportion >= 1) { return }
    let matchingScalingStrategies = null
    if (_.isString(this.config.variableImage)) {
      matchingScalingStrategies = _.find(ImageFactory.validScalingStrategyStrings, (validStrategyString) => {
        return this.config.variableImage.indexOf(validStrategyString) !== -1
      })
    } else {
      matchingScalingStrategies = _.find(ImageFactory.validScalingStrategyKeys, (validStrategyKey) => {
        return _.has(this.config.variableImage, validStrategyKey)
      })
    }

    if (_.isUndefined(matchingScalingStrategies)) {
      throw new Error('Cannot have proportion < 1 without providing a scaling strategy to the variableImage')
    }
  }

  _processTextConfig (input, cssName) {
    const textConfig = _.isString(input) ? { text: input } : input

    if (textConfig.text == null) { throw new Error(`Invalid ${cssName} config: must have text field`) }

    if ((textConfig != null) && textConfig.text.match(/^percentage$/)) {
      textConfig.text = `${(100 * this.config.proportion).toFixed(1).replace(/\.0$/, '')}%`
    }

    if ((textConfig != null) && textConfig.text.match(/^proportion$/)) {
      textConfig.text = `${(this.config.proportion).toFixed(3).replace(/0+$/, '')}`
    }

    if (textConfig['horizontal-align'] == null) { textConfig['horizontal-align'] = 'middle' }

    if (['center', 'centre'].includes(textConfig['horizontal-align'])) { textConfig['horizontal-align'] = 'middle' }
    if (['left'].includes(textConfig['horizontal-align'])) { textConfig['horizontal-align'] = 'start' }
    if (['right'].includes(textConfig['horizontal-align'])) { textConfig['horizontal-align'] = 'end' }
    if (!['start', 'middle', 'end'].includes(textConfig['horizontal-align'])) {
      throw new Error(`Invalid horizontal align ${textConfig['horizontal-align']} : must be one of ['left', 'center', 'right']`)
    }

    if (textConfig.padding) {
      [textConfig['padding-top'], textConfig['padding-right'], textConfig['padding-bottom'], textConfig['padding-left']] = textConfig.padding.split(' ')
      delete textConfig.padding
    }

    this._verifyKeyIsPositiveInt(textConfig, 'padding-left', 1)
    this._verifyKeyIsPositiveInt(textConfig, 'padding-right', 1)
    this._verifyKeyIsPositiveInt(textConfig, 'padding-top', 1)
    this._verifyKeyIsPositiveInt(textConfig, 'padding-bottom', 1)

    // NB vertical align is only used by floating labels
    if (textConfig['vertical-align'] == null) { textConfig['vertical-align'] = 'center' }
    if (['middle', 'centre'].includes(textConfig['vertical-align'])) { textConfig['vertical-align'] = 'center' }
    if (!['top', 'center', 'bottom'].includes(textConfig['vertical-align'])) {
      throw new Error(`Invalid vertical align ${textConfig['vertical-align']} : must be one of ['top', 'center', 'bottom']`)
    }

    textConfig['dominant-baseline'] = (() => {
      switch (true) {
        case textConfig['vertical-align'] === 'top': return 'text-before-edge'
        case textConfig['vertical-align'] === 'center': return 'central'
        case textConfig['vertical-align'] === 'bottom': return 'text-after-edge'
        default: throw new Error(`Invalid vertical-align: ${textConfig['vertical-align']}`)
      }
    })()

    // font-size must be present to compute dimensions
    if (textConfig['font-size'] == null) { textConfig['font-size'] = BaseCell.getDefault('font-size') }
    ['font-family', 'font-weight', 'font-color'].forEach((cssAttribute) => {
      if (textConfig[cssAttribute] != null) { this.setCss(cssName, cssAttribute, textConfig[cssAttribute]) }
    })

    return textConfig
  }

  _draw () {
    this._computeDimensions()
    const gridLayout = this._computeEnteringLeafNodeData()
    const d3Data = this._generateDataArray(this.config.proportion, this.config.numImages)
    const enteringLeafNodeData = gridLayout.compute(d3Data)

    // NB the order of append operations matters as SVG is a last on top rendering model

    this.parentSvg.append('svg:rect')
      .attr('width', this.width)
      .attr('height', this.height)
      .attr('class', 'background-rect')
      .attr('fill', this.config['background-color'] || 'none')

    if (this.config['text-header'] != null) {
      this._addTextTo(this.parentSvg, {
        myClass: 'text-header',
        textConfig: this.config['text-header'],
        containerWidth: this.dimensions.headerWidth,
        containerHeight: this.dimensions.headerHeight,
        yOffSet: this.dimensions.headerYOffset
      })
    }

    const graphicContainer = this.parentSvg.append('g')
      .attr('class', 'graphic-container')
      .attr('transform', `translate(${this.dimensions.graphicXOffset},${this.dimensions.graphicYOffset})`)

    if (this.config['text-footer'] != null) {
      this._addTextTo(this.parentSvg, {
        myClass: 'text-footer',
        textConfig: this.config['text-footer'],
        containerWidth: this.dimensions.footerWidth,
        containerHeight: this.dimensions.footerHeight,
        yOffSet: this.dimensions.footerYOffset
      })
    }

    const enteringLeafNodes = graphicContainer.selectAll('.node')
      .data(enteringLeafNodeData)
      .enter()
      .append('g')
        .attr('class', function (d) {
          const cssLocation = `node-index-${d.i} node-xy-${d.rowOrder}-${d.colOrder}`
          return `node ${cssLocation}`
        })
        .attr('transform', d => `translate(${d.x},${d.y})`)

    const imageWidth = gridLayout.nodeWidth()
    const imageHeight = gridLayout.nodeHeight()

    const backgroundRect = enteringLeafNodes.append('svg:rect')
      .attr('width', imageWidth)
      .attr('height', imageHeight)
      .attr('class', 'single-image-background-rect')
      .attr('fill', this.config['image-background-color'] || 'none')

    if (this.config.debugBorder != null) {
      backgroundRect
        .attr('stroke', 'black')
        .attr('stroke-width', '1')
    }

    // NB To adhere to SVG "last drawn goes on top policy", we coordinate image rendering with promises
    // baseImage first, then variableImage, then text and labels on top
    const { parentSvg } = this
    const imageErrorHandler = function (error) {
      const de = new DisplayError(parentSvg, error.message)
      de.drawSvg()
      throw error // NB This is thrown because displayr wants the error too
    }

    let baseImageCompletePromise = Promise.resolve()
    if (this.config.baseImage != null) {
      const baseImageConfig = this.config.baseImage
      const baseImageRenderPromises = []
      enteringLeafNodes.each(function (dataAttributes) {
        const d3Node = d3.select(this)
        baseImageRenderPromises.push(
          ImageFactory.addBaseImageTo(d3Node, baseImageConfig, imageWidth, imageHeight, dataAttributes)
        )
      })
      baseImageCompletePromise = Promise.all(baseImageRenderPromises).catch(imageErrorHandler)
    }

    let variableImageCompletePromise = Promise.resolve()
    if (this.config.variableImage != null) {
      const variableImageConfig = this.config.variableImage
      variableImageCompletePromise = baseImageCompletePromise.then(function () {
        const variableImageRenderPromises = []
        enteringLeafNodes.each(function (dataAttributes) {
          const d3Node = d3.select(this)
          variableImageRenderPromises.push(
            ImageFactory.addVarImageTo(d3Node, variableImageConfig, imageWidth, imageHeight, dataAttributes)
          )
        })
        return Promise.all(variableImageRenderPromises).catch(imageErrorHandler)
      })
    }

    return variableImageCompletePromise.then(() => {
      if (this.config.tooltip) {
        enteringLeafNodes.append('svg:title')
          .text(this.config.tooltip)
      }

      if (this.config['text-overlay'] != null) {
        this._addTextTo(enteringLeafNodes, {
          myClass: 'text-overlay',
          textConfig: this.config['text-overlay'],
          containerWidth: gridLayout.nodeWidth(),
          containerHeight: imageHeight
        })
      }

      _(this.config.floatingLabels).each((floatingLabelConfig) => {
        const x = (floatingLabelConfig.position.col.gutter)
          ? gridLayout.getGutterX(floatingLabelConfig.position.col.position)
          : gridLayout.getX(floatingLabelConfig.position.col.position)

        const y = (floatingLabelConfig.position.row.gutter)
          ? gridLayout.getGutterY(floatingLabelConfig.position.row.position)
          : gridLayout.getY(floatingLabelConfig.position.row.position)

        this._addFloatingLabel(graphicContainer, {
          myClass: floatingLabelConfig.className,
          textConfig: floatingLabelConfig,
          xOffSet: x,
          yOffSet: y
        })
      })
    })
  }

  _computeDimensions () {
    this.dimensions = {}
    const dim = this.dimensions
    const padding = this.config.padding

    // need these first to calc graphicHeight
    dim.headerHeight = 0 + ((this.config['text-header'] != null) ? this.getAdjustedTextSize(this.config['text-header']['font-size']) : 0)
    dim.footerHeight = 0 + ((this.config['text-footer'] != null) ? this.getAdjustedTextSize(this.config['text-footer']['font-size']) : 0)

    dim.headerWidth = this.width - padding.left - padding.right
    dim.headerXOffset = 0 + padding.left
    dim.headerYOffset = 0 + padding.top

    dim.graphicWidth = this.width - padding.left - padding.right
    dim.graphicHeight = this.height - dim.headerHeight - dim.footerHeight - padding.top - padding.bottom
    dim.graphicXOffset = 0 + padding.left
    dim.graphicYOffset = 0 + dim.headerYOffset + dim.headerHeight

    dim.footerWidth = this.width - padding.left - padding.right
    dim.footerXOffset = 0 + padding.left
    dim.footerYOffset = 0 + dim.graphicYOffset + dim.graphicHeight
  }

  _addFloatingLabel (parent, { myClass, textConfig, xOffSet = 0, yOffSet = 0 }) {
    return parent.append('svg:text')
      .attr('class', `floating-label ${myClass}`)
      .attr('x', xOffSet)
      .attr('y', yOffSet)
      .attr('text-anchor', textConfig['horizontal-align'])
      .style('font-size', this.getAdjustedTextSize(textConfig['font-size']))
      .style('dominant-baseline', textConfig['dominant-baseline'])
      .text(textConfig.text)
  }

  _addTextTo (parent, { myClass, textConfig, containerWidth, containerHeight, xOffSet = 0, yOffSet = 0 }) {
    const xAnchor = (() => {
      switch (true) {
        case textConfig['horizontal-align'] === 'start': return textConfig['padding-left']
        case textConfig['horizontal-align'] === 'middle': return containerWidth / 2
        case textConfig['horizontal-align'] === 'end': return containerWidth - textConfig['padding-right']
        default: throw new Error(`Invalid horizontal-align: ${textConfig['horizontal-align']}`)
      }
    })()

    const yMidpoint = (() => {
      switch (true) {
        case textConfig['vertical-align'] === 'top': return 0 + textConfig['padding-top']
        case textConfig['vertical-align'] === 'center': return containerHeight / 2
        case textConfig['vertical-align'] === 'bottom': return containerHeight - textConfig['padding-bottom']
        default: throw new Error(`Invalid vertical-align: ${textConfig['vertical-align']}`)
      }
    })()

    return parent.append('svg:text')
      .attr('class', `label ${myClass}`)
      .attr('x', xOffSet + xAnchor)
      .attr('y', yOffSet + yMidpoint)
      .attr('text-anchor', textConfig['horizontal-align'])
      .style('font-size', this.getAdjustedTextSize(textConfig['font-size']))
      .style('dominant-baseline', textConfig['dominant-baseline'])
      .text(textConfig.text)
  }

  _generateDataArray (proportion, numImages) {
    const d3Data = []
    // NB the alg uses terms based on assigning 2D area to an array of shapes
    let remainingArea = proportion * numImages
    _.range(numImages).forEach((i) => {
      const proportionForImageI = (remainingArea > 1) ? 1 : remainingArea
      remainingArea -= proportionForImageI
      d3Data.push({ proportion: proportionForImageI, i })
    })
    return d3Data
  }

  _resize () {
    this.parentSvg.selectAll('*').remove()
    return this._draw()
  }
}

module.exports = GraphicCell
