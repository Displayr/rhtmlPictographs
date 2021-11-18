const _ = require('lodash')
const d3 = require('d3')
const $ = require('jquery')
const PictographConfig = require('./PictographConfig')
const log = require('loglevel')
const SvgDefinitionManager = require('./SvgDefinitionManager')
const ImageFactory = require('./ImageFactory')
const InsufficientContainerSizeError = require('./InsufficientContainerSizeError')
const { fontSizeWithPixelSuffix } = require('./utils/fontSizeUtils')

log.setLevel('error')

class Pictograph {
  constructor (el) {
    this.rootElement = _.has(el, 'length') ? el[0] : el
    d3.select(this.rootElement).attr(`rhtmlwidget-status`, 'loading')
    d3.select(this.rootElement).attr(`rhtmlPictographs-status`, 'loading') // to be removed once regression testing code checks for rhtmlwidget-status
    const actualDimensions = this.getContainerDimensions()
    log.info('Pictograph() called. Container dimensions:', actualDimensions, 'element:', el)

    this.config = new PictographConfig()
    this.config.setDimensions(actualDimensions)
  }

  setConfig (userConfig) {
    this.config.processUserConfig(userConfig)
  }

  draw () {
    this.config.cssCollector.draw()
    this._removeAllContentFromRootElement()
    this._manipulateRootElementSize()
    this._addSvgToRootElement()
    this.imageFactory = new ImageFactory({ definitionManager: new SvgDefinitionManager({ parentSvg: this.outerSvg }) })
    _(this.config.cells).flatten().each(({ instance }) => instance.setImageFactory(this.imageFactory))

    return Promise.resolve()
      .then(this._computeCellSizes.bind(this))
      .then(this._computeCellPlacement.bind(this))
      .then(this._render.bind(this))
      .catch((error) => {
        if (error.type === InsufficientContainerSizeError.type) {
          console.log(error.message)
          d3.select(this.rootElement).attr(`rhtmlwidget-status`, 'ready')
          d3.select(this.rootElement).attr(`rhtmlPictographs-status`, 'ready') // to be removed once regression testing code checks for rhtmlwidget-status
        } else {
          console.error(`error in pictograph draw: ${error.message}`)
          console.error(error.stack)
          throw error
        }
      })
  }

  resize () {
    // VIS-895: somehow resize is being called even when pictograph is no longer attached to the document.
    if (!this.rootElement.isConnected) { return }

    const actualDimensions = this.getContainerDimensions()
    log.info('Pictograph.resize called. Container dimensions:', actualDimensions, `resizable:${this.config.resizable}`)

    if (this.config.resizable === false) { return }

    this.config.setDimensions(actualDimensions)

    this._removeAllContentFromRootElement()
    this._addSvgToRootElement()
    this.imageFactory = new ImageFactory({ definitionManager: new SvgDefinitionManager({ parentSvg: this.outerSvg }) })
    _(this.config.cells).flatten().each(({ instance }) => instance.setImageFactory(this.imageFactory))

    // NB I want to do this on call to setDimensions (issue is initial call to setDimension occurs before config is abailable)
    this.config._processGridWidthSpec()
    this.config._processGridHeightSpec()

    return Promise.resolve()
      .then(this._computeCellSizes.bind(this))
      .then(this._computeCellPlacement.bind(this))
      .then(this._render.bind(this))
      .catch((error) => {
        if (error.type === InsufficientContainerSizeError.type) {
          console.log(error.message)
          d3.select(this.rootElement).attr(`rhtmlwidget-status`, 'ready')
          d3.select(this.rootElement).attr(`rhtmlPictographs-status`, 'ready') // to be removed once regression testing code checks for rhtmlwidget-status
        } else {
          console.error(`error in pictograph resize: ${error.message}`)
          console.error(error.stack)
          throw error
        }
      })
  }

  _getAllCellsInDimension (dimension, dimensionIndex) {
    if (dimension === 'row') {
      return this._getAllCellsInRow(dimensionIndex)
    } else if (dimension === 'column') {
      return this._getAllCellsInColumn(dimensionIndex)
    }
    throw new Error(`getAllCellsInDimension called with invalid dimension '${dimension}'`)
  }

  _getAllCellsInColumn (columnIndex) {
    return _.range(this.config.gridInfo.dimensions.row).map((rowIndex) => {
      return this._getCell(rowIndex, columnIndex)
    })
  }

  _getAllCellsInRow (rowIndex) {
    return this.config.cells[rowIndex]
  }

