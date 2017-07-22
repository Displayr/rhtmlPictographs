
import _ from 'lodash'
import d3 from 'd3'
import $ from 'jquery'
import PictographConfig from './PictographConfig'

class Pictograph {
  constructor (el, width, height) {
    this.config = new PictographConfig()
    this.config.setWidth(width)
    this.config.setHeight(height)
    this.rootElement = _.has(el, 'length') ? el[0] : el
  }

  setConfig (userConfig) {
    this.config.processUserConfig(userConfig)
  }

  draw () {
    this.config.cssCollector.draw()
    this._removeAllContentFromRootElement()
    this._manipulateRootElementSize()
    this._addSvgToRootElement()

    return Promise.resolve()
      .then(this._computeCellSizes.bind(this))
      .then(this._computeCellPlacement.bind(this))
      .then(this._recomputeSizing.bind(this))
      .then(this._render.bind(this))
      .catch((error) => {
        console.error(`error in pictograph draw: ${error.message}`)
        console.error(error.stack)
        throw error
      })
  }

  resize (specifiedWidth, specifiedHeight) {
    if (this.config.resizable === false) { return }

    if (this.config.gridInfo.flexible.row || this.config.gridInfo.flexible.column) {
      this.config.resetSizing({ specifiedWidth, specifiedHeight })
      this.config._processGridWidthSpec()
      this.config._processGridHeightSpec()

      this._removeAllContentFromRootElement()
      this._addSvgToRootElement()

      return Promise.resolve()
        .then(this._computeCellSizes.bind(this))
        .then(this._computeCellPlacement.bind(this))
        .then(this._render.bind(this))
        .catch((error) => {
          console.error(`error in pictograph resize: ${error.message}`)
          console.error(error.stack)
          throw error
        })

    // TODO deprecate this alternate form of resizing if the new method is proven stable
    } else {
      this._recomputeSizing({ specifiedWidth, specifiedHeight })
      _(this.config.cells).flatten().each(cellData => {
        cellData.instance.resize(this.config.size)
      })
    }
  }

  _recomputeSizing ({ specifiedWidth, specifiedHeight } = {}) {
    // TODO can I use this.outerSvg here instead ?
    const rootElement = $(`#${this.config.id}`)
    const actualWidth = rootElement.width()
    const actualHeight = rootElement.height()
    return this.config.recomputeSizing({
      actualWidth,
      actualHeight,
      specifiedWidth,
      specifiedHeight
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
        style: this.config.lines.style || 'stroke:black;stroke-width:2'
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
        style: this.config.lines.style || 'stroke:black;stroke-width:2'
      }
    })

