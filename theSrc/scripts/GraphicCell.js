import _ from 'lodash'
import d3 from 'd3'
import * as log from 'loglevel'

import GraphicCellGrid from './GraphicCellGrid'
import BaseCell from './BaseCell'
import ImageFactory from './ImageFactory'
import DisplayError from './DisplayError'
import labelUtils from './utils/labelUtils'
import { ensureObjectHasValidFontSize } from './utils/fontSizeCleaner'

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
      'floatingLabels',
      'imageWidth',
      'imageHeight',
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

    if (this.config.padding) {
      const [paddingTop, paddingRight, paddingBottom, paddingLeft] = this.config.padding.split(' ')

      this.config.padding = {
        top: parseInt(paddingTop.replace(/(px|em)/, '')),
        right: parseInt(paddingRight.replace(/(px|em)/, '')),
        bottom: parseInt(paddingBottom.replace(/(px|em)/, '')),
        left: parseInt(paddingLeft.replace(/(px|em)/, '')),
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

    // need grid layout now to verify floating label specifications (floating labels cannot be out of bounds)
    this.gridLayout = this._initializeGridLayout()

    if (this.config['text-overlay']) { this.config['text-overlay'] = this._processTextConfig(this.config['text-overlay'], 'text-overlay') }

    // we need to know footer and header size throughout the class, so compute once now and store
    if (this.config['text-header']) {
      this.config['text-header'] = this._processTextConfig(this.config['text-header'], 'text-header')
      const { height } = labelUtils.calculateLabelDimensions(this.config['text-header'], {
        top: this.config['text-header']['padding-top'],
        right: this.config['text-header']['padding-right'],
        bottom: this.config['text-header']['padding-bottom'],
        left: this.config['text-header']['padding-left'],
      })
      this.headerHeight = height
    } else {
      this.headerHeight = 0
    }

    if (this.config['text-footer']) {
      this.config['text-footer'] = this._processTextConfig(this.config['text-footer'], 'text-footer')
      const { height } = labelUtils.calculateLabelDimensions(this.config['text-footer'], {
        top: this.config['text-footer']['padding-top'],
        right: this.config['text-footer']['padding-right'],
        bottom: this.config['text-footer']['padding-bottom'],
        left: this.config['text-footer']['padding-left'],
      })
      this.footerHeight = height
    } else {
      this.footerHeight = 0
    }

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

        if (row.position < 0 || row.position > this.gridLayout.numRows) {
          throw new Error(`Invalid floating label positions '${labelConfig.position}', row must be between 0 and numRows(${this.gridLayout.numRows})`)
        }

        if (col.position < 0 || col.position > this.gridLayout.numCols) {
          throw new Error(`Invalid floating label positions '${labelConfig.position}', col must be between 0 and numCols(${this.gridLayout.numCols})`)
        }

        const className = `floating-label-${labelConfig.position}`.replace(/[.:]/g, '-')
        const newFloatingLabelConfig = this._processTextConfig(_.omit(labelConfig, 'position'), className)
        newFloatingLabelConfig.className = className
        newFloatingLabelConfig.position = { row: row, col: col }
        this.config.floatingLabels.push(newFloatingLabelConfig)
      })
    } else {
      this.config.floatingLabels = []
    }
  }

  _initializeGridLayout () {
    const gridLayout = new GraphicCellGrid()
      .rowGutter(this.config.rowGutter)
      .columnGutter(this.config.columnGutter)

    if (this.config.numRows != null) { gridLayout.rows(this.config.numRows) }
    if (this.config.numCols != null) { gridLayout.cols(this.config.numCols) }
    gridLayout.numNodes(this.config.numImages)

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

    gridLayout._calcGridDimensions()

    return gridLayout
  }

  // NB graphic cell constraints must be recomputed on each resize, so override the caching behaviour of baseCell
  getDimensionConstraints () {
    const numRows = this.gridLayout.rows()
    const numCols = this.gridLayout.cols()

    const marginConstraints = {
      width: {
        negative: [],
        positive: [],
      },
      height: {
        negative: [],
        positive: [],
      },
    }

    const convertPaddingConfig = (incomingConfig) => {
      return {
        top: incomingConfig['padding-top'] || 0,
        right: incomingConfig['padding-right'] || 0,
        bottom: incomingConfig['padding-bottom'] || 0,
        left: incomingConfig['padding-left'] || 0,
      }
    }

    _.each(this.config.floatingLabels, (floatingLabelConfig) => {
      const position = floatingLabelConfig.position
      // NB TODO for now do not deal with gutter floating labels
      if (position.row.gutter === true) { return }
      if (position.col.gutter === true) { return }

      // horizontal-align: ['start', 'middle', 'end']
      // vertical-align: ['top', 'center', 'bottom']

      let horizontalAlignment = floatingLabelConfig['horizontal-align']
      let verticalAlignment = floatingLabelConfig['vertical-align']
      let { width, height } = labelUtils.calculateLabelDimensions(floatingLabelConfig, convertPaddingConfig(floatingLabelConfig))

      const directionAdjustedWidthOverlap = (unadjusted) => {
        return (this.gridLayout.isRightToLeft())
          ? 1 - unadjusted
          : unadjusted
      }

      const directionAdjustedHeightOverlap = (unadjusted) => {
        return (this.gridLayout.isBottomToTop())
          ? 1 - unadjusted
          : unadjusted
      }

      switch (horizontalAlignment) {
        case 'start':
          marginConstraints.width.positive.push({
            text: floatingLabelConfig.text, // debug only. helps a lot
            size: width,
            overlapInUnitsOfGraphicSize: directionAdjustedWidthOverlap((numCols - position.col.position) / numCols),
          })
          break
        case 'middle':
          marginConstraints.width.positive.push({
            text: floatingLabelConfig.text, // debug only. helps a lot
            size: width / 2.0,
            overlapInUnitsOfGraphicSize: directionAdjustedWidthOverlap((numCols - position.col.position) / numCols),
          })
          marginConstraints.width.negative.push({
            text: floatingLabelConfig.text, // debug only. helps a lot
            size: width / 2.0,
            overlapInUnitsOfGraphicSize: directionAdjustedWidthOverlap(position.col.position / numCols),
          })
          break
        case 'end':
          marginConstraints.width.negative.push({
            text: floatingLabelConfig.text, // debug only. helps a lot
            size: width,
            overlapInUnitsOfGraphicSize: directionAdjustedWidthOverlap(position.col.position / numCols),
          })
          break
      }

      switch (verticalAlignment) {
        case 'top':
          marginConstraints.height.negative.push({
            text: floatingLabelConfig.text, // debug only. helps a lot
            size: height,
            overlapInUnitsOfGraphicSize: directionAdjustedHeightOverlap(position.row.position / numRows),
          })
          break
        case 'center':
          marginConstraints.height.positive.push({
            text: floatingLabelConfig.text, // debug only. helps a lot
            size: height / 2.0,
            overlapInUnitsOfGraphicSize: directionAdjustedHeightOverlap((numRows - position.row.position) / numRows),
          })
          marginConstraints.height.negative.push({
            text: floatingLabelConfig.text, // debug only. helps a lot
            size: height / 2.0,
            overlapInUnitsOfGraphicSize: directionAdjustedHeightOverlap(position.row.position / numRows),
          })
          break
        case 'bottom':
          marginConstraints.height.positive.push({
            text: floatingLabelConfig.text, // debug only. helps a lot
            size: height,
            overlapInUnitsOfGraphicSize: directionAdjustedHeightOverlap((numRows - position.row.position) / numRows),
          })
          break
      }
    })

    if (this.config['text-header'] != null) {
      marginConstraints.height.negative.push({
        size: this.headerHeight,
        overlapInUnitsOfGraphicSize: 0,
      })
    }

    if (this.config['text-footer'] != null) {
      marginConstraints.height.positive.push({
        size: this.footerHeight,
        overlapInUnitsOfGraphicSize: 0,
      })
    }

    return this.imageFactory.calculateAspectRatio(this.config.variableImage).then((imageAspectRatio) => {
      // NB rectangle and ellipse do not have a desired aspect ratio, so in these cases default to 1
      if (_.isNull(imageAspectRatio)) { imageAspectRatio = 1 }
      imageAspectRatio = parseFloat(imageAspectRatio)

      const rowGutterToImageRatio = this.gridLayout.rowGutter() / (1 - this.gridLayout.rowGutter())
      const columnGutterToImageRatio = this.gridLayout.columnGutter() / (1 - this.gridLayout.columnGutter())
      const cellHeightInImageHeightUnits = numRows + (numRows - 1) * rowGutterToImageRatio
      const cellWidthInImageWidthUnits = numCols + (numCols - 1) * columnGutterToImageRatio

      // If the config specified one or more fixed dimensions, then honor those dimensions, otherwise just return the desired aspect ratio
      let graphicCellConstraint = null
      if (this.config.imageHeight || this.config.imageWidth) {
        let cellDimensions = { width: null, height: null }
        if (this.config.imageHeight) {
          cellDimensions.height = cellHeightInImageHeightUnits * this.config.imageHeight
        }
        if (this.config.imageWidth) {
          cellDimensions.width = cellWidthInImageWidthUnits * this.config.imageWidth
        }
        if (!this.config.imageHeight) {
          const imageHeight = this.config.imageWidth / imageAspectRatio // do not write back to config, subsequent calcs will be affected
          cellDimensions.height = imageHeight * cellHeightInImageHeightUnits
        }
        if (!this.config.imageWidth) {
          const imageWidth = this.config.imageHeight * imageAspectRatio // do not write back to config, subsequent calcs will be affected
          cellDimensions.width = imageWidth * cellWidthInImageWidthUnits
        }

        graphicCellConstraint = {
          aspectRatio: null,
          width: {
            min: cellDimensions.width,
            max: cellDimensions.width,
            size: cellDimensions.width,
            margins: marginConstraints.width,
          },
          height: {
            min: cellDimensions.height + this.headerHeight + this.footerHeight,
            max: cellDimensions.height + this.headerHeight + this.footerHeight,
            size: cellDimensions.height + this.headerHeight + this.footerHeight,
            margins: marginConstraints.height,
          },
        }
      } else {
        graphicCellConstraint = {
          aspectRatio: imageAspectRatio * cellWidthInImageWidthUnits / cellHeightInImageHeightUnits,
          width: {
            min: null,
            max: null,
            margins: marginConstraints.width,
          },
          height: {
            min: null,
            max: null,
            margins: marginConstraints.height,
          },
        }
      }

      return graphicCellConstraint
    })
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

    this._verifyKeyIsInt(textConfig, 'padding-left', 0)
    this._verifyKeyIsInt(textConfig, 'padding-right', 0)
    this._verifyKeyIsInt(textConfig, 'padding-top', 0)
    this._verifyKeyIsInt(textConfig, 'padding-bottom', 0)

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
    ensureObjectHasValidFontSize(textConfig, BaseCell.getDefault('font-size'))
    _(['font-family', 'font-weight', 'font-color']).each((cssAttribute) => {
      if (textConfig[cssAttribute] != null) { this.setCss(cssName, cssAttribute, textConfig[cssAttribute]) }
    })

    return textConfig
  }

  _draw () {
    // NB the order of append operations matters as SVG is a last on top rendering model; there is no z-index
    this._computeDimensions()
    const d3Data = this._generateDataArray(this.config.proportion, this.config.numImages)

    const unoptimisedEnteringLeafNodeData = this.gridLayout.compute(d3Data)
    const enteringLeafNodeData = unoptimisedEnteringLeafNodeData.filter(imageInfo => this.config.baseImage || imageInfo.proportion > 0)
    log.debug(`graphic cell node count`, { raw: unoptimisedEnteringLeafNodeData.length, optimised: enteringLeafNodeData.length })

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
        yOffSet: this.dimensions.headerYOffset,
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
        yOffSet: this.dimensions.footerYOffset,
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

    const imageWidth = this.gridLayout.nodeWidth()
    const imageHeight = this.gridLayout.nodeHeight()

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
      const imageFactory = this.imageFactory
      const baseImageRenderPromises = []
      enteringLeafNodes.each(function (dataAttributes) {
        const d3Node = d3.select(this)
        baseImageRenderPromises.push(
          imageFactory.addBaseImageTo(d3Node, baseImageConfig, imageWidth, imageHeight, dataAttributes)
        )
      })
      baseImageCompletePromise = Promise.all(baseImageRenderPromises).catch(imageErrorHandler)
    }

    // TODO this should be tied to base image promise unconditioanlly (ie. swap lines below)
    // let variableImageCompletePromise = baseImageCompletePromise
    let variableImageCompletePromise = Promise.resolve()
    if (this.config.variableImage != null) {
      const variableImageConfig = this.config.variableImage
      const imageFactory = this.imageFactory
      variableImageCompletePromise = baseImageCompletePromise.then(function () {
        const variableImageRenderPromises = []
        enteringLeafNodes.each(function (dataAttributes) {
          const d3Node = d3.select(this)
          variableImageRenderPromises.push(
            imageFactory.addVarImageTo(d3Node, variableImageConfig, imageWidth, imageHeight, dataAttributes)
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
          containerWidth: this.gridLayout.nodeWidth(),
          containerHeight: imageHeight,
        })
      }

      _(this.config.floatingLabels).each((floatingLabelConfig) => {
        const x = (floatingLabelConfig.position.col.gutter)
          ? this.gridLayout.getGutterX(floatingLabelConfig.position.col.position)
          : this.gridLayout.getX(floatingLabelConfig.position.col.position)

        const y = (floatingLabelConfig.position.row.gutter)
          ? this.gridLayout.getGutterY(floatingLabelConfig.position.row.position)
          : this.gridLayout.getY(floatingLabelConfig.position.row.position)

        // NB TODO ignoring bottom and right padding ?
        this._addFloatingLabel(graphicContainer, {
          myClass: floatingLabelConfig.className,
          textConfig: floatingLabelConfig,
          xOffSet: floatingLabelConfig['padding-left'] + x,
          yOffSet: floatingLabelConfig['padding-top'] + y,
        })
      })
    })
  }

  _computeDimensions () {
    this.dimensions = {}
    const dim = this.dimensions
    const padding = this.config.padding

    // need these first to calc graphicHeight
    dim.headerHeight = Math.max(this.headerHeight, this.dynamicMargins.height.negative)
    dim.footerHeight = Math.max(this.footerHeight, this.dynamicMargins.height.positive)

    const leftPadding = padding.left + this.dynamicMargins.width.negative
    const rightPadding = padding.right + this.dynamicMargins.width.positive

    dim.headerWidth = this.width - leftPadding - rightPadding
    dim.headerXOffset = leftPadding
    dim.headerYOffset = padding.top

    dim.graphicWidth = this.width - leftPadding - rightPadding
    dim.graphicHeight = this.height - dim.headerHeight - dim.footerHeight - padding.top - padding.bottom
    dim.graphicXOffset = leftPadding
    dim.graphicYOffset = dim.headerYOffset + dim.headerHeight

    dim.footerWidth = this.width - leftPadding - rightPadding
    dim.footerXOffset = leftPadding
    dim.footerYOffset = dim.graphicYOffset + dim.graphicHeight

    this.gridLayout
      .containerWidth(dim.graphicWidth)
      .containerHeight(dim.graphicHeight)
  }

  _addFloatingLabel (parent, { myClass, textConfig, xOffSet = 0, yOffSet = 0 }) {
    return parent.append('svg:text')
      .attr('class', `floating-label ${myClass}`)
      .attr('x', xOffSet)
      .attr('y', yOffSet)
      .attr('text-anchor', textConfig['horizontal-align'])
      .style('font-size', textConfig['font-size'])
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
      .style('font-size', textConfig['font-size'])
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
}

module.exports = GraphicCell