  _getCell (rowIndex, columnIndex) {
    return this.config.cells[rowIndex][columnIndex]
  }

  _computeTableLines () {
    const numberOfGuttersAtIndex = (index) => { return index }

    const calcLineVariableDimension = function (linePosition, cellSizes, gutterSize) {
      const numberOfCellsPast = Math.floor(linePosition)
      const fractionOfCell = linePosition - numberOfCellsPast
      const sizeOfCellsPast = _(cellSizes).slice(0, numberOfCellsPast).map('size').sum()

      let sizeOfGuttersPast = 0
      if (numberOfCellsPast > 0 && numberOfCellsPast < cellSizes.length) {
        sizeOfGuttersPast = (numberOfGuttersAtIndex(numberOfCellsPast) * gutterSize) - (0.5 * gutterSize)
      } else if (numberOfCellsPast > 0 && numberOfCellsPast === cellSizes.length) {
        sizeOfGuttersPast = numberOfGuttersAtIndex(numberOfCellsPast - 1) * gutterSize
      }

      let sizeOfFraction = 0
      if (numberOfCellsPast === 0) {
        sizeOfFraction = fractionOfCell * cellSizes[numberOfCellsPast].size
      } else if (numberOfCellsPast < cellSizes.length) {
        sizeOfFraction = fractionOfCell * (cellSizes[numberOfCellsPast].size + gutterSize)
      }

      return sizeOfCellsPast + sizeOfGuttersPast + sizeOfFraction
    }

    const pictographOffsets = this._computePictographOffsets()

    const computedHorizontalLines = this.config.lines.horizontal.map((linePosition) => {
      const y = calcLineVariableDimension(linePosition, this.config.gridInfo.sizes.row, this.config.size.gutter.row)
      return {
        position: linePosition,
        orientation: 'horizontal',
        x1: pictographOffsets.x + this.config.lines.padding['left'],
        x2: pictographOffsets.x + this.config.totalAllocatedHorizontalSpace - this.config.lines.padding['right'],
        y1: pictographOffsets.y + y,
        y2: pictographOffsets.y + y,
        style: this.config.lines.style || 'stroke:black;stroke-width:2',
      }
    })

    const computedVerticalLines = this.config.lines.vertical.map((linePosition) => {
      const x = calcLineVariableDimension(linePosition, this.config.gridInfo.sizes.column, this.config.size.gutter.row)
      return {
        position: linePosition,
        orientation: 'vertical',
        x1: pictographOffsets.x + x,
        x2: pictographOffsets.x + x,
        y1: pictographOffsets.y + this.config.lines.padding['top'],
        y2: pictographOffsets.y + this.config.totalAllocatedVerticalSpace - this.config.lines.padding['bottom'],
        style: this.config.lines.style || 'stroke:black;stroke-width:2',
      }
    })

    return _.flatten([computedHorizontalLines, computedVerticalLines])
  }

  _computeCellSizes () {
    // NB vector refers to either a column or row
    // Phase 1. For each fixed size vector
    //   find all non fixed size vectors that do not have an explicit size (i.e., height or width),
    //   and compute the size of the vector based on the specs of the cells in that vector.
    //   If there are no conflicts (multiple different size specs) the vector is assigned that width/height.
    //   If there are conflicts throw an exception
    // Phase 2. For each flexible vector, compute size of vector based on specs of cell in that vector. Adjust proportion based vectors based on desired aspect ratios of cells in vector

    // NB TODO at present we let phase 1 and 2 run in parallel. To support certain use cases we will probably need to serialize their execution
    const completionPromises = _.flatten([
      this._computeSizeOfFixedVectors({ vectorType: 'row' }),
      this._computeSizeOfFixedVectors({ vectorType: 'column' }),
      this._computeSizeOfFlexibleVectors(),
    ])

    return Promise.all(completionPromises)
  }