    return _.flatten([computedHorizontalLines, computedVerticalLines])
  }

  _computeCellSizes () {
    if (this.config.gridInfo.flexible.column || this.config.gridInfo.flexible.row) {
      // should I introduce the term 'vector' into the code ? (https://english.stackexchange.com/questions/132493/common-term-for-row-and-column)

      const flexibleDimension = (this.config.gridInfo.flexible.column) ? 'column' : 'row'
      const fixedDimension = (flexibleDimension === 'column') ? 'row' : 'column'
      const flexibleSize = (flexibleDimension === 'column') ? 'width' : 'height'

      let totalRangeAvailable = this.config.size.specified[flexibleSize] - ((this.config.gridInfo.dimensions[flexibleDimension] - 1) * this.config.size.gutter[flexibleDimension])

      const sumFixedCellSize = _(this.config.gridInfo.sizes[flexibleDimension])
        .filter(cellSizeData => !cellSizeData.flexible)
        .map('size')
        .sum()

      totalRangeAvailable -= sumFixedCellSize

      // get promises for all flexible cells
      const flexibleCellIndexes = this.config.gridInfo.sizes[flexibleDimension].map((cellSizeData, index) => {
        if (cellSizeData.flexible) {
          return index
        }
        return null
      }).filter(indexOrNull => !_.isNull(indexOrNull))

      return Promise.all(flexibleCellIndexes.map(flexibleIndex => {
        const dimensionConstraintPromises = this._getAllCellsInDimension(flexibleDimension, flexibleIndex).map((cell) => {
          return cell.instance.getDimensionConstraints()
        })

        const cellSizeData = this.config.gridInfo.sizes[flexibleDimension][flexibleIndex]
        return Promise.all(dimensionConstraintPromises).then((dimensionConstraints) => {
          if (cellSizeData.type === 'label') {
            const maxOfMinSizes = Math.max.apply(null, _(dimensionConstraints).map(`${flexibleSize}.min`).value())
            cellSizeData.size = maxOfMinSizes
            totalRangeAvailable -= cellSizeData.size
          }

          if (cellSizeData.type === 'graphic') {
            dimensionConstraints.map((dimensionContraint, dimensionIndex) => {
              const aspectRatioMultiplier = (flexibleDimension === 'column') ? dimensionContraint.aspectRatio : (1.0 / dimensionContraint.aspectRatio)
              dimensionContraint[flexibleSize].min = this.config.gridInfo.sizes[fixedDimension][dimensionIndex].min * aspectRatioMultiplier
              dimensionContraint[flexibleSize].max = this.config.gridInfo.sizes[fixedDimension][dimensionIndex].max * aspectRatioMultiplier
            })

            const minOfMaxSizes = Math.min.apply(null, _(dimensionConstraints).map(`${flexibleSize}.max`).value())
            cellSizeData.size = Math.min(minOfMaxSizes, totalRangeAvailable)
            totalRangeAvailable -= cellSizeData.size
          }
        })
      }))
    } else {
      return Promise.resolve()
    }
  }

  _computeCellPlacement () {
    const numberOfGuttersAtIndex = (index) => { return index }
    const pictographOffsets = this._computePictographOffsets()

    this.config.cells.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        cell.x = pictographOffsets.x + _.sum(_(this.config.gridInfo.sizes.column).slice(0, colIndex).map('size').value()) + (numberOfGuttersAtIndex(colIndex) * this.config.size.gutter.column)
        cell.y = pictographOffsets.y + _.sum(_(this.config.gridInfo.sizes.row).slice(0, rowIndex).map('size').value()) + (numberOfGuttersAtIndex(rowIndex) * this.config.size.gutter.row)
        cell.width = this.config.gridInfo.sizes.column[colIndex].size
        cell.height = this.config.gridInfo.sizes.row[rowIndex].size
      })
    })
    return Promise.resolve()
  }

  _computePictographOffsets () {
    let offsets = {
      x: null,
      y: null
    }

    const freeXSpace = (this.config.size.specified.width - this.config.totalAllocatedHorizontalSpace)
    if (this.config.alignment.horizontal === 'left') {
      offsets.x = 0
    } else if (this.config.alignment.horizontal === 'center') {
      offsets.x = freeXSpace / 2
    } else if (this.config.alignment.horizontal === 'right') {
      offsets.x = freeXSpace
    } else {
      throw new Error(`(should not get here) : Invalid horizontal alignment '${this.config.alignment.horizontal}'`)
    }

    const freeYSpace = (this.config.size.specified.height - this.config.totalAllocatedVerticalSpace)
    if (this.config.alignment.vertical === 'top') {
      offsets.y = 0
    } else if (this.config.alignment.vertical === 'center') {
      offsets.y = freeYSpace / 2
    } else if (this.config.alignment.vertical === 'bottom') {
      offsets.y = freeYSpace
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
        .attr('width', this.config.size.specified.width)
        .attr('height', this.config.size.specified.height)
        .attr('fill', this.config['background-color'])
    }

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

    const {size} = this.config
    enteringCells.each(function (d) {
      const instance = d.instance

      d3.select(this).classed(`table-cell-${d.row}-${d.column}`, true)
      d3.select(this).classed(d.type, true)

      instance.setParentSvg(d3.select(this))
      instance.setWidth(d.width)
      instance.setHeight(d.height)
      instance.setPictographSizeInfo(size)
      instance.draw()
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

  _removeAllContentFromRootElement () {
    $(this.rootElement).find('*').remove()
  }

  _manipulateRootElementSize () {
    // root element has width and height in a style tag. Clear that
    $(this.rootElement).attr('style', '')

    if (this.config.resizable) {
      return $(this.rootElement).width('100%').height('100%')
    }
    return $(this.rootElement).width(this.config.size.specified.width).height(this.config.size.specified.height)
  }

  _addSvgToRootElement () {
    const anonSvg = $('<svg class="rhtmlwidget-outer-svg">')
      .addClass(this.config.id)
      .attr('id', this.config.id)

    $(this.rootElement).append(anonSvg)

    this.outerSvg = d3.select(anonSvg[0])

    // NB JQuery insists on lowercasing attributes, so we must use JS directly
    // when setting viewBox and preserveAspectRatio ?!
    document.getElementsByClassName(`${this.config.id} rhtmlwidget-outer-svg`)[0]
      .setAttribute('viewBox', `0 0 ${this.config.size.specified.width} ${this.config.size.specified.height}`)
    if (this.config.preserveAspectRatio != null) {
      document.getElementsByClassName(`${this.config.id} rhtmlwidget-outer-svg`)[0]
        .setAttribute('preserveAspectRatio', this.config.preserveAspectRatio)
    }

    return null
  }
}

module.exports = Pictograph
