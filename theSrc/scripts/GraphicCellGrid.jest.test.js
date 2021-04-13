const GraphicCellGrid = require('./GraphicCellGrid')
const _ = require('lodash')

const oneThird = 0.3333333333333333
const twoThird = 0.6666666666666666
const threeFifths = 0.6000000000000001

function justXY (node) {
  return {
    x: node.x,
    y: node.y
  }
}

function getNodes (nodeCount) {
  return _.range(nodeCount).map(() => { return {} })
}

function getDimensionsForANodeCollectionOfLength (nodeCount, l = (new GraphicCellGrid())) {
  const nodes = getNodes(nodeCount)
  return l.compute(nodes).map(justXY)
}

function compareAndReportDifferences (expected, actual) {
  expect(actual).toEqual(expected)
}

function makeArray (length, referenceElement = {}) {
  return _.range(length).map(() => { return _.cloneDeep(referenceElement) })
}

describe('graphic cell grid:', function () {
  describe('initialization and configuration:', function () {
    it('initial sizes', function () {
      const l = new GraphicCellGrid()
      expect(l.containerWidth()).toEqual(1)
      expect(l.containerHeight()).toEqual(1)
    })

    describe('layout ordering', function () {
      it('provides list of valid values', function () {
        expect(GraphicCellGrid.validInputDirections()).toEqual([
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
        ])
      })
      describe('direction keyword syntax:', function () {
        it('defaults to "right,down"', function () {
          expect((new GraphicCellGrid()).direction()).toEqual('right,down')
        })

        const validOptions = {
          right: 'right,down',
          'right,down': 'right,down',
          'right,up': 'right,up',
          left: 'left,down',
          'left,down': 'left,down',
          'left,up': 'left,up',
          down: 'down,right',
          'down,right': 'down,right',
          'down,left': 'down,left',
          up: 'up,right',
          'up,right': 'up,right',
          'up,left': 'up,left'
        }

        _.forEach(_.keys(validOptions), function (input) {
          it(`parses '${input}' into '${validOptions[input]}'`, function () {
            expect((new GraphicCellGrid()).direction(input).direction()).toEqual(validOptions[input])
            expect((new GraphicCellGrid()).direction(input).primaryDirection()).toEqual(validOptions[input].split(',')[0])
            expect((new GraphicCellGrid()).direction(input).secondaryDirection()).toEqual(validOptions[input].split(',')[1])
          })
        })

        it('rejects invalid value foo', function () {
          const thrower = function () {
            (new GraphicCellGrid()).direction('foo')
          }
          expect(thrower).toThrow(/foo/)
        })

        it('rejects invalid value right,foo', function () {
          const thrower = function () {
            (new GraphicCellGrid()).direction('right,foo')
          }
          expect(thrower).toThrow(/foo/)
        })

        it('rejects invalid value foo,right', function () {
          const thrower = function () {
            (new GraphicCellGrid()).direction('foo,right')
          }
          expect(thrower).toThrow(/foo/)
        })
      })
    })
  })

  describe('unit tests on internals:', function () {
    describe('_getRangeFromDomain():', function () {
      let getRange = ({ position, nodeSize, gutterSize }) => {
        return (new GraphicCellGrid())._getRangeFromDomain(position, nodeSize, gutterSize)
      }

      it('should include gutter size when a whole negative integer (-2) is used', function () {
        const args = { position: -1, nodeSize: 100, gutterSize: 10 }
        expect(getRange(args)).toEqual(args.position * args.nodeSize - args.gutterSize)
      })

      it('should include gutter size when a whole negative integer (-1) is used', function () {
        const args = { position: -2, nodeSize: 100, gutterSize: 10 }
        expect(getRange(args)).toEqual(args.position * args.nodeSize - 2 * args.gutterSize)
      })

      it('should return -1/2 of node size for position -0.5', function () {
        const args = { position: -0.5, nodeSize: 100, gutterSize: 10 }
        expect(getRange(args)).toEqual(args.position * args.nodeSize)
      })

      it('should return 0 for position 0', function () {
        const args = { position: 0, nodeSize: 100, gutterSize: 10 }
        expect(getRange(args)).toEqual(0)
      })

      it('should return 1/2 of node size for position 0.5', function () {
        const args = { position: 0.5, nodeSize: 100, gutterSize: 10 }
        expect(getRange(args)).toEqual(args.position * args.nodeSize)
      })

      it('should not include the gutter length when provided a number just less than a whole', function () {
        const args = { position: 0.99, nodeSize: 100, gutterSize: 10 }
        expect(getRange(args)).toEqual(args.position * args.nodeSize)
      })

      it('should include the gutter length when provided a whole number', function () {
        const args = { position: 1, nodeSize: 100, gutterSize: 10 }
        expect(getRange(args)).toEqual(args.nodeSize + args.gutterSize)
      })

      it('should include one gutter length when provided a whole number between 1 and 2', function () {
        const args = { position: 1.5, nodeSize: 100, gutterSize: 10 }
        expect(getRange(args)).toEqual(args.position * args.nodeSize + args.gutterSize)
      })

      it('should include two gutter length when provided a position of 2', function () {
        const args = { position: 2, nodeSize: 100, gutterSize: 10 }
        expect(getRange(args)).toEqual(args.position * args.nodeSize + 2 * args.gutterSize)
      })
    })

    // NB getX uses _getRangeFromDomain, so these tests only exercise the 'additional' behaviour provided by getX (which is handling right to left layouts)
    describe('getX()/getY() and getTopLeftCoordOfImageSlot()', function () {
      const makeTest = ({ row, col, expected = {}, gridFactory }) => {
        const grid = gridFactory()
        if (_.has(expected, 'getX')) {
          it(`getX(${col}) == ${expected.getX}:`, function () {
            expect(grid.getX(col)).toBeCloseTo(expected.getX, 2)
          })
        }

        if (_.has(expected, 'getY')) {
          it(`getY(${row}) == ${expected.getY}:`, function () {
            expect(grid.getY(col)).toBeCloseTo(expected.getY, 2)
          })
        }

        if (_.has(expected, 'topLeft')) {
          it(`topLeft(${row}, ${col}) == ${expected.topLeft}:`, function () {
            const topLeft = grid.getTopLeftCoordOfImageSlot(row, col)
            expect(topLeft.x).toBeCloseTo(expected.topLeft.x, 2)
            expect(topLeft.y).toBeCloseTo(expected.topLeft.y, 2)
          })
        }
      }

      describe('layout : 2x2 grid 200x200 left to right and top to bottom', function () {
        const tests = [
          { row: -1.5, col: -1.5, expected: { getX: -150, getY: -150, topLeft: { x: -150, y: -150 } } },
          { row: -0.5, col: -0.5, expected: { getX: -50, getY: -50, topLeft: { x: -50, y: -50 } } },
          { row: 0, col: 0, expected: { getX: 0, getY: 0, topLeft: { x: 0, y: 0 } } },
          { row: 0.5, col: 0.5, expected: { getX: 50, getY: 50, topLeft: { x: 50, y: 50 } } },
          { row: 1, col: 1, expected: { getX: 100, getY: 100, topLeft: { x: 100, y: 100 } } },
          { row: 1.5, col: 1.5, expected: { getX: 150, getY: 150, topLeft: { x: 150, y: 150 } } },
          { row: 2, col: 2, expected: { getX: 200, getY: 200, topLeft: { x: 200, y: 200 } } }
        ]

        const gridFactory = () => {
          const grid = new GraphicCellGrid().containerWidth(200).containerHeight(200).rows(2).direction('right,down')
          grid.compute(makeArray(4))
          return grid
        }

        _(tests).each(testParams => makeTest({ ...testParams, gridFactory }))
      })

      describe('layout : 2x2 grid 200x200 right to left and bottom to top', function () {
        const tests = [
          { row: -1.5, col: -1.5, expected: { getX: 350, getY: 350, topLeft: { x: 250, y: 250 } } },
          { row: -0.5, col: -0.5, expected: { getX: 250, getY: 250, topLeft: { x: 150, y: 150 } } },
          { row: 0, col: 0, expected: { getX: 200, getY: 200, topLeft: { x: 100, y: 100 } } },
          { row: 0.5, col: 0.5, expected: { getX: 150, getY: 150, topLeft: { x: 50, y: 50 } } },
          { row: 1, col: 1, expected: { getX: 100, getY: 100, topLeft: { x: 0, y: 0 } } },
          { row: 1.5, col: 1.5, expected: { getX: 50, getY: 50, topLeft: { x: -50, y: -50 } } },
          { row: 2, col: 2, expected: { getX: 0, getY: 0, topLeft: { x: -100, y: -100 } } }
        ]

        const gridFactory = () => {
          const grid = new GraphicCellGrid().containerWidth(200).containerHeight(200).rows(2).direction('left,up')
          grid.compute(makeArray(4))
          return grid
        }

        _(tests).each(testParams => makeTest({ ...testParams, gridFactory }))
      })

      describe('layout : 1x1 grid 100x100 right to left and bottom to top with gutter 0.1x0.1', function () {
        const tests = [
          { row: 0, col: 0, expected: { getX: 100, getY: 100, topLeft: { x: 0, y: 0 } } }
        ]

        const gridFactory = () => {
          const grid = new GraphicCellGrid().containerWidth(100).containerHeight(100).rows(1).rowGutter(0.1).columnGutter(0.1).direction('left,up')
          grid.compute(makeArray(1))
          return grid
        }

        _(tests).each(testParams => makeTest({ ...testParams, gridFactory }))
      })

      describe('layout : 2x2 grid 210x210 left to right and top to bottom with gutter 1/11x1/11', function () {
        const tests = [
          { row: 0, col: 0, expected: { getX: 0, getY: 0, topLeft: { x: 0, y: 0 } } },
          { row: 1, col: 1, expected: { getX: 110, getY: 110, topLeft: { x: 110, y: 110 } } },
          { row: 1.99999, col: 1.99999, expected: { getX: 210, getY: 210, topLeft: { x: 210, y: 210 } } },
          { row: 2, col: 2, expected: { getX: 220, getY: 220, topLeft: { x: 220, y: 220 } } }
        ]

        const gridFactory = () => {
          const grid = new GraphicCellGrid().containerWidth(210).containerHeight(210).rows(2).rowGutter(1 / 11).columnGutter(1 / 11).direction('right,down')
          grid.compute(makeArray(4))
          return grid
        }

        _(tests).each(testParams => makeTest({ ...testParams, gridFactory }))
      })

      describe('layout : 2x2 grid 210x210 right to left and bottom to top with gutter 1/11x1/11', function () {
        const tests = [
          { row: 0, col: 0, expected: { getX: 210, getY: 210, topLeft: { x: 110, y: 110 } } },
          { row: 1, col: 1, expected: { getX: 100, getY: 100, topLeft: { x: 0, y: 0 } } },
          { row: 1.99999, col: 1.99999, expected: { getX: 0, getY: 0 } }
        ]

        const gridFactory = () => {
          const grid = new GraphicCellGrid().containerWidth(210).containerHeight(210).rows(2).rowGutter(1 / 11).columnGutter(1 / 11).direction('left,up')
          grid.compute(makeArray(4))
          return grid
        }

        _(tests).each(testParams => makeTest({ ...testParams, gridFactory }))
      })
    })

    describe('_getGutterRangeFromDomain():', function () {
      let getRange = ({ position, nodeSize, gutterSize }) => {
        return (new GraphicCellGrid())._getGutterRangeFromDomain(position, nodeSize, gutterSize)
      }

      it('throws error on gutter less than 1 (-1) ', function () {
        const args = { position: -1, nodeSize: 100, gutterSize: 10 }
        expect(() => getRange(args)).toThrow()
      })

      it('throws error on gutter less than 1 (0.99)', function () {
        const args = { position: 0.99, nodeSize: 100, gutterSize: 10 }
        expect(() => getRange(args)).toThrow()
      })

      it('computes correctly on left edge of gutter', function () {
        const args = { position: 1, nodeSize: 100, gutterSize: 10 }
        expect(getRange(args)).toEqual(args.position * args.nodeSize)
      })

      it('computes correctly in middle of gutter', function () {
        const args = { position: 1.5, nodeSize: 100, gutterSize: 10 }
        expect(getRange(args)).toEqual(1 * args.nodeSize + 0.5 * args.gutterSize)
      })

      it('computes correctly on right edge of gutter', function () {
        const args = { position: 1.99, nodeSize: 100, gutterSize: 10 }
        expect(getRange(args)).toEqual(1 * args.nodeSize + 0.99 * args.gutterSize)
      })

      it('computes correctly on left edge of next gutter', function () {
        const args = { position: 2, nodeSize: 100, gutterSize: 10 }
        expect(getRange(args)).toEqual(2 * args.nodeSize + 1 * args.gutterSize)
      })
    })

    describe('_calculateGridDimensions():', function () {
      const tests = [
        { specifyRows: 1, nodeLength: 1, expected: '1x1' },
        { specifyCols: 1, nodeLength: 1, expected: '1x1' },
        { specifyRows: 2, nodeLength: 3, expected: '2x2' },
        { specifyCols: 2, nodeLength: 3, expected: '2x2' },
        { specifyRows: 2, nodeLength: 4, expected: '2x2' },
        { specifyCols: 2, nodeLength: 4, expected: '2x2' },
        { nodeLength: 4, expected: '2x2' },
        { nodeLength: 5, expected: '2x3' },
        { specifyCols: 1, nodeLength: 5, expected: '5x1' },
        { specifyRows: 1, nodeLength: 5, expected: '1x5' },
        // test error handling when rows cols both specified
        {
          name: 'should not throw error if all specified and rows x cols == nodes.length',
          specifyRows: 2,
          specifyCols: 2,
          nodeLength: 4,
          expected: '2x2'
        },
        {
          name: 'should throw error if all specified and rows x cols != nodes.length',
          specifyRows: 2,
          specifyCols: 6,
          nodeLength: 4,
          throw: true
        }
      ]

      _(tests).each((t) => {
        const defaultName = `input rows:${t.specifyRows} input cols:${t.specifyCols} nodes: ${t.nodeLength} yields ${t.expected}`
        it(t.name || defaultName, function () {
          const l = new GraphicCellGrid()
          l.numNodes(t.nodeLength)
          if (_.has(t, 'specifyRows')) { l.rows(t.specifyRows) }
          if (_.has(t, 'specifyCols')) { l.cols(t.specifyCols) }

          if (t.throw) {
            expect(() => l._calcGridDimensions()).toThrow()
          } else {
            l._calcGridDimensions()
            expect(`${l.numRows}x${l.numCols}`).toEqual(t.expected)
          }
        })
      })
    })

    describe('_computeScale():', function () {
      const tests = [
        { totalSize: 100, numElements: 1, gutterAllocation: 0, expected: { nodeSize: 100, gutterSize: 0 } },
        { totalSize: 100, numElements: 5, gutterAllocation: 0, expected: { nodeSize: 20, gutterSize: 0 } },
        { totalSize: 65, numElements: 6, gutterAllocation: 1 / 11, expected: { nodeSize: 10, gutterSize: 1 } },
        { totalSize: 10, numElements: 2, gutterAllocation: 1 / 3, expected: { nodeSize: 4, gutterSize: 2 } },
        { totalSize: 9, numElements: 2, gutterAllocation: 1 / 2, expected: { nodeSize: 3, gutterSize: 3 } },
        { totalSize: 11, numElements: 2, gutterAllocation: 9 / 10, expected: { nodeSize: 1, gutterSize: 9 } }
      ]

      _(tests).each((t) => {
        const defaultName = `Given: totalSize: ${t.totalSize} numElements: ${t.numElements} gutterAllocation: ${t.gutterAllocation} Yields : nodeSize: ${t.nodeSize} gutterSize: ${t.gutterSize}`
        it(t.name || defaultName, function () {
          const l = new GraphicCellGrid()
          const actual = l._computeScale(t.totalSize, t.numElements, t.gutterAllocation)
          expect(actual.nodeSize).toBeCloseTo(t.expected.nodeSize, 4)
          expect(actual.gutterSize).toBeCloseTo(t.expected.gutterSize, 4)
        })
      })
    })
  })

  describe('compute():', function () {
    it('equally distributes 4 nodes within a 1x1 space, left to right, top to bottom', function () {
      const actual = getDimensionsForANodeCollectionOfLength(4)
      const expected = [
        { x: 0, y: 0 },
        { x: 0.5, y: 0 },
        { x: 0, y: 0.5 },
        { x: 0.5, y: 0.5 }
      ]
      compareAndReportDifferences(expected, actual)
    })

    it('1 data point is at the top left', function () {
      const actual = getDimensionsForANodeCollectionOfLength(1)
      const expected = [
        { x: 0, y: 0 }
      ]
      compareAndReportDifferences(expected, actual)
    })

    describe('equally distributes 5 nodes within a 1x1 space', function () {

      const l = (new GraphicCellGrid())
      const actual = getDimensionsForANodeCollectionOfLength(5, l)
      const expected = [
        { x: 0, y: 0 },
        { x: oneThird, y: 0 },
        { x: twoThird, y: 0 },
        { x: 0, y: 0.5 },
        { x: oneThird, y: 0.5 }
      ]

      it('has correct layout', function () {
        compareAndReportDifferences(expected, actual)
      })

      it('has correct dimensions', function () {
        expect(l.numRows).toEqual(2)
        expect(l.numCols).toEqual(3)
      })
    })

    it('equally distributes 5 nodes within a 300x500 space', function () {
      const l = (new GraphicCellGrid()).containerWidth(300).containerHeight(500)
      const actual = l.compute(getNodes(5)).map(justXY)
      const expected = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 200, y: 0 },
        { x: 0, y: 250 },
        { x: 100, y: 250 }
      ]
      compareAndReportDifferences(expected, actual)

      expect(l.containerWidth()).toEqual(300)
      expect(l.containerHeight()).toEqual(500)
    })

    it('fixed amount of cols', function () {
      const actual = (new GraphicCellGrid()).cols(2).compute(getNodes(5)).map(justXY)
      const expected = [
        { x: 0, y: 0 },
        { x: 0.5, y: 0 },
        { x: 0, y: oneThird },
        { x: 0.5, y: oneThird },
        { x: 0, y: twoThird }
      ]
      compareAndReportDifferences(expected, actual)
    })

    it('fixed amount of rows', function () {
      const actual = (new GraphicCellGrid()).rows(3).compute(getNodes(5)).map(justXY)
      const expected = [
        { x: 0, y: 0 },
        { x: 0.5, y: 0 },
        { x: 0, y: oneThird },
        { x: 0.5, y: oneThird },
        { x: 0, y: twoThird }
      ]
      compareAndReportDifferences(expected, actual)
    })

    it('1 row', function () {
      const actual = (new GraphicCellGrid()).rows(1).compute(getNodes(5)).map(justXY)
      const expected = [
        { x: 0, y: 0 },
        { x: 0.2, y: 0 },
        { x: 0.4, y: 0 },
        { x: threeFifths, y: 0 },
        { x: 0.8, y: 0 }
      ]
      compareAndReportDifferences(expected, actual)
    })

    it('reset rows/cols after each call', function () {
      const l = new GraphicCellGrid()

      const actualOne = l.compute(getNodes(5)).map(justXY)
      const expectedOne = [
        { x: 0, y: 0 },
        { x: oneThird, y: 0 },
        { x: twoThird, y: 0 },
        { x: 0, y: 0.5 },
        { x: oneThird, y: 0.5 }
      ]
      compareAndReportDifferences(expectedOne, actualOne)

      const actualTwo = l.compute(getNodes(4)).map(justXY)
      const expectedTwo = [
        { x: 0, y: 0 },
        { x: 0.5, y: 0 },
        { x: 0, y: 0.5 },
        { x: 0.5, y: 0.5 }
      ]
      compareAndReportDifferences(expectedTwo, actualTwo)
    })

    it('fixed amount of cols stays the same', function () {
      const l = new GraphicCellGrid().cols(2)
      const actualOne = l.compute(getNodes(5)).map(justXY)
      const expectedOne = [
        { x: 0, y: 0 },
        { x: 0.5, y: 0 },
        { x: 0, y: oneThird },
        { x: 0.5, y: oneThird },
        { x: 0, y: twoThird }
      ]
      compareAndReportDifferences(expectedOne, actualOne)

      const actualTwo = l.compute(getNodes(7)).map(justXY)
      const expectedTwo = [
        { x: 0, y: 0 },
        { x: 0.5, y: 0 },
        { x: 0, y: 0.25 },
        { x: 0.5, y: 0.25 },
        { x: 0, y: 0.5 },
        { x: 0.5, y: 0.5 },
        { x: 0, y: 0.75 }
      ]
      compareAndReportDifferences(expectedTwo, actualTwo)
    })

    describe('gutter sizes are accounted for in layout:', function () {
      describe('gutter size 0.1 means "gutter size is 10% of total space"', function () {
        const l = (new GraphicCellGrid()).rowGutter(0).columnGutter(0.1).containerWidth(19).containerHeight(19)
        const actual = l.compute(getNodes(4)).map(justXY)
        const expected = [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 0, y: 19 / 2 },
          { x: 10, y: 19 / 2 }
        ]

        it('computes x and y correctly', function () {
          compareAndReportDifferences(expected, actual)
        })

        it('computes node size correctly', function () {
          expect(l.nodeWidth()).toEqual(9)
          expect(l.nodeHeight()).toEqual(9.5)
        })
      })

      describe('gutter size 0.5 means "gutter is same size as nodes"', function () {
        const l = (new GraphicCellGrid()).rowGutter(0.5).columnGutter(0)
        const actual = l.compute(getNodes(4)).map(justXY)
        const expected = [
          { x: 0, y: 0 },
          { x: 0.5, y: 0 },
          { x: 0, y: twoThird },
          { x: 0.5, y: twoThird }
        ]

        it('computes x and y correctly', function () {
          compareAndReportDifferences(expected, actual)
        })

        it('computes node size correctly', function () {
          expect(l.nodeWidth()).toEqual(0.5)
          expect(l.nodeHeight()).toEqual(oneThird)
        })
      })

      describe('gutter size 0.3333 means "gutter is 1/3 to the 2/3 size of node"', function () {
        const l = (new GraphicCellGrid()).rowGutter(oneThird).columnGutter(oneThird).containerWidth(5).containerHeight(5)
        const actual = l.compute(getNodes(4)).map(justXY)
        const expected = [
          { x: 0, y: 0 },
          { x: 3, y: 0 },
          { x: 0, y: 3 },
          { x: 3, y: 3 }
        ]

        it('computes x and y correctly', function () {
          compareAndReportDifferences(expected, actual)
        })

        it('computes node size correctly', function () {
          expect(l.nodeWidth()).toEqual(2)
          expect(l.nodeHeight()).toEqual(2)
        })
      })
    })

    describe('layout order varies based on direction:', function () {
      const layoutExpectations = {
        // RHS tokens are row+col:rowOrder+colOrder
        'right,down': '00:00 01:01 02:02 10:10 11:11',
        'right,up': '10:00 11:01 12:02 00:10 01:11',
        'left,down': '02:00 01:01 00:02 12:10 11:11',
        'left,up': '12:00 11:01 10:02 02:10 01:11',
        'down,right': '00:00 10:10 01:01 11:11 02:02',
        'down,left': '02:00 12:10 01:01 11:11 00:02',
        'up,right': '10:00 00:10 11:01 01:11 12:02',
        'up,left': '12:00 02:10 11:01 01:11 10:02'
      }

      function nodeString (nodes) {
        return nodes.map(function (node) {
          // NB the reverse of x and y to make y first is deliberate so it matched the rowOrder
          return `${Math.round(node.y)}${Math.round(node.x)}:${node.rowOrder}${node.colOrder}`
        }).join(' ')
      }

      _.forEach(_.keys(layoutExpectations), function (directionKeyword) {
        it(`the layout for ${directionKeyword} is ${layoutExpectations[directionKeyword]}`, function () {
          const l = (new GraphicCellGrid()).direction(directionKeyword).rows(2).containerWidth(3).containerHeight(2)
          const nodes = [{}, {}, {}, {}, {}]

          const actual = nodeString(l.compute(nodes))
          const expected = layoutExpectations[directionKeyword]

          expect(expected).toEqual(actual)
        })
      })
    })
  })
})