  _computeSizeOfFixedVectors ({ vectorType }) {
    const dimensionName = (vectorType === 'row') ? 'height' : 'width'
    return this.config.gridInfo.sizes[vectorType]
      .map((vectorSizeSpec, vectorIndex) => { return { vectorSizeSpec, vectorIndex } })
      .filter(({ vectorSizeSpec }) => { return (!vectorSizeSpec.flexible && !vectorSizeSpec.size) })
      .map(({ vectorSizeSpec, vectorIndex }) => {
        const cellSizeConstraintPromises = this._getAllCellsInDimension(vectorType, vectorIndex).map((cell) => {
          return cell.instance.getDimensionConstraints()
        })

        return Promise.all(cellSizeConstraintPromises).then((cellSizeConstraints) => {
          let fixedSizes = cellSizeConstraints
            .filter((cellSizeConstraint) => (_.has(cellSizeConstraint[dimensionName], 'size') && !_.isNull(cellSizeConstraint[dimensionName].size)))
            .map((cellSizeConstraint) => cellSizeConstraint[dimensionName].size)

          const uniqueFixedSizes = _.uniq(fixedSizes)
          if (uniqueFixedSizes.length === 1) {
            vectorSizeSpec.size = uniqueFixedSizes[0] // TODO apply a min against total size available ?
          }
          if (uniqueFixedSizes.length > 1) {
            throw new Error('cannot handle multiple cells in same row specifying different fixed heights')
          }
        })
      })
  }

