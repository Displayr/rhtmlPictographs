import GraphicCellGrid from './graphicCellGrid';

function justXY(node) {
  return {
    xFactory: node.xFactory,
    yFactory: node.yFactory,
  };
}

describe('d3 grid:', function () {
  it('equally distributes 4 nodes within a 1x1 space, left to right, top to bottom', function () {
    const l = new GraphicCellGrid().points();
    const nodes = [{}, {}, {}, {}];

    expect(l.compute(nodes).map(justXY)).to.deep.equal([
      { xFactory: 0, yFactory: 0 },
      { xFactory: 1, yFactory: 0 },
      { xFactory: 0, yFactory: 1 },
      { xFactory: 1, yFactory: 1 },
    ]);
  });

  it('1 data point is in the center (is this good or should it be at [0,0]?)', function () {
    const l = new GraphicCellGrid().points();
    const nodes = [{}];

    expect(l.compute(nodes).map(justXY)).to.deep.equal([
      { xFactory: 0.5, yFactory: 0.5 },
    ]);
  });

  it('equally distributes 5 nodes within a 1x1 space', function () {
    const l = new GraphicCellGrid().points();
    const nodes = [{}, {}, {}, {}, {}];

    expect(l.compute(nodes).map(justXY)).to.deep.equal([
      { xFactory: 0, yFactory: 0 },
      { xFactory: 0.5, yFactory: 0 },
      { xFactory: 1, yFactory: 0 },
      { xFactory: 0, yFactory: 1 },
      { xFactory: 0.5, yFactory: 1 },
    ]);
  });

  it('equally distributes 5 nodes within a 300x500 space', function () {
    const l = new GraphicCellGrid().points()
      .containerSize([300, 500]);
    const nodes = [{}, {}, {}, {}, {}];

    expect(l.compute(nodes).map(justXY)).to.deep.equal([
      { xFactory: 0, yFactory: 0 },
      { xFactory: 150, yFactory: 0 },
      { xFactory: 300, yFactory: 0 },
      { xFactory: 0, yFactory: 500 },
      { xFactory: 150, yFactory: 500 },
    ]);
  });

  it('fixed amount of cols', function () {
    const l = new GraphicCellGrid().points().cols(2);
    const nodes = [{}, {}, {}, {}, {}];

    expect(l.compute(nodes).map(justXY)).to.deep.equal([
      { xFactory: 0, yFactory: 0 },
      { xFactory: 1, yFactory: 0 },
      { xFactory: 0, yFactory: 0.5 },
      { xFactory: 1, yFactory: 0.5 },
      { xFactory: 0, yFactory: 1 },
    ]);
  });

  it('fixed amount of rows', function () {
    const l = new GraphicCellGrid().points().rows(3);
    const nodes = [{}, {}, {}, {}, {}];

    expect(l.compute(nodes).map(justXY)).to.deep.equal([
      { xFactory: 0, yFactory: 0 },
      { xFactory: 1, yFactory: 0 },
      { xFactory: 0, yFactory: 0.5 },
      { xFactory: 1, yFactory: 0.5 },
      { xFactory: 0, yFactory: 1 },
    ]);
  });

  it('fixed amount of cols and rows', function () {
    const thrower = function () {
      new GraphicCellGrid().points().cols(2).rows(5);
    };

    expect(thrower).to.throw();
  });

  it('1 row', function () {
    const l = new GraphicCellGrid().points().rows(1);
    const nodes = [{}, {}, {}, {}, {}];

    expect(l.compute(nodes).map(justXY)).to.deep.equal([
      { xFactory: 0, yFactory: 0.5 },
      { xFactory: 0.25, yFactory: 0.5 },
      { xFactory: 0.5, yFactory: 0.5 },
      { xFactory: 0.75, yFactory: 0.5 },
      { xFactory: 1, yFactory: 0.5 },
    ]);
  });

  it('reset rows/cols after each call', function () {
    const l = new GraphicCellGrid().points();
    let nodes = [{}, {}, {}, {}, {}];

    expect(l.compute(nodes).map(justXY)).to.deep.equal([
      { xFactory: 0, yFactory: 0 },
      { xFactory: 0.5, yFactory: 0 },
      { xFactory: 1, yFactory: 0 },
      { xFactory: 0, yFactory: 1 },
      { xFactory: 0.5, yFactory: 1 },
    ]);

    nodes = [{}, {}, {}, {}];
    expect(l.compute(nodes).map(justXY)).to.deep.equal([
      { xFactory: 0, yFactory: 0 },
      { xFactory: 1, yFactory: 0 },
      { xFactory: 0, yFactory: 1 },
      { xFactory: 1, yFactory: 1 },
    ]);
  });

  it('fixed amount of cols stays the same', function () {
    const l = new GraphicCellGrid().points().cols(2);
    let nodes = [{}, {}, {}, {}, {}];

    expect(l.compute(nodes).map(justXY)).to.deep.equal([
      { xFactory: 0, yFactory: 0 },
      { xFactory: 1, yFactory: 0 },
      { xFactory: 0, yFactory: 0.5 },
      { xFactory: 1, yFactory: 0.5 },
      { xFactory: 0, yFactory: 1 },
    ]);

    nodes = [{}, {}, {}, {}, {}, {}, {}];
    expect(l.compute(nodes).map(justXY)).to.deep.equal([
      { xFactory: 0, yFactory: 0 },
      { xFactory: 1, yFactory: 0 },
      { xFactory: 0, yFactory: 1 / 3 },
      { xFactory: 1, yFactory: 1 / 3 },
      { xFactory: 0, yFactory: 2 / 3 },
      { xFactory: 1, yFactory: 2 / 3 },
      { xFactory: 0, yFactory: 1 },

    ]);
  });

  it('bands', function () {
    const l = new GraphicCellGrid().bands();
    const nodes = [{}, {}, {}, {}, {}];

    expect(l.compute(nodes).map(justXY)).to.deep.equal([
      { xFactory: 0, yFactory: 0 },
      { xFactory: 1 / 3, yFactory: 0 },
      { xFactory: 2 / 3, yFactory: 0 },
      { xFactory: 0, yFactory: 0.5 },
      { xFactory: 1 / 3, yFactory: 0.5 },
    ]);

    l.cols(2);

    expect(l.compute(nodes).map(justXY)).to.deep.equal([
      { xFactory: 0, yFactory: 0 },
      { xFactory: 0.5, yFactory: 0 },
      { xFactory: 0, yFactory: 1 / 3 },
      { xFactory: 0.5, yFactory: 1 / 3 },
      { xFactory: 0, yFactory: 2 / 3 },
    ]);
  });

  it('initial sizes', function () {
    const l = new GraphicCellGrid();
    expect(l._containerSize).to.deep.equal([1, 1]);
  });

  it('bands with padding', function () {
    const l = new GraphicCellGrid().bands().padding([0.5, 0.5]);
    const nodes = [{}, {}, {}, {}, {}];

    expect(l.compute(nodes).map(justXY)).to.deep.equal([
      { xFactory: 0, yFactory: 0 },
      { xFactory: 0.4, yFactory: 0 },
      { xFactory: 0.8, yFactory: 0 },
      { xFactory: 0, yFactory: 2 / 3 },
      { xFactory: 0.4, yFactory: 2 / 3 },
    ]);

    l.cols(2);

    expect(l.compute(nodes).map(justXY)).to.deep.equal([
      { xFactory: 0, yFactory: 0 },
      { xFactory: 2 / 3, yFactory: 0 },
      { xFactory: 0, yFactory: 0.4 },
      { xFactory: 2 / 3, yFactory: 0.4 },
      { xFactory: 0, yFactory: 0.8 },
    ]);
  });

  describe('layout ordering', function () {
    it('provides list of valid values', function () {
      expect(GraphicCellGrid.validInputDirections()).to.deep.equal([
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
      ]);
    });
    describe('direction keyword syntax:', function () {
      it('defaults to "right,down"', function () {
        expect((new GraphicCellGrid()).direction()).to.equal('right,down');
      });

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
        'up,left': 'up,left',
      };

      _.forEach(_.keys(validOptions), function (input) {
        it(`parses '${input}' into '${validOptions[input]}'`, function () {
          expect((new GraphicCellGrid()).direction(input).direction()).to.equal(validOptions[input]);
          expect((new GraphicCellGrid()).direction(input).primaryDirection()).to.equal(validOptions[input].split(',')[0]);
          expect((new GraphicCellGrid()).direction(input).secondaryDirection()).to.equal(validOptions[input].split(',')[1]);
        });
      });

      it('rejects invalid value foo', function () {
        const thrower = function () {
          (new GraphicCellGrid()).direction('foo');
        };
        expect(thrower).to.throw(/foo/);
      });

      it('rejects invalid value right,foo', function () {
        const thrower = function () {
          (new GraphicCellGrid()).direction('right,foo');
        };
        expect(thrower).to.throw(/foo/);
      });

      it('rejects invalid value foo,right', function () {
        const thrower = function () {
          (new GraphicCellGrid()).direction('foo,right');
        };
        expect(thrower).to.throw(/foo/);
      });
    });

    describe('layout and ordering:', function () {
      const layoutExpectations = {
        // RHS tokens are row+col:rowOrder+colOrder
        'right,down': '00:00 01:01 02:02 10:10 11:11',
        'right,up': '10:00 11:01 12:02 00:10 01:11',
        'left,down': '02:00 01:01 00:02 12:10 11:11',
        'left,up': '12:00 11:01 10:02 02:10 01:11',
        'down,right': '00:00 10:10 01:01 11:11 02:02',
        'down,left': '02:00 12:10 01:01 11:11 00:02',
        'up,right': '10:00 00:10 11:01 01:11 12:02',
        'up,left': '12:00 02:10 11:01 01:11 10:02',
      };

      function nodeString(nodes) {
        return nodes.map(function (node) {
          return `${node.row}${node.col}:${node.rowOrder}${node.colOrder}`;
        }).join(' ');
      }

      _.forEach(_.keys(layoutExpectations), function (directionKeyword) {
        it(`the layout for ${directionKeyword} is ${layoutExpectations[directionKeyword]}`, function () {
          const l = (new GraphicCellGrid()).direction(directionKeyword).rows(2);
          const nodes = [{}, {}, {}, {}, {}];
          expect(nodeString(l.compute(nodes))).to.equal(layoutExpectations[directionKeyword]);
        });
      });
    });
  });
});

