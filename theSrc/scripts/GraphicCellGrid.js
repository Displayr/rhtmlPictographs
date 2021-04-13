
const _ = require('lodash')

class GraphicCellGrid {
  static validInputDirections () {
    return [
      'right',
      'right,down',
      'right,up',
      'left',
      'left,down',
      'left,up',
      'down',
      'down,right',
      'down,left',
      'up',
      'up,right',
      'up,left'
    ]
  }

  static get validHorizontalDirections () {
    return ['right', 'left']
  }
  static get validVerticalDirections () {
    return ['up', 'down']
  }

  static _isValidInternalDirection (value) {
    const validHorizontalDirection = GraphicCellGrid.validHorizontalDirections.includes(value)
    const validVerticalDirection = GraphicCellGrid.validVerticalDirections.includes(value)
    return validHorizontalDirection || validVerticalDirection
  }

  static get _defaultHorizontalDirection () {
    return 'right'
  }
  static get _defaultVerticalDirection () {
    return 'down'
  }

  constructor () {
    this.primaryDirection(GraphicCellGrid._defaultHorizontalDirection)
    this.secondaryDirection(GraphicCellGrid._defaultVerticalDirection)

    this.numRows = 0
    this.numCols = 0
    this._numNodes = 0
    this.rowsSpecified = false
    this.colsSpecified = false
    this.containerWidth(1)
    this.containerHeight(1)
    this.rowGutter(0)
    this.columnGutter(0)
  }

  compute (newNodes) {
    this.nodes = newNodes
    this.numNodes(this.nodes.length)
    this._calcGridDimensions()
    this._calcNodeSize()
    return this._distribute()
  }

  _calcGridDimensions () {
    if (this.rowsSpecified && this.colsSpecified) {
      if ((this._rows() * this._cols()) !== this.numNodes()) {
        const errorMath = `${this._rows()} * ${this._cols()} !== ${this.numNodes()}`
        throw new Error(`rows * cols must equal node length if both rows and cols are specified: ${errorMath}`)
      }
      return
    }

    if (this.rowsSpecified) {
      this._cols(Math.ceil(this.numNodes() / this._rows()))
      return
    }

    if (this.colsSpecified) {
      this._rows(Math.ceil(this.numNodes() / this._cols()))
      return
    }

    this._cols(Math.ceil(Math.sqrt(this.numNodes())))
    this._rows(Math.ceil(this.numNodes() / this._cols()))
  }

  _calcNodeSize () {
    this.scale = {
      x: this._computeScale(this.containerWidth(), this._cols(), this.columnGutter()),
      y: this._computeScale(this.containerHeight(), this._rows(), this.rowGutter())
    }
  }

  // NB div by zero on gutterAllocation === 1 is avoided by validation rules in this.rowGutter() and this.columnGutter()
  _computeScale (totalSize, numElements, gutterAllocation) {
    const numGutters = numElements - 1
    const gutterToColRatio = gutterAllocation / (1 - gutterAllocation)
    const nodeSize = totalSize / (numElements + (numGutters * gutterToColRatio))
    const gutterSize = nodeSize * gutterToColRatio
    return { nodeSize, gutterSize }
  }

  getTopLeftCoordOfImageSlot (rowNumber, colNumber) {
    // adjust to get top left coord of slot not right (due to mirroring in _getRangeFromDomain)
    const adjustedColumnNumber = (columnNumber) => {
      if (this.isRightToLeft()) {
        return columnNumber + 0.99999999
      }
      return columnNumber
    }

    // adjust to get top coord of slot not bottom (due to mirroring in _getRangeFromDomain)
    const adjustedRowNumber = (rowNumber) => {
      if (this.isBottomToTop()) {
        return rowNumber + 0.99999999
      }
      return rowNumber
    }

    return {
      x: this.getX(adjustedColumnNumber(colNumber)),
      y: this.getY(adjustedRowNumber(rowNumber))
    }
  }

  getX (position) {
    if (this.isRightToLeft()) {
      let x = this._getRangeFromDomain(position, this.scale.x.nodeSize, this.scale.x.gutterSize)
      return this.containerWidth() - x
    }
    return this._getRangeFromDomain(position, this.scale.x.nodeSize, this.scale.x.gutterSize)
  }