  // NB Most complex piece of whole library - also is not yet fully generalized (only handles certain cases)
  _computeSizeOfFlexibleVectors () {
    if (!this.config.gridInfo.flexible.column && !this.config.gridInfo.flexible.row) {
      return []
    }

    // NB There is currently a limitation where I can only support either flexible rows, or flexible columns, but not both
    // this is enforced in the config validation section
    // TODO introduce the term 'vector' into the code ? (https://english.stackexchange.com/questions/132493/common-term-for-row-and-column)
    const flexibleDimension = (this.config.gridInfo.flexible.column) ? 'column' : 'row'
    const fixedDimension = (flexibleDimension === 'column') ? 'row' : 'column'
    const flexibleSize = (flexibleDimension === 'column') ? 'width' : 'height'
    const fixedSize = (flexibleDimension === 'column') ? 'height' : 'width'

    let totalRangeAvailable = this.config.size.container[flexibleSize] - ((this.config.gridInfo.dimensions[flexibleDimension] - 1) * this.config.size.gutter[flexibleDimension])

    const sumFixedCellSize = _(this.config.gridInfo.sizes[flexibleDimension])
      .filter(cellSizeData => !cellSizeData.flexible)
      .map('size')
      .sum()

    totalRangeAvailable -= sumFixedCellSize

    const flexibleCellIndexes = this.config.gridInfo.sizes[flexibleDimension].map((cellSizeData, index) => {
      if (cellSizeData.flexible) {
        return index
      }
      return null
    }).filter(indexOrNull => !_.isNull(indexOrNull))

    return flexibleCellIndexes.map(flexibleIndex => {
      const cellSizeConstraintPromises = this._getAllCellsInDimension(flexibleDimension, flexibleIndex).map((cell) => {
        return cell.instance.getDimensionConstraints()
      })

      const cellSizeData = this.config.gridInfo.sizes[flexibleDimension][flexibleIndex]

      return Promise.all(cellSizeConstraintPromises).then((cellSizeConstraints) => {
        const combinedConstraints = {
          width: {
            margins: {
              positive: [],
              negative: [],
            },
          },
          height: {
            margins: {
              positive: [],
              negative: [],
            },
          },
        }

        const computedDynamicMargins = {
          width: {
            positive: [],
            negative: [],
          },
          height: {
            positive: [],
            negative: [],
          },
        }

        const combineArraysOfTwoObjectsUsingPathExpression = (objToBeManipulated, objToBeSampled, expression) => {
          const array1 = _.get(objToBeManipulated, expression)
          const array2 = _.get(objToBeSampled, expression)
          _.set(objToBeManipulated, expression, array1.concat(array2))
        }

        cellSizeConstraints.map((cellSizeConstraint) => {
          const expressions = [
            'width.margins.positive',
            'width.margins.negative',
            'height.margins.positive',
            'height.margins.negative',
          ]

          _(expressions).each(expression => combineArraysOfTwoObjectsUsingPathExpression(combinedConstraints, cellSizeConstraint, expression))
        })

        if (cellSizeData.type === 'label') {
          const maxOfMinSizes = Math.max.apply(null, _(cellSizeConstraints).map(`${flexibleSize}.min`).value())
          cellSizeData.size = maxOfMinSizes
          totalRangeAvailable -= cellSizeData.size

          // NB TODO there is an order of operations assumption here that this code (calc min of proportion spec) goes first
          cellSizeConstraints.map((cellSizeContraint, dimensionIndex) => {
            if (this.config.gridInfo.sizes[fixedDimension][dimensionIndex].type === 'proportion' && this.config.gridInfo.sizes[fixedDimension][dimensionIndex].preference === 'min') {
              this.config.gridInfo.sizes[fixedDimension][dimensionIndex].min = Math.max(this.config.gridInfo.sizes[fixedDimension][dimensionIndex].min, cellSizeContraint[fixedSize].min)
            }
          })
        }

        if (cellSizeData.type === 'graphic') {
          cellSizeConstraints.map((cellSizeConstraint, dimensionIndex) => {
            const aspectRatioMultiplier = (flexibleDimension === 'column') ? cellSizeConstraint.aspectRatio : (1.0 / cellSizeConstraint.aspectRatio)

            const findFlexibleSizeGivenFixedSize = (totalSizeOfFixedDimension) => {
              // NB TODO I cannot handle margin overlap in the fixed dimension, so ignore any constraint in the fixed dimension that has any overlap
              const negativeFixedMargin = _(combinedConstraints[fixedSize].margins.negative).map(({ size, overlapInUnitsOfGraphicSize }) => {
                return (overlapInUnitsOfGraphicSize === 0) ? size : 0
              }).max() || 0
              const positiveFixedMargin = _(combinedConstraints[fixedSize].margins.positive).map(({ size, overlapInUnitsOfGraphicSize }) => {
                return (overlapInUnitsOfGraphicSize === 0) ? size : 0
              }).max() || 0

              computedDynamicMargins[fixedSize].negative = Math.max(computedDynamicMargins[fixedSize].negative, negativeFixedMargin)
              computedDynamicMargins[fixedSize].positive = Math.max(computedDynamicMargins[fixedSize].positive, positiveFixedMargin)

              const fixedSizeMargin = negativeFixedMargin + positiveFixedMargin

              const fixedSizeGraphic = Math.max(0, totalSizeOfFixedDimension - fixedSizeMargin)
              const flexibleSizeGraphic = fixedSizeGraphic * aspectRatioMultiplier

              const negativeFlexibleMargin = _(combinedConstraints[flexibleSize].margins.negative).map(({ size, overlapInUnitsOfGraphicSize }) => {
                return Math.max(0, size - overlapInUnitsOfGraphicSize * flexibleSizeGraphic)
              }).max() || 0
              const positiveFlexibleMargin = _(combinedConstraints[flexibleSize].margins.positive).map(({ size, overlapInUnitsOfGraphicSize }) => {
                return Math.max(0, size - overlapInUnitsOfGraphicSize * flexibleSizeGraphic)
              }).max() || 0

              computedDynamicMargins[flexibleSize].negative = Math.max(computedDynamicMargins[flexibleSize].negative, negativeFlexibleMargin)
              computedDynamicMargins[flexibleSize].positive = Math.max(computedDynamicMargins[flexibleSize].positive, positiveFlexibleMargin)

              const flexibleSizeAll = flexibleSizeGraphic + negativeFlexibleMargin + positiveFlexibleMargin

              return flexibleSizeAll
            }

            if (!cellSizeConstraint[flexibleSize].max) {
              cellSizeConstraint[flexibleSize].max = findFlexibleSizeGivenFixedSize(this.config.gridInfo.sizes[fixedDimension][dimensionIndex].max)
            }
          })

          const minOfMaxSizes = Math.min.apply(null, _(cellSizeConstraints).map(`${flexibleSize}.max`).value())
          cellSizeData.size = Math.min(minOfMaxSizes, totalRangeAvailable)
          cellSizeData.dynamicMargins = _.cloneDeep(computedDynamicMargins)
          totalRangeAvailable -= cellSizeData.size

          // NB TODO I assume this runs after the "calc min of proportion spec" code above
          cellSizeConstraints.map((cellSizeContraint, dimensionIndex) => {
            if (this.config.gridInfo.sizes[fixedDimension][dimensionIndex].type === 'proportion' && this.config.gridInfo.sizes[fixedDimension][dimensionIndex].preference === 'min') {
              const aspectRatioMultiplier = (flexibleDimension === 'row') ? cellSizeContraint.aspectRatio : (1.0 / cellSizeContraint.aspectRatio)
              const flexibleMarginSize = computedDynamicMargins[flexibleSize].negative + computedDynamicMargins[flexibleSize].positive
              const fixedMarginSize = computedDynamicMargins[fixedSize].negative + computedDynamicMargins[fixedSize].positive
              const optimalFixedDimensionSize = (cellSizeData.size - (flexibleMarginSize)) * aspectRatioMultiplier + fixedMarginSize

              this.config.gridInfo.sizes[fixedDimension][dimensionIndex].size = Math.min(
                this.config.gridInfo.sizes[fixedDimension][dimensionIndex].max,
                Math.max(this.config.gridInfo.sizes[fixedDimension][dimensionIndex].min, optimalFixedDimensionSize)
              )
            }
          })
        }
      })
    })
  }

