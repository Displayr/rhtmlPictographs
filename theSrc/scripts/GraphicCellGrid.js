
import d3 from 'd3';
import _ from 'lodash';

class GraphicCellGrid {

  static validInputDirections() {
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
      'up,left',
    ];
  }

  static get validHorizontalDirections() {
    return ['right', 'left'];
  }
  static get validVerticalDirections() {
    return ['up', 'down'];
  }

  static _isValidInternalDirection(value) {
    const validHorizontalDirection = GraphicCellGrid.validHorizontalDirections.includes(value);
    const validVerticalDirection = GraphicCellGrid.validVerticalDirections.includes(value);
    return validHorizontalDirection || validVerticalDirection;
  }

  static get _defaultHorizontalDirection() {
    return 'right';
  }
  static get _defaultVerticalDirection() {
    return 'down';
  }

  constructor() {
    this.xFactory = d3.scale.ordinal();
    this.yFactory = d3.scale.ordinal();
    this.primaryDirection(GraphicCellGrid._defaultHorizontalDirection);
    this.secondaryDirection(GraphicCellGrid._defaultVerticalDirection);

    this.numRows = 0;
    this.numCols = 0;
    this.rowsSpecified = false;
    this.colsSpecified = false;
    this.containerSize([1, 1]);
    this._nodeSize = [1, 1];

    this.padding([0, 0]);
    this.bands(false);
  }

  compute(newNodes) {
    this.nodes = newNodes;
    this._calcGridDimensions();
    this._calcNodeSize();
    return this._distribute();
  }

  _calcGridDimensions() {
    if (this.rowsSpecified && !this.colsSpecified) {
      this.numCols = Math.ceil(this.nodes.length / this.numRows);
    } else {
      if (!this.colsSpecified) {
        this.numCols = Math.ceil(Math.sqrt(this.nodes.length));
      }
      if (!this.rowsSpecified) {
        this.numRows = Math.ceil(this.nodes.length / this.numCols);
      }
    }
  }

  _calcNodeSize() {
    if (this._bands) {
      this.xFactory.domain(_.range(this.numCols)).rangeBands([0, this._containerWidth()], this._padding[0], 0);
      this.yFactory.domain(_.range(this.numRows)).rangeBands([0, this._containerHeight()], this._padding[1], 0);
      this._nodeSize[0] = this.xFactory.rangeBand();
      this._nodeSize[1] = this.yFactory.rangeBand();
    } else {
      this.xFactory.domain(_.range(this.numCols)).rangePoints([0, this._containerWidth()]);
      this.yFactory.domain(_.range(this.numRows)).rangePoints([0, this._containerHeight()]);
      this._nodeSize[0] = this.xFactory(1);
      this._nodeSize[1] = this.yFactory(1);
    }
  }

  _distribute() {
    const lastColumn = this.numCols - 1;
    const lastRow = this.numRows - 1;

    const initializeNextVacantSpot = function (primaryDirection, secondaryDirection) {
      const nextVacantSpot = {
        row: null,
        col: null,
        rowOrder: 0,
        colOrder: 0,
      };

      [primaryDirection, secondaryDirection].forEach((direction) => {
        switch (direction) {
          case 'right':
            nextVacantSpot.col = 0;
            break;
          case 'left':
            nextVacantSpot.col = lastColumn;
            break;
          case 'down':
            nextVacantSpot.row = 0;
            break;
          case 'up':
            nextVacantSpot.row = lastRow;
            break;
          default:
            throw new Error(`Unexpected direction: '${direction}'`);
        }
      });

      return nextVacantSpot;
    };

    const nextVacantSpot = initializeNextVacantSpot(this.primaryDirection(), this.secondaryDirection());

    const advanceRow = function (increment) {
      nextVacantSpot.rowOrder += 1;
      nextVacantSpot.row += increment;
    };
    const resetRow = function (resetValue) {
      nextVacantSpot.rowOrder = 0;
      nextVacantSpot.row = resetValue;
    };
    const advanceCol = function (increment) {
      nextVacantSpot.colOrder += 1;
      nextVacantSpot.col += increment;
    };
    const resetCol = function (resetValue) {
      nextVacantSpot.colOrder = 0;
      nextVacantSpot.col = resetValue;
    };


    let i = -1;
    while (++i < this.nodes.length) {
      this.nodes[i].x = this.xFactory(nextVacantSpot.col);
      this.nodes[i].y = this.yFactory(nextVacantSpot.row);
      this.nodes[i].col = nextVacantSpot.col;
      this.nodes[i].row = nextVacantSpot.row;
      this.nodes[i].rowOrder = nextVacantSpot.rowOrder;
      this.nodes[i].colOrder = nextVacantSpot.colOrder;
      switch (this.primaryDirection()) {
        case 'right':
          if (nextVacantSpot.col < lastColumn) {
            advanceCol(1);
          } else {
            resetCol(0);
            advanceRow(this.secondaryDirection() === 'down' ? 1 : -1);
          }
          break;
        case 'left':
          if (nextVacantSpot.col > 0) {
            advanceCol(-1);
          } else {
            resetCol(lastColumn);
            advanceRow(this.secondaryDirection() === 'down' ? 1 : -1);
          }
          break;
        case 'down':
          if (nextVacantSpot.row < lastRow) {
            advanceRow(1);
          } else {
            resetRow(0);
            advanceCol(this.secondaryDirection() === 'right' ? 1 : -1);
          }
          break;
        case 'up':
          if (nextVacantSpot.row > 0) {
            advanceRow(-1);
          } else {
            resetRow(lastRow);
            advanceCol(this.secondaryDirection() === 'right' ? 1 : -1);
          }
          break;
        default:
          throw new Error(`Unexpected direction: '${this.primaryDirection()}'`);
      }
    }
    return this.nodes;
  }

  rows(value) {
    if (this.colsSpecified) {
      throw new Error('Cannot specify both rows and cols');
    }
    this.rowsSpecified = true;
    this.numRows = value;
    return this;
  }

  cols(value) {
    if (this.rowsSpecified) {
      throw new Error('Cannot specify both rows and cols');
    }
    this.colsSpecified = true;
    this.numCols = value;
    return this;
  }

  bands() {
    this._bands = true;
    return this;
  }

  points() {
    this._bands = false;
    return this;
  }

  containerSize(newSize) {
    this._containerSize = newSize;
    return this;
  }

  _containerWidth() {
    return this._containerSize[0];
  }

  _containerHeight() {
    return this._containerSize[1];
  }


  padding(value) {
    this._padding = value;
    return this;
  }

  nodeSize() {
    return this._nodeSize;
  }

  direction(value) {
    if (arguments.length === 0) {
      return `${this.primaryDirection()},${this.secondaryDirection()}`;
    }

    const directions = value.split(',');
    const singleDirectionProvided = directions.length === 1;

    this.primaryDirection(directions[0]);

    if (singleDirectionProvided) {
      if (GraphicCellGrid.validHorizontalDirections.includes(this.primaryDirection())) {
        this.secondaryDirection(GraphicCellGrid._defaultVerticalDirection);
      } else {
        this.secondaryDirection(GraphicCellGrid._defaultHorizontalDirection);
      }
    } else {
      this.secondaryDirection(directions[1]);
    }

    return this;
  }

  primaryDirection(value) {
    if (!value) {
      return this._primaryDirection;
    }
    if (!GraphicCellGrid._isValidInternalDirection(value)) {
      throw new Error(`Invalid primary direction ${value}`);
    }
    this._primaryDirection = value;
    return this;
  }

  secondaryDirection(value) {
    if (!value) {
      return this._secondaryDirection;
    }
    if (!GraphicCellGrid._isValidInternalDirection(value)) {
      throw new Error(`Invalid secondary direction ${value}`);
    }
    this._secondaryDirection = value;
    return this;
  }
}

module.exports = GraphicCellGrid;