  getGutterX (position) {
    if ([this.primaryDirection(), this.secondaryDirection()].includes('left')) {
      let x = this._getGutterRangeFromDomain(position, this.scale.x.nodeSize, this.scale.x.gutterSize)
      return this.containerWidth() - x
    }
    return this._getGutterRangeFromDomain(position, this.scale.x.nodeSize, this.scale.x.gutterSize)
  }

  getY (position) {
    if (this.isBottomToTop()) {
      let y = this._getRangeFromDomain(position, this.scale.y.nodeSize, this.scale.y.gutterSize)
      return this.containerHeight() - y
    }
    return this._getRangeFromDomain(position, this.scale.y.nodeSize, this.scale.y.gutterSize)
  }

  getGutterY (position) {
    if ([this.primaryDirection(), this.secondaryDirection()].includes('up')) {
      let y = this._getGutterRangeFromDomain(position, this.scale.y.nodeSize, this.scale.y.gutterSize)
      return this.containerHeight() - y
    }
    return this._getGutterRangeFromDomain(position, this.scale.y.nodeSize, this.scale.y.gutterSize)
  }

  _getRangeFromDomain (position, nodeSize, gutterSize) {
    const seperate = function (position) {
      const whole = (position > 0) ? Math.floor(position) : Math.ceil(position)
      const fraction = parseFloat(position) - whole
      return { whole, fraction }
    }

    const { whole, fraction } = seperate(position)
    const x = whole * nodeSize + whole * gutterSize + fraction * nodeSize
    return x
  }

  _getGutterRangeFromDomain (position, nodeSize, gutterSize) {
    const seperate = function (position) {
      const whole = (position > 0) ? Math.floor(position) : Math.ceil(position)
      const fraction = parseFloat(position) - whole
      return { whole, fraction }
    }

    if (position < 1) {
      throw new Error(`Invalid gutter position '${position}: must be >= 1`)
    }

    // TODO test for greater than number gutter ?

    const { whole, fraction } = seperate(position)
    const x = whole * nodeSize + (whole - 1) * gutterSize + fraction * gutterSize
    return x
  }

  _distribute () {
    const lastColumn = this.numCols - 1
    const lastRow = this.numRows - 1

    const nextVacantSpot = {
      row: 0,
      col: 0,
      rowOrder: 0,
      colOrder: 0
    }

    const advanceRow = function (increment = 1) {
      nextVacantSpot.rowOrder += 1
      nextVacantSpot.row += increment
    }
    const resetRow = function (resetValue = 0) {
      nextVacantSpot.rowOrder = 0
      nextVacantSpot.row = resetValue
    }
    const advanceCol = function (increment = 1) {
      nextVacantSpot.colOrder += 1
      nextVacantSpot.col += increment
    }
    const resetCol = function (resetValue = 0) {
      nextVacantSpot.colOrder = 0
      nextVacantSpot.col = resetValue
    }

    let i = -1
    while (++i < this.nodes.length) {
      const topLeftCoords = this.getTopLeftCoordOfImageSlot(nextVacantSpot.row, nextVacantSpot.col)
      _.merge(this.nodes[i], topLeftCoords)
      this.nodes[i].rowOrder = nextVacantSpot.rowOrder
      this.nodes[i].colOrder = nextVacantSpot.colOrder
      if (this._primaryIsHorizontal) {
        if (nextVacantSpot.col < lastColumn) {
          advanceCol()
        } else {
          resetCol()
          advanceRow()
        }
      } else {
        if (nextVacantSpot.row < lastRow) {
          advanceRow()
        } else {
          resetRow()
          advanceCol()
        }
      }
    }
    return this.nodes
  }

  rows (value) {
    if (value) { this.rowsSpecified = true }
    return this._rows(value)
  }

  _rows (value) {
    if (_.isUndefined(value)) {
      return this.numRows
    }
    const parsedValue = parseInt(value)
    if (_.isNaN(parsedValue)) {
      throw new Error(`Invalid numRows '${value}': not a valid int`)
    }
    this.numRows = parsedValue
    return this
  }