  _computeCellPlacement () {
    const numberOfGuttersAtIndex = index => index
    const pictographOffsets = this._computePictographOffsets()

    this.config.cells.forEach((row, rowIndex) => {
      const rowDynamicMargins = this.config.gridInfo.sizes['row'][rowIndex].dynamicMargins
      row.forEach((cell, columnIndex) => {
        const columnDynamicMargins = this.config.gridInfo.sizes['column'][columnIndex].dynamicMargins

        cell.dynamicMargins = {
          width: {
            positive: Math.max(rowDynamicMargins.width.positive, columnDynamicMargins.width.positive),
            negative: Math.max(rowDynamicMargins.width.negative, columnDynamicMargins.width.negative),
          },
          height: {
            positive: Math.max(rowDynamicMargins.height.positive, columnDynamicMargins.height.positive),
            negative: Math.max(rowDynamicMargins.height.negative, columnDynamicMargins.height.negative),
          },
        }

        cell.x = pictographOffsets.x + _.sum(_(this.config.gridInfo.sizes.column).slice(0, columnIndex).map('size').value()) + (numberOfGuttersAtIndex(columnIndex) * this.config.size.gutter.column)
        cell.y = pictographOffsets.y + _.sum(_(this.config.gridInfo.sizes.row).slice(0, rowIndex).map('size').value()) + (numberOfGuttersAtIndex(rowIndex) * this.config.size.gutter.row)
        cell.width = this.config.gridInfo.sizes.column[columnIndex].size
        cell.height = this.config.gridInfo.sizes.row[rowIndex].size
      })
    })
    return Promise.resolve()
  }

  _computePictographOffsets () {
    let offsets = {
      x: null,
      y: null,
    }

    const freeXSpace = Math.max(0, (this.config.size.container.width - this.config.totalAllocatedHorizontalSpace))
    if (this.config.alignment.horizontal === 'left') {
      offsets.x = 0
    } else if (this.config.alignment.horizontal === 'center') {
      offsets.x = freeXSpace / 2
    } else if (this.config.alignment.horizontal === 'right') {
      offsets.x = freeXSpace
    } else {
      throw new Error(`(should not get here) : Invalid horizontal alignment '${this.config.alignment.horizontal}'`)
    }

    const freeYSpace = Math.max(0, (this.config.size.container.height - this.config.totalAllocatedVerticalSpace))
    if (this.config.alignment.vertical === 'top') {
      offsets.y = this.config.tableHeaderHeight
    } else if (this.config.alignment.vertical === 'center') {
      offsets.y = this.config.tableHeaderHeight + freeYSpace / 2
    } else if (this.config.alignment.vertical === 'bottom') {
      offsets.y = this.config.tableHeaderHeight + freeYSpace
    } else {
      throw new Error(`(should not get here) : Invalid vertical alignment '${this.config.alignment.vertical}'`)
    }

    return offsets
  }

