
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

  resize (newSpecifiedWidth, newSpecifiedHeight) {
    if (this.config.resizable === false) { return }

    this._recomputeSizing(newSpecifiedWidth, newSpecifiedHeight)

    // TODO test this flatten works
    // TODO cell Instance.resize must be mod to account for new config style
    _(this.conifg.cells).flatten().each(cellInstance =>
      cellInstance.resize(this.config.size))
  }

  _recomputeSizing (specifiedWidth, specifiedHeight) {
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

  setConfig (userConfig) {
    this.config.processUserConfig(userConfig)
  }

  getAllCellsInDimension(dimension, dimensionIndex) {
    if (dimension === 'row') {
      return this.getAllCellsInRow(dimensionIndex)
    } else if (dimension === 'column') {
      return this.getAllCellsInColumn(dimensionIndex)
    }
    throw new Error(`getAllCellsInDimension called with invalid dimension '${dimension}'`)
  }

  getAllCellsInColumn (columnIndex) {
    return _.range(this.config.gridInfo.dimensions.row).map((rowIndex) => {
      return this.getCell(rowIndex, columnIndex)
    })
  }

  getAllCellsInRow (rowIndex) {
    return this.config.cells[rowIndex]
  }

  getCell (rowIndex, columnIndex) {
    return this.config.cells[rowIndex][columnIndex]
  }

  // TODO must make lines work again
  _computeTableLinesLayout () {

    // const numGuttersAt = index => index
    // const table = this.config.table
    //
    // if (!table.lines) { table.lines = {} }
    // table.lines.horizontal = (table.lines.horizontal || []).sort()
    // table.lines.vertical = (table.lines.vertical || []).sort();
    //
    // ['padding-left', 'padding-right', 'padding-top', 'padding-bottom'].forEach(attr => this._verifyKeyIsInt(table.lines, attr, 0))
    //
    // const calcLineVariableDimension = function (linePosition, cellSizes, paddingSize) {
    //   const numCellsPast = Math.floor(linePosition)
    //   const fractionOfCell = linePosition - numCellsPast
    //   const sizeOfNumCellsPast = _.sum(_.slice(cellSizes, 0, numCellsPast))
    //
    //   let sizeOfGuttersPast = 0
    //   if (numCellsPast > 0 && numCellsPast < cellSizes.length) {
    //     sizeOfGuttersPast = (numGuttersAt(numCellsPast) * paddingSize) - (0.5 * paddingSize)
    //   } else if (numCellsPast > 0 && numCellsPast === cellSizes.length) {
    //     sizeOfGuttersPast = numGuttersAt(numCellsPast - 1) * paddingSize
    //   }
    //
    //   let sizeOfFraction = 0
    //   if (numCellsPast === 0) {
    //     sizeOfFraction = fractionOfCell * cellSizes[numCellsPast]
    //   } else if (numCellsPast < cellSizes.length) {
    //     sizeOfFraction = fractionOfCell * (cellSizes[numCellsPast] + paddingSize)
    //   }
    //
    //   return sizeOfNumCellsPast + sizeOfGuttersPast + sizeOfFraction
    // }
    //
    // const parseAndValidateLineIndex = function (lineType, lineIndexCandidate, maxLines) {
    //   const lineIndex = parseFloat(lineIndexCandidate)
    //   if (_.isNaN(lineIndex)) {
    //     throw new Error(`Invalid ${lineType} line position '${lineIndexCandidate}': must be numeric`)
    //   }
    //
    //   if (lineIndex > maxLines || lineIndex < 0) {
    //     throw new Error(`Cannot create line at '${lineIndex}': past end of table`)
    //   }
    //
    //   return lineIndex
    // }
    //
    // table.lines.horizontal = table.lines.horizontal.map((lineIndexCandidate) => {
    //   const lineIndex = parseAndValidateLineIndex('horizontal', lineIndexCandidate, this.config.gridInfo.dimensions.row)
    //
    //   const y = calcLineVariableDimension(lineIndex, this.config.gridInfo.sizes.row, this.config.size.gutter.row)
    //   return {
    //     position: lineIndex,
    //     x1: 0 + table.lines['padding-left'],
    //     x2: this.config.size.specified.width - table.lines['padding-right'],
    //     y1: y,
    //     y2: y,
    //     style: table.lines.style || 'stroke:black;stroke-width:2'
    //   }
    // })
    //
    // table.lines.vertical = table.lines.vertical.map((lineIndexCandidate) => {
    //   const lineIndex = parseAndValidateLineIndex('vertical', lineIndexCandidate, this.numTableCols)
    //
    //   const x = calcLineVariableDimension(lineIndex, this.config.gridInfo.sizes.column, this.config.size.gutter.row)
    //   return {
    //     position: lineIndex,
    //     x1: x,
    //     x2: x,
    //     y1: 0 + table.lines['padding-top'],
    //     y2: this.config.size.specified.height - table.lines['padding-bottom'],
    //     style: table.lines.style || 'stroke:black;stroke-width:2'
    //   }
    // })
  }

  _computeTableLayout () {
    const numGuttersAt = index => index

    const _computeCellSizes = () => {
      if (this.config.gridInfo.flexible.column || this.config.gridInfo.flexible.row) {
        // should I introduce the term 'vector' into the code : https://english.stackexchange.com/questions/132493/common-term-for-row-and-column

        const flexibleDimension = (this.config.gridInfo.flexible.column) ? 'column' : 'row'
        const fixedDimension = (flexibleDimension === 'column') ? 'row' : 'column'
        const flexibleSize = (flexibleDimension === 'column') ? 'width' : 'height'

        let totalRangeAvailable = this.config.size.specified[flexibleSize] - ((this.config.gridInfo.dimensions[flexibleDimension] - 1) * this.config.size.gutter[flexibleDimension])

        const sumFixedCellSize = this.config.gridInfo.sizes[flexibleDimension]
          .filter(cellSizeData => !cellSizeData.flexible)
          .map(cellSizeData => cellSizeData.min)

        totalRangeAvailable -= _.sum(sumFixedCellSize)

        // get promises for all flexible cells
        const flexibleIndexes = this.config.gridInfo.sizes[flexibleDimension].map((cellSizeData, index) => {
          if (cellSizeData.flexible) {
            return index
          }
          return null
        }).filter(indexOrNull => !_.isNull(indexOrNull))

        return Promise.all(flexibleIndexes.map(flexibleIndex => {
          const dimensionConstraintPromises = this.getAllCellsInDimension(flexibleDimension, flexibleIndex).map((cell) => {
            return cell.instance.getDimensionConstraints()
          })

          const cellSizeData = this.config.gridInfo.sizes[flexibleDimension][flexibleIndex]
          return Promise.all(dimensionConstraintPromises).then((dimensionConstraints) => {
            if (cellSizeData.shrink) {
              const maxOfMinSizes = Math.max.apply(null, _(dimensionConstraints).map(`${flexibleSize}.min`).value())
              cellSizeData.size = maxOfMinSizes
              totalRangeAvailable -= cellSizeData.size
            }

            if (cellSizeData.grow) {
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

    const _computeCellPlacement = () => {
      this.config.cells.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          cell.x = _.sum(_(this.config.gridInfo.sizes.column).slice(0, colIndex).map('size').value()) + (numGuttersAt(colIndex) * this.config.size.gutter.column)
          cell.y = _.sum(_(this.config.gridInfo.sizes.row).slice(0, rowIndex).map('size').value()) + (numGuttersAt(rowIndex) * this.config.size.gutter.row)
          cell.width = this.config.gridInfo.sizes.column[colIndex].size
          cell.height = this.config.gridInfo.sizes.row[rowIndex].size
        })
      })
      return Promise.resolve()
    }

    return Promise.resolve()
      .then(_computeCellSizes.bind(this))
      .then(_computeCellPlacement.bind(this))
  }

  draw () {
    this._manipulateRootElementSize()
    this._addRootSvgToRootElement()
    return this._redraw()
  }

  _redraw () {
    return Promise.resolve(this.config.cssCollector.draw())
      .then(this._computeTableLayout.bind(this))
      .then(this._computeTableLinesLayout.bind(this))
      .then(this._recomputeSizing.bind(this))
      .then(() => {
        const tableCells = _.flatten(this.config.cells)

        console.log(`config`)
        console.log(JSON.stringify(this.config, {}, 2))

        // const addLines = (lineType, data) => this.outerSvg.selectAll(`.${lineType}`)
        //   .data(data)
        //   .enter()
        //   .append('line')
        //     .attr('x1', d => d.x1)
        //     .attr('x2', d => d.x2)
        //     .attr('y1', d => d.y1)
        //     .attr('y2', d => d.y2)
        //     .attr('style', d => d.style)
        //     .attr('class', d => `line ${lineType} line-${d.position}`)
        //
        // if (this.config['background-color']) {
        //   this.outerSvg.append('svg:rect')
        //   .attr('class', 'background')
        //   .attr('width', this.config.size.specified.width)
        //   .attr('height', this.config.size.specified.height)
        //   .attr('fill', this.config['background-color'])
        // }
        //
        // addLines('horizontal-line', this.config.table.lines.horizontal)
        // addLines('vertical-line', this.config.table.lines.vertical)

        const enteringCells = this.outerSvg.selectAll('.table-cell')
          .data(tableCells)
          .enter()
          .append('g')
            .attr('class', 'table-cell')
            .attr('transform', d => `translate(${d.x},${d.y})`)

        const { size } = this.config
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
    return $(this.rootElement).width(this.config.size.specified.width).height(this.config.size.specified.height)
  }

  _addRootSvgToRootElement () {
    $(this.rootElement).find('*').remove()

    const anonSvg = $('<svg class="rhtmlwidget-outer-svg">')
      .addClass(this.config.id)
      .attr('id', this.config.id)
    // .attr('width', '100%')
    // .attr('height', '100%')

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