  _cols (value) {
    if (_.isUndefined(value)) {
      return this.numCols
    }
    const parsedValue = parseInt(value)
    if (_.isNaN(parsedValue)) {
      throw new Error(`Invalid numCols '${value}': not a valid int`)
    }
    this.numCols = parsedValue
    return this
  }

  cols (value) {
    if (value) { this.colsSpecified = true }
    return this._cols(value)
  }

  numNodes (value) {
    if (_.isUndefined(value)) {
      return this._numNodes
    }
    const parsedValue = parseInt(value)
    if (_.isNaN(parsedValue)) {
      throw new Error(`Invalid numNodes '${value}': not a valid int`)
    }
    this._numNodes = parsedValue
    return this
  }

  containerWidth (value) {
    if (_.isUndefined(value)) {
      return this._containerWidth
    }
    const newWidth = parseFloat(value)
    if (_.isNaN(newWidth)) {
      throw new Error(`Invalid containerWidth '${value}': not a valid float`)
    }
    this._containerWidth = newWidth
    return this
  }

  containerHeight (value) {
    if (_.isUndefined(value)) {
      return this._containerHeight
    }
    const newHeight = parseFloat(value)
    if (_.isNaN(newHeight)) {
      throw new Error(`Invalid containerHeight '${value}': not a valid float`)
    }
    this._containerHeight = newHeight
    return this
  }

  rowGutter (value) {
    if (_.isUndefined(value)) {
      return this._rowGutter
    }
    const parsedValue = parseFloat(value)
    if (_.isNaN(parsedValue)) {
      throw new Error(`Invalid rowGutter '${value}': not a valid float`)
    }
    if (parsedValue < 0 || parsedValue >= 1) {
      throw new Error(`Invalid rowGutter '${value}': must be >= 0 and < 1`)
    }

    this._rowGutter = parsedValue
    return this
  }

  columnGutter (value) {
    if (_.isUndefined(value)) {
      return this._columnGutter
    }
    const parsedValue = parseFloat(value)
    if (_.isNaN(parsedValue)) {
      throw new Error(`Invalid columnGutter '${value}': not a valid float`)
    }
    if (parsedValue < 0 || parsedValue >= 1) {
      throw new Error(`Invalid columnGutter '${value}': must be >= 0 and < 1`)
    }

    this._columnGutter = parsedValue
    return this
  }

  // NB you cannot externally set nodeWidth/nodeHeight as it is computed
  nodeWidth () {
    return this.scale.x.nodeSize
  }

  // NB you cannot externally set nodeWidth/nodeHeight as it is computed
  nodeHeight () {
    return this.scale.y.nodeSize
  }

  direction (value) {
    if (arguments.length === 0) {
      return `${this.primaryDirection()},${this.secondaryDirection()}`
    }

    const directions = value.split(',')
    const singleDirectionProvided = directions.length === 1

    this.primaryDirection(directions[0])

    if (singleDirectionProvided) {
      if (GraphicCellGrid.validHorizontalDirections.includes(this.primaryDirection())) {
        this.secondaryDirection(GraphicCellGrid._defaultVerticalDirection)
      } else {
        this.secondaryDirection(GraphicCellGrid._defaultHorizontalDirection)
      }
    } else {
      this.secondaryDirection(directions[1])
    }

    return this
  }

  primaryDirection (value) {
    if (!value) {
      return this._primaryDirection
    }
    if (!GraphicCellGrid._isValidInternalDirection(value)) {
      throw new Error(`Invalid primary direction ${value}`)
    }
    this._primaryDirection = value
    this._primaryIsHorizontal = GraphicCellGrid.validHorizontalDirections.includes(value)

    return this
  }

  secondaryDirection (value) {
    if (!value) {
      return this._secondaryDirection
    }
    if (!GraphicCellGrid._isValidInternalDirection(value)) {
      throw new Error(`Invalid secondary direction ${value}`)
    }
    this._secondaryDirection = value
    return this
  }

  isRightToLeft () {
    return ([this._primaryDirection, this._secondaryDirection].includes('left'))
  }

  isBottomToTop () {
    return ([this._primaryDirection, this._secondaryDirection].includes('up'))
  }
}

module.exports = GraphicCellGrid