  _render () {
    const tableCells = _.flatten(this.config.cells)

    if (this.config['background-color']) {
      this.outerSvg.append('svg:rect')
        .attr('class', 'background')
        .attr('width', this.config.size.container.width)
        .attr('height', this.config.size.container.height)
        .attr('fill', this.config['background-color'])
    }

    if (this.config.tableHeader) {
      this._addTextTo(this.outerSvg, {
        myClass: 'table-header',
        textConfig: this.config.tableHeader,
        containerWidth: this.config.size.container.width,
        containerHeight: this.config.tableHeaderHeight,
        yOffSet: 0,
      })
    }

    if (this.config.tableFooter) {
      // const pictographOffsets = this._computePictographOffsets()

      this._addTextTo(this.outerSvg, {
        myClass: 'table-footer',
        textConfig: this.config.tableFooter,
        containerWidth: this.config.size.container.width,
        containerHeight: this.config.tableFooterHeight,
        // TODO NB this 2 * is unintuitive
        // yOffSet: - 2 * pictographOffsets.y + this.config.gridHeight + this.config.tableHeaderHeight
        yOffSet: this.config.size.container.height - this.config.tableFooterHeight,
      })
    }

    // TODO move this to the draw promise chain
    const computedLines = this._computeTableLines()
    this.outerSvg.selectAll(`.line`)
      .data(computedLines)
      .enter()
      .append('line')
      .attr('x1', d => d.x1)
      .attr('x2', d => d.x2)
      .attr('y1', d => d.y1)
      .attr('y2', d => d.y2)
      .attr('style', d => d.style)
      .attr('class', function (d) {
        return `line ${d.orientation}-line line-${d.position}`
      })

    const enteringCells = this.outerSvg.selectAll('.table-cell')
      .data(tableCells)
      .enter()
      .append('g')
      .attr('class', 'table-cell')
      .attr('transform', d => `translate(${d.x},${d.y})`)

    enteringCells.each(function (d) {
      const instance = d.instance
      log.debug(`rendering entering cell`, instance)

      d3.select(this).classed(`table-cell-${d.row}-${d.column}`, true)
      d3.select(this).classed(d.type, true)

      instance.setParentSvg(d3.select(this))
      instance.setWidth(d.width)
      instance.setHeight(d.height)
      instance.setDynamicMargins(d.dynamicMargins)
      instance.draw()
    })

    d3.select(this.rootElement).attr(`rhtmlwidget-status`, 'ready')
    d3.select(this.rootElement).attr(`rhtmlPictographs-status`, 'ready') // to be removed once regression testing code checks for rhtmlwidget-status
  }

  // TODO Duplicated code from graphicCell
  _addTextTo (parent, { myClass, textConfig, containerWidth, containerHeight, xOffSet = 0, yOffSet = 0 }) {
    const xAnchor = (() => {
      switch (true) {
        case textConfig['horizontal-align'] === 'start': return textConfig.padding.left
        case textConfig['horizontal-align'] === 'middle': return containerWidth / 2
        case textConfig['horizontal-align'] === 'end': return containerWidth - textConfig.padding.right
        default: throw new Error(`Invalid horizontal-align: ${textConfig['horizontal-align']}`)
      }
    })()

    const yMidpoint = (() => {
      switch (true) {
        case textConfig['vertical-align'] === 'top': return 0 + textConfig.padding.top
        case textConfig['vertical-align'] === 'center': return containerHeight / 2
        case textConfig['vertical-align'] === 'bottom': return containerHeight - textConfig.padding.bottom
        default: throw new Error(`Invalid vertical-align: ${textConfig['vertical-align']}`)
      }
    })()

    return parent.append('svg:text')
      .attr('class', `label ${myClass}`)
      .attr('x', xOffSet + xAnchor)
      .attr('y', yOffSet + yMidpoint)
      .attr('text-anchor', textConfig['horizontal-align'])
      .style('font-size', fontSizeWithPixelSuffix(textConfig['font-size']))
      .style('dominant-baseline', textConfig['dominant-baseline'])
      .text(textConfig.text)
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

  _removeAllContentFromRootElement () {
    $(this.rootElement).find('*').remove()
  }

  _manipulateRootElementSize () {
    // root element has width and height in a style tag. Clear that
    $(this.rootElement).attr('style', '')

    if (this.config.resizable) {
      return $(this.rootElement).width('100%').height('100%')
    }
    return $(this.rootElement).width(this.config.size.container.width).height(this.config.size.container.height)
  }

  _addSvgToRootElement () {
    const anonSvg = $('<svg class="rhtmlwidget-outer-svg">')
      .addClass(this.config.id)
      .attr('id', this.config.id)
      .attr('width', '100%')
      .attr('height', '100%')

    $(this.rootElement).append(anonSvg)

    this.outerSvg = d3.select(anonSvg[0])

    // NB JQuery insists on lowercasing attributes, so we must use JS directly
    // when setting viewBox and preserveAspectRatio ?!
    document.getElementsByClassName(`${this.config.id} rhtmlwidget-outer-svg`)[0]
      .setAttribute('viewBox', `0 0 ${this.config.size.container.width} ${this.config.size.container.height}`)
    if (this.config.preserveAspectRatio != null) {
      document.getElementsByClassName(`${this.config.id} rhtmlwidget-outer-svg`)[0]
        .setAttribute('preserveAspectRatio', this.config.preserveAspectRatio)
    }

    return null
  }

  getContainerDimensions () {
    try {
      const jqueryRoot = $(this.rootElement)
      return {
        width: jqueryRoot.width(),
        height: jqueryRoot.height(),
      }
    } catch (err) {
      console.error(`fail in getContainerDimensions: ${err}`)
      return null
    }
  }
}

module.exports = Pictograph
