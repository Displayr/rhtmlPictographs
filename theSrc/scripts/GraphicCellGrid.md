# d3.layout.grid

A grid layout for [D3](http://d3js.org). The grid layout takes a one-dimensional array of data and arranges it on a two-dimensional grid.

## API

const graphicCellGrid = new grid()

Constructs a new grid layout.

graphicCellGrid.compute(<i>nodes</i>)

Computes the layout for <i>nodes</i>. Per default, the layout tries to keep the column and row number as equal as possible and uses point spacing. Four attributes are set on each node:

* x – the computed <i>x</i>-coordinate of the node position.
* y – the computed <i>y</i>-coordinate of the node position.
* row - the (0-based) index of the row the node was placed.
* col - the (0-based) index of the col the node was placed.
* rowOrder - the order of placement of this row WRT the other rows
* colOrder - the order of placement of this col WRT the other rows

<a name="points" href="#points">#</a> grid.<b>points</b>()

Configure the grid to treat nodes as points, cf. [d3.scale.ordinal().rangePoints()](https://github.com/mbostock/d3/wiki/Ordinal-Scales#wiki-ordinal_rangePoints).

<a name="bands" href="#bands">#</a> grid.<b>bands</b>()

Configure the grid to treat nodes as bands, cf. [d3.scale.ordinal().rangeBands()](https://github.com/mbostock/d3/wiki/Ordinal-Scales#wiki-ordinal_rangeBands)

<a name="padding" href="#padding">#</a> grid.<b>padding</b>([<i>padding</i>])

Specify the <i>padding</i> between the node bands as [<i>x</i>, <i>y</i>]. <i>x</i> and <i>y</i> are relative to the band width/height, similar to the <i>padding</i> parameter of [d3.scale.ordinal().rangeBands()](https://github.com/mbostock/d3/wiki/Ordinal-Scales#wiki-ordinal_rangeBands).

<a name="cols" href="#cols">#</a> grid.<b>cols</b>([<i>num</i>])

Fixes the layout to <i>num</i> columns or returns the number of columns (if it was set before).

You cannot set both cols() and rows() !

<a name="rows" href="#rows">#</a> grid.<b>rows</b>([<i>num</i>])

Fixes the layout to <i>num</i> rows or returns the number of rows (if it was set before).

You cannot set both cols() and rows() !

<a name="containerSize" href="#containerSize">#</a> grid.<b>containerSize</b>([<i>size</i>])

If <i>size</i> is specified, sets the overall size of the layout as [<i>x</i>, <i>y</i>].

If <i>size</i> is not specified, returns the current <i>size</i>. Default size is 1×1.

<a name="nodeSize" href="#nodeSize">#</a> grid.<b>nodeSize</b>()

Returns the size ([x,y]) of each node. can only be called after compute()

<a name="direction" href="#direction">#</a> grid.<b>direction</b>([<i>direction</i>])

The instructions for layout ordering, which defaults to "right,down" as in layout left to right, then top to bottom.

Valid options and their equivalents are (from test suite):

```javascript
var validOptions = {
  'right' : 'right,down',
  'right,down' : 'right,down',
  'right,up' : 'right,up',
  'left' : 'left,down',
  'left,down' : 'left,down',
  'left,up' : 'left,up',
  'down' : 'down,right',
  'down,right' : 'down,right',
  'down,left' : 'down,left',
  'up' : 'up,right',
  'up,right' : 'up,right',
  'up,left' : 'up,left'
}
```

Here are the rows and columns chosen for each direction combination, assuming 5 nodes on two rows (from test suite):

```javascript
var layoutExpectations = {
  'right,down' : '00 01 02 10 11',
  'right,up' : '10 11 12 00 01',
  'left,down' : '02 01 00 12 11',
  'left,up' : '12 11 10 02 01',
  'down,right' : '00 10 01 11 02',
  'down,left' : '02 12 01 11 00',
  'up,right' : '10 00 11 01 12',
  'up,left' : '12 02 11 01 10'
}
```

## Contributing

Fork it, code it, test it, build it, submit a PR.

### Installing, Running Test, and Building

The test and build environment for this module is verified to work with node 5 or greater.

#### Install

`npm install`

#### Test

Single Test: `./node_modules/.bin/gulp test`

Run Test on Save: `./node_modules/.bin/karma start karma.conf.js`

#### Build (includes test)

ALWAYS build before commit

`./node_modules/.bin/gulp build`


## Author

Original : Jeremy Stucki, [Interactive Things](https://github.com/interactivethings/d3-grid)

Current Modified : Kyle Zeeuwen, [Numbers International](https://github.com/NumbersInternational/d3-grid)

## License

BSD, see LICENSE.txt
