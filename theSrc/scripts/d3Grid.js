
import d3 from 'd3';

let DEBUG,
  indexOf = [].indexOf || function (item) { for (let i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

DEBUG = false;

d3.layout.grid = function () {
  let actualSize,
    bands,
    calcActualSize,
    calcGridDimensions,
    defaultHorizontalDirection,
    defaultVerticalDirection,
    desiredCols,
    desiredRows,
    distribute,
    grid,
    nodeSize,
    numCols,
    numRows,
    padding,
    primaryDirection,
    secondaryDirection,
    size,
    validHorizontalDirections,
    validVerticalDirections,
    x,
    y;
  x = d3.scale.ordinal();
  y = d3.scale.ordinal();
  size = [1, 1];
  nodeSize = false;
  actualSize = [0, 0];
  validHorizontalDirections = ['right', 'left'];
  validVerticalDirections = ['up', 'down'];
  defaultHorizontalDirection = 'right';
  defaultVerticalDirection = 'down';
  primaryDirection = defaultHorizontalDirection;
  secondaryDirection = defaultVerticalDirection;
  padding = [0, 0];
  bands = false;
  desiredCols = null;
  desiredRows = null;
  numCols = null;
  numRows = null;
  grid = function (nodes) {
    numCols = desiredCols != null ? desiredCols : 0;
    numRows = desiredRows != null ? desiredRows : 0;
    calcGridDimensions(nodes);
    calcActualSize(nodes);
    if (DEBUG) {
      console.log('specified cols/rows', desiredCols, desiredRows);
      console.log('computed cols/rows', numCols, numRows);
    }
    return distribute(nodes);
  };
  calcGridDimensions = function (nodes) {
    if (numRows && !numCols) {
      return numCols = Math.ceil(nodes.length / numRows);
    } else {
      if (!numCols) {
        numCols = Math.ceil(Math.sqrt(nodes.length));
      }
      if (!numRows) {
        return numRows = Math.ceil(nodes.length / numCols);
      }
    }
  };
  calcActualSize = function (nodes) {
    if (nodeSize) {
      x.domain(d3.range(numCols)).range(d3.range(0, (size[0] + padding[0]) * numCols, size[0] + padding[0]));
      y.domain(d3.range(numRows)).range(d3.range(0, (size[1] + padding[1]) * numRows, size[1] + padding[1]));
      actualSize[0] = bands ? x(numCols - 1) + size[0] : x(numCols - 1);
      return actualSize[1] = bands ? y(numRows - 1) + size[1] : y(numRows - 1);
    } else if (bands) {
      x.domain(d3.range(numCols)).rangeBands([0, size[0]], padding[0], 0);
      y.domain(d3.range(numRows)).rangeBands([0, size[1]], padding[1], 0);
      actualSize[0] = x.rangeBand();
      return actualSize[1] = y.rangeBand();
    } else {
      x.domain(d3.range(numCols)).rangePoints([0, size[0]]);
      y.domain(d3.range(numRows)).rangePoints([0, size[1]]);
      actualSize[0] = x(1);
      return actualSize[1] = y(1);
    }
  };
  distribute = function (nodes) {
    let advanceCol,
      advanceRow,
      direction,
      i,
      j,
      lastColumn,
      lastRow,
      len,
      nextVacantSpot,
      p,
      ref,
      resetCol,
      resetRow,
      s;
    p = primaryDirection;
    s = secondaryDirection;
    lastColumn = numCols - 1;
    lastRow = numRows - 1;
    nextVacantSpot = {
      row: null,
      col: null,
      rowOrder: 0,
      colOrder: 0,
    };
    ref = [p, s];
    for (j = 0, len = ref.length; j < len; j++) {
      direction = ref[j];
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
      }
    }
    advanceRow = function (increment) {
      nextVacantSpot.rowOrder += 1;
      return nextVacantSpot.row += increment;
    };
    resetRow = function (resetValue) {
      nextVacantSpot.rowOrder = 0;
      return nextVacantSpot.row = resetValue;
    };
    advanceCol = function (increment) {
      nextVacantSpot.colOrder += 1;
      return nextVacantSpot.col += increment;
    };
    resetCol = function (resetValue) {
      nextVacantSpot.colOrder = 0;
      return nextVacantSpot.col = resetValue;
    };
    i = -1;
    while (++i < nodes.length) {
      nodes[i].x = x(nextVacantSpot.col);
      nodes[i].y = y(nextVacantSpot.row);
      nodes[i].col = nextVacantSpot.col;
      nodes[i].row = nextVacantSpot.row;
      nodes[i].rowOrder = nextVacantSpot.rowOrder;
      nodes[i].colOrder = nextVacantSpot.colOrder;
      switch (p) {
        case 'right':
          if (nextVacantSpot.col < lastColumn) {
            advanceCol(1);
          } else {
            resetCol(0);
            advanceRow(s === 'down' ? 1 : -1);
          }
          break;
        case 'left':
          if (nextVacantSpot.col > 0) {
            advanceCol(-1);
          } else {
            resetCol(lastColumn);
            advanceRow(s === 'down' ? 1 : -1);
          }
          break;
        case 'down':
          if (nextVacantSpot.row < lastRow) {
            advanceRow(1);
          } else {
            resetRow(0);
            advanceCol(s === 'right' ? 1 : -1);
          }
          break;
        case 'up':
          if (nextVacantSpot.row > 0) {
            advanceRow(-1);
          } else {
            resetRow(lastRow);
            advanceCol(s === 'right' ? 1 : -1);
          }
      }
    }
    return nodes;
  };
  grid.size = function (value) {
    if (!arguments.length) {
      if (nodeSize) {
        return actualSize;
      } else {
        return size;
      }
    }
    actualSize = [0, 0];
    nodeSize = (size = value) === null;
    return grid;
  };
  grid.nodeSize = function (value) {
    if (!arguments.length) {
      if (nodeSize) {
        return size;
      } else {
        return actualSize;
      }
    }
    actualSize = [0, 0];
    nodeSize = (size = value) !== null;
    return grid;
  };
  grid.rows = function (value) {
    if (!arguments.length) {
      return desiredRows;
    }
    if (desiredCols) {
      throw new Error('Cannot specify both rows and cols');
    }
    desiredRows = value;
    return grid;
  };
  grid.cols = function (value) {
    if (!arguments.length) {
      return desiredCols;
    }
    if (desiredRows) {
      throw new Error('Cannot specify both rows and cols');
    }
    desiredCols = value;
    return grid;
  };
  grid.bands = function () {
    bands = true;
    return grid;
  };
  grid.points = function () {
    bands = false;
    return grid;
  };
  grid.padding = function (value) {
    if (!arguments.length) {
      return padding;
    }
    padding = value;
    return grid;
  };
  grid.direction = function (value) {
    let directions,
      singleDirectionProvided;
    if (arguments.length === 0) {
      return `${primaryDirection},${secondaryDirection}`;
    }
    directions = value.split(',');
    primaryDirection = directions[0];
    secondaryDirection = directions[1];
    singleDirectionProvided = directions.length === 1;
    if (indexOf.call(validHorizontalDirections, primaryDirection) >= 0) {
      if (singleDirectionProvided) {
        secondaryDirection = defaultVerticalDirection;
      }
    } else if (indexOf.call(validVerticalDirections, primaryDirection) >= 0) {
      if (singleDirectionProvided) {
        secondaryDirection = defaultHorizontalDirection;
      }
    } else {
      throw new Error(`invalid primaryDirection: ${primaryDirection}`);
    }
    if (!((indexOf.call(validHorizontalDirections, secondaryDirection) >= 0) || (indexOf.call(validVerticalDirections, secondaryDirection) >= 0))) {
      throw new Error(`invalid secondaryDirection: ${secondaryDirection}`);
    }
    return grid;
  };
  grid.primaryDirection = function (value) {
    if (!arguments.length) {
      return primaryDirection;
    }
    if (!((indexOf.call(validHorizontalDirections, value) >= 0) || (indexOf.call(validVerticalDirections, value) >= 0))) {
      throw new Error(`Invalid primary direction ${value}`);
    }
    primaryDirection = value;
    return grid;
  };
  grid.secondaryDirection = function (value) {
    if (!arguments.length) {
      return secondaryDirection;
    }
    if (!((indexOf.call(validHorizontalDirections, value) >= 0) || (indexOf.call(validVerticalDirections, value) >= 0))) {
      throw new Error(`Invalid secondary direction ${value}`);
    }
    secondaryDirection = value;
    return grid;
  };
  grid.validDirections = function () {
    return ['right', 'right,down', 'right,up', 'left', 'left,down', 'left,up', 'down', 'down,right', 'down,left', 'up', 'up,right', 'up,left'];
  };
  return grid;
};
