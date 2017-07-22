// NB TODO Im not sure what to do with these spec files. In their present form the provide no valuable feedback on regressions.
//   I rely solely on manual inspection of examples in the internal content server and by using the applitools regression suite
//   For now I'm commenting them out until I decide what to do wrt spec testing

// import _ from 'lodash'
// import $ from 'jquery'
// import sinon from 'sinon'
// import Pictograph from './Pictograph'
// import BaseCell from './BaseCell'
// import GraphicCell from './GraphicCell'
// import LabelCell from './LabelCell'
//
// describe('Pictograph class:', function () {
//   beforeEach(function () {
//     this.gen = {
//       graphic: (config) => {
//         if (config == null) { config = { variableImage: '/image/foo' } }
//         return { type: 'graphic', value: config }
//       },
//       label: (config) => {
//         if (config == null) { config = 'label' }
//         return { type: 'label', value: config }
//       }
//     }
//   })
//
//   describe('_processConfig():', function () {
//     beforeEach(function () {
//       this.instantiateAndSetConfigTo = function (config, width, height) {
//         if (width == null) { width = 100 }
//         if (height == null) { height = 100 }
//         this.instance = new Pictograph('<div class="outer-container">', width, height)
//         this.instance.setConfig(config)
//       }
//     })
//
//     describe('non-json string config', function () {
//       beforeEach(function () {
//         this.instantiateAndSetConfigTo('circle')
//       })
//
//       it('creates a single image graphic in a one row table', function () {
//         expect(this.instance.config.table.rows[0][0]).to.deep.equal({ type: 'graphic', value: { variableImage: 'circle' } })
//       })
//     })
//
//     describe('without "table" field:', function () {
//       beforeEach(function () {
//         this.instantiateAndSetConfigTo({ variableImage: 'images/foo' })
//       })
//
//       it('creates a top level "table" config field', function () {
//         expect(this.instance.config).to.have.property('table')
//       })
//
//       it('the table field contains a rows field', function () {
//         expect(this.instance.config.table).to.have.property('rows')
//       })
//
//       it('there is one graphic cell in the table', function () {
//         expect(this.instance.config.table.rows.length).to.equal(1)
//         expect(this.instance.config.table.rows[0].length).to.equal(1)
//         expect(this.instance.config.table.rows[0][0].type).to.equal('graphic')
//       })
//     })
//
//     describe('using strings for row definitions:', function () {
//       beforeEach(function () {
//         this.instantiateAndSetConfigTo({ table: { rows: [['label:alabel', 'circle']] } })
//       })
//
//       it('creates a label in the first cell', function () {
//         expect(this.instance.config.table.rows[0][0]).to.deep.equal({ type: 'label', value: 'alabel' })
//       })
//
//       it('creates a graphic in the second cell', function () {
//         expect(this.instance.config.table.rows[0][1]).to.deep.equal({ type: 'graphic', value: { variableImage: 'circle' } })
//       })
//     })
//
//     describe('setting default css:', function () {
//       beforeEach(function () {
//         this.baseCellSetDefaultSpy = sinon.spy(BaseCell, 'setDefault')
//         this.baseCellSetCssSpy = sinon.spy(BaseCell.prototype, 'setCss')
//
//         this.instantiateAndSetConfigTo({ variableImage: 'images/foo' })
//
//         this.defaultWasSet = function (param) {
//           const defaultsThatWereSet = this.baseCellSetDefaultSpy.args.map(callValues => callValues[0])
//           expect(defaultsThatWereSet).to.include(param)
//         }
//
//         this.cssWasSet = function (param) {
//           const cssThatWasSet = this.baseCellSetCssSpy.args.map(callValues => callValues[1])
//           expect(cssThatWasSet).to.include(param)
//         }
//       })
//
//       afterEach(function () {
//         BaseCell.setDefault.restore()
//         BaseCell.prototype.setCss.restore()
//       })
//
//       it('sets font-family to something', function () { return this.cssWasSet('font-family') })
//       it('sets font-weight to something', function () { return this.cssWasSet('font-weight') })
//       it('sets font-size default to something', function () { return this.defaultWasSet('font-size') })
//       it('sets font-color to something', function () { return this.cssWasSet('font-color') })
//     })
//
//     describe('setting custom css:', function () {
//       beforeEach(function () {
//         this.baseCellSetCssSpy = sinon.spy(BaseCell.prototype, 'setCss')
//
//         this.instantiateAndSetConfigTo({
//           table: {
//             rows: [['url:/images/foo']]
//           },
//           css: {
//             cssLocation1: { cssAttr1: 'cssValue1', cssAttr2: 'cssValue2' },
//             cssLocation2: { cssAttr3: 'cssValue3', cssAttr4: 'cssValue4' }
//           } })
//
//         this.verifyCss = function (location, attr, value) {
//           expect(this.baseCellSetCssSpy).to.have.been.calledWith(location, attr, value)
//         }
//       })
//
//       afterEach(() => BaseCell.prototype.setCss.restore())
//
//       it('set css attr1 on css location 1', function () { return this.verifyCss('cssLocation1', 'cssAttr1', 'cssValue1') })
//       it('set css attr2 on css location 1', function () { return this.verifyCss('cssLocation1', 'cssAttr2', 'cssValue2') })
//       it('set css attr3 on css location 2', function () { return this.verifyCss('cssLocation2', 'cssAttr3', 'cssValue3') })
//       it('set css attr4 on css location 2', function () { return this.verifyCss('cssLocation2', 'cssAttr4', 'cssValue4') })
//     })
//
//     it('fails on unknown root attributes', function () {
//       const badConfig = { table: { rows: [[]] }, foo: 'bar' }
//       expect(() => this.instantiateAndSetConfigTo(badConfig)).to.throw(/foo/)
//     })
//
//     it('fails on unknown table attributes', function () {
//       const badConfig = { table: { rows: [[]], foo: 'bar' } }
//       expect(() => this.instantiateAndSetConfigTo(badConfig)).to.throw(/foo/)
//     })
//   })
//
//   describe('_computeTableLayout():', function () {
//     beforeEach(function () {
//       this.setup = function (config, width, height) {
//         if (width == null) { width = 100 }
//         if (height == null) { height = 100 }
//         this.instance = new Pictograph('<div class="outer-container">', width, height)
//         this.instance.setConfig(config)
//         this.instance._computeTableLayout()
//         this.instance._computeTableLinesLayout()
//       }
//
//       // params:
//       //  - 'width=1000'
//       //  - 'height=1000'
//       //  - 'numRows=2'
//       //  - 'numCols=2'
//       //  - 'rowHeights'
//       //  - 'colWidths'
//       //  - 'rowGutterLength'
//       //  - 'columnGutterLength'
//       //  - 'lPLeft'
//       //  - 'lPRight'
//       //  - 'lPTop'
//       //  - 'lPBottom'
//       //  - 'hLines'
//       //  - 'vLines'
//       this.makeTable = function (c) {
//         const tableConfig = {
//           table: {
//             rows: []
//           }
//         };
//
//         ['rowHeights', 'colWidths', 'rowGutterLength', 'columnGutterLength'].forEach((key) => {
//           if (c[key] != null) { tableConfig.table[key] = c[key] }
//         })
//
//         _.range(0, c.numRows || 2).forEach((i) => {
//           tableConfig.table.rows.push([])
//           _.range(0, c.numCols || 2).forEach(() => {
//             tableConfig.table.rows[i].push(this.gen.graphic())
//           })
//         })
//
//         if (tableConfig.table.lines == null) { tableConfig.table.lines = {} }
//         [
//           { alias: 'lPLeft', setting: 'padding-left' },
//           { alias: 'lPRight', setting: 'padding-right' },
//           { alias: 'lPTop', setting: 'padding-top' },
//           { alias: 'lPBottom', setting: 'padding-bottom' }
//         ].forEach(({ alias, setting }) => {
//           if (c[alias] != null) { tableConfig.table.lines[setting] = c[alias] }
//         })
//
//         if (c.hLines != null) { tableConfig.table.lines.horizontal = c.hLines }
//         if (c.vLines != null) { tableConfig.table.lines.vertical = c.vLines }
//
//         this.instance = new Pictograph('<div class="outer-container">', c.width || 1000, c.height || 1000)
//         this.instance.setConfig(tableConfig)
//         this.instance._computeTableLayout()
//         this.instance._computeTableLinesLayout()
//       }
//
//       // TODO wat ?
//       this.badConfig = c => () => this.setup(c)
//     })
//
//     describe('invalid rows definition:', function () {
//       it('throws error if row is not array', function () {
//         expect(this.badConfig({ table: { rows: ['dogs'] } })).to.throw(new RegExp('row 0 must be array'))
//       })
//     })
//
//     describe('jagged table:', function () {
//       it('fills rows with empty columns to balance table', function () {
//         const jaggedRows = [
//           [this.gen.graphic(), this.gen.graphic()],
//           [this.gen.graphic()]
//         ]
//         this.setup({ table: { rows: jaggedRows } })
//         expect(this.instance.config.table.rows[1][1].type).to.deep.equal('empty')
//         expect(this.instance.config.table.rows[1].length).to.equal(2)
//       })
//     })
//
//     describe('row heights:', function () {
//       beforeEach(function () {
//         this.withRowHeights = function (rowHeights, rowPadding, width, height) {
//           if (width == null) { width = 100 }
//           if (height == null) { height = 100 }
//           const c = {
//             table: {
//               rows: [
//                 [this.gen.graphic()],
//                 [this.gen.graphic()]
//               ],
//               rowHeights
//             }
//           }
//           if (rowPadding != null) { c.table.rowGutterLength = rowPadding }
//           this.setup(c, width, height)
//         }
//       })
//
//       describe('invalid values:', function () {
//         it('not array: triggers error', function () { expect(() => this.withRowHeights('cats')).to.throw(new RegExp('must be array')) })
//         it('not array of numbers: triggers error', function () { expect(() => this.withRowHeights(['cats', 'dogs'])).to.throw(new RegExp('must be integer')) })
//         it('array of numberic strings is ok', function () { expect(() => this.withRowHeights(['10', '20'])).not.to.throw() })
//         it('not correct length: trigger length must match error', function () { expect(() => this.withRowHeights([1])).to.throw(new RegExp('length must match')) })
//         it('too big with 0 padding:', function () { expect(() => this.withRowHeights([91, 10])).to.throw(new RegExp('sum.*exceeds table height')) })
//
//         it('too big with padding=1:', function () {
//           expect(() => this.withRowHeights([90, 10], 1)).to.throw(new RegExp('sum.*exceeds table height'))
//         })
//       })
//
//       describe('auto calculated:', function () {
//         it('divides the height evenly', function () {
//           this.makeTable({ height: 200, numRows: 2 })
//           expect(this.instance.config.table.rowHeights).to.deep.equal([100, 100])
//         })
//
//         it('rounds to lowest int', function () {
//           this.makeTable({ height: 100, numRows: 3 })
//           expect(this.instance.config.table.rowHeights).to.deep.equal([33, 33, 33])
//         })
//       })
//     })
//
//     describe('col widths:', function () {
//       beforeEach(function () {
//         this.withColWidths = function (colWidths, colPadding, width, height) {
//           if (colPadding == null) { colPadding = 0 }
//           if (width == null) { width = 100 }
//           if (height == null) { height = 100 }
//           const c = {
//             table: {
//               rows: [
//                 [this.gen.graphic(), this.gen.graphic()]
//               ],
//               colWidths
//             }
//           }
//           if (colPadding != null) { c.table.columnGutterLength = colPadding }
//           this.setup(c, width, height)
//         }
//       })
//
//       describe('invalid values:', function () {
//         it('not array: triggers error', function () { expect(() => this.withColWidths('cats')).to.throw(new RegExp('must be array')) })
//         it('not array of numbers: triggers error', function () { expect(() => this.withColWidths(['cats', 'dogs'])).to.throw(new RegExp('must be integer')) })
//         it('array of numberic strings is ok', function () { expect(() => this.withColWidths(['10', '20'])).not.to.throw() })
//         it('not correct length: trigger length must match error', function () { expect(() => this.withColWidths([1])).to.throw(new RegExp('length must match')) })
//         it('too big with 0 padding:', function () { expect(() => this.withColWidths([91, 10])).to.throw(new RegExp('sum.*exceeds table width')) })
//         it('too big with padding=1:', function () { expect(() => this.withColWidths([91, 10], 1)).to.throw(new RegExp('sum.*exceeds table width')) })
//       })
//
//       describe('auto calculated:', function () {
//         it('divides the width evenly', function () {
//           this.makeTable({ width: 200, numCols: 2 })
//           expect(this.instance.config.table.colWidths).to.deep.equal([100, 100])
//         })
//
//         it('rounds to lowest int', function () {
//           this.makeTable({ width: 100, numCols: 3 })
//           expect(this.instance.config.table.colWidths).to.deep.equal([33, 33, 33])
//         })
//       })
//     })
//
//     describe('horizontal table lines:', function () {
//       beforeEach(function () {
//         this.hLineWrapper = function (horizontalLines, rowPadding, linePadLeft, linePadRight, width, height) {
//           if (rowPadding == null) { rowPadding = 0 }
//           if (linePadLeft == null) { linePadLeft = 0 }
//           if (linePadRight == null) { linePadRight = 0 }
//           if (width == null) { width = 2000 }
//           if (height == null) { height = 2000 }
//           this.makeTable({
//             width,
//             height,
//             numRows: 4,
//             numCols: 1,
//             rowHeights: [100, 200, 300, 400],
//             rowGutterLength: rowPadding,
//             hLines: horizontalLines,
//             lPLeft: linePadLeft,
//             lPRight: linePadRight
//           })
//         }
//
//         this.linePosition = function (lineIndex, rowPadding = 0) {
//           this.hLineWrapper([lineIndex], rowPadding)
//           return this.instance.config.table.lines.horizontal[0].y1
//         }
//       })
//
//       it('line at -1', function () { expect(() => this.hLineWrapper([-1])).to.throw(new RegExp('past end of table')) })
//
//       it('line at bottom of table + 1', function () { expect(() => this.hLineWrapper([5])).to.throw(new RegExp('past end of table')) })
//
//       it('non numeric in line config', function () { expect(() => this.hLineWrapper(['cats'])).to.throw(new RegExp('must be numeric')) })
//
//       describe('no row padding:', function () {
//         it('line at 0', function () { expect(this.linePosition([0])).to.equal(0) })
//         it('line at 0.5', function () { expect(this.linePosition([0.5])).to.equal(50) })
//         it('line at 1', function () { expect(this.linePosition([1])).to.equal(0 + 100) })
//         it('line at 1.5', function () { expect(this.linePosition([1.5])).to.equal(0 + 100 + (200 / 2)) })
//         it('line at 2', function () { expect(this.linePosition([2])).to.equal(0 + 100 + 200) })
//         it('line at bottom', function () { expect(this.linePosition([4])).to.equal(0 + 100 + 200 + 300 + 400) })
//       })
//
//       describe('row padding =10:', function () {
//         it('line at 0', function () { expect(this.linePosition([0], 10)).to.equal(0) })
//         it('line at 0.5', function () { expect(this.linePosition([0.5], 10)).to.equal(50) })
//         it('line at 1', function () { expect(this.linePosition([1], 10)).to.equal(0 + 100 + (10 / 2)) })
//         it('line at 1.5', function () { expect(this.linePosition([1.5], 10)).to.equal(0 + 100 + 10 + (200 / 2)) })
//         it('line at 2', function () { expect(this.linePosition([2], 10)).to.equal(0 + 100 + 10 + 200 + (10 / 2)) })
//         it('line at bottom', function () { expect(this.linePosition([4], 10)).to.equal(0 + 100 + 10 + 200 + 10 + 300 + 10 + 400) })
//       })
//
//       describe('left/right padding:', function () {
//         it('adjusts the x1 and x2 line values based on the left/right padding values', function () {
//           this.hLineWrapper([0], 0, 20, 50, 2000)
//           expect(this.instance.config.table.lines.horizontal[0].x1).to.equal(0 + 20)
//           return expect(this.instance.config.table.lines.horizontal[0].x2).to.equal(2000 - 50)
//         })
//       })
//     })
//
//     describe('vertical table lines:', function () {
//       beforeEach(function () {
//         this.vLineWrapper = function (verticalLines, colPadding, linePadTop, linePadBottom, width, height) {
//           if (colPadding == null) { colPadding = 0 }
//           if (linePadTop == null) { linePadTop = 0 }
//           if (linePadBottom == null) { linePadBottom = 0 }
//           if (width == null) { width = 2000 }
//           if (height == null) { height = 2000 }
//           this.makeTable({
//             width,
//             height,
//             numRows: 1,
//             numCols: 4,
//             colWidths: [100, 200, 300, 400],
//             columnGutterLength: colPadding,
//             vLines: verticalLines,
//             lPTop: linePadTop,
//             lPBottom: linePadBottom
//           })
//         }
//
//         this.linePosition = function (lineIndex, colPadding = 0) {
//           this.vLineWrapper([lineIndex], colPadding)
//           return this.instance.config.table.lines.vertical[0].x1
//         }
//       })
//
//       it('line at -1', function () { expect(() => this.vLineWrapper([-1])).to.throw(new RegExp('past end of table')) })
//
//       it('line at bottom of table + 1', function () { expect(() => this.vLineWrapper([5])).to.throw(new RegExp('past end of table')) })
//
//       it('non numeric in line config', function () { expect(() => this.vLineWrapper(['cats'])).to.throw(new RegExp('must be numeric')) })
//
//       describe('no row padding:', function () {
//         it('line at 0', function () { expect(this.linePosition([0])).to.equal(0) })
//         it('line at 0.5', function () { expect(this.linePosition([0.5])).to.equal(50) })
//         it('line at 1', function () { expect(this.linePosition([1])).to.equal(0 + 100) })
//         it('line at 1.5', function () { expect(this.linePosition([1.5])).to.equal(0 + 100 + (200 / 2)) })
//         it('line at 2', function () { expect(this.linePosition([2])).to.equal(0 + 100 + 200) })
//         it('line at bottom', function () { expect(this.linePosition([4])).to.equal(0 + 100 + 200 + 300 + 400) })
//       })
//
//       describe('row padding =10:', function () {
//         it('line at 0', function () { expect(this.linePosition([0], 10)).to.equal(0) })
//         it('line at 0.5', function () { expect(this.linePosition([0.5], 10)).to.equal(50) })
//         it('line at 1', function () { expect(this.linePosition([1], 10)).to.equal(0 + 100 + (10 / 2)) })
//         it('line at 1.5', function () { expect(this.linePosition([1.5], 10)).to.equal(0 + 100 + 10 + (200 / 2)) })
//         it('line at 2', function () { expect(this.linePosition([2], 10)).to.equal(0 + 100 + 10 + 200 + (10 / 2)) })
//         it('line at bottom', function () { expect(this.linePosition([4], 10)).to.equal(0 + 100 + 10 + 200 + 10 + 300 + 10 + 400) })
//       })
//
//       describe('left/right padding:', () =>
//         it('adjusts the y1 and y2 line values based on the top/bottom padding values', function () {
//           this.vLineWrapper([0], 0, 20, 50, 2000, 2000)
//           expect(this.instance.config.table.lines.vertical[0].y1).to.equal(0 + 20)
//           expect(this.instance.config.table.lines.vertical[0].y2).to.equal(2000 - 50)
//         })
//       )
//     })
//
//     describe('cell placement:', function () {
//       beforeEach(function () {
//         this.placement = function (rowIndex, colIndex) {
//           return [
//             this.instance.config.table.rows[rowIndex][colIndex].x,
//             this.instance.config.table.rows[rowIndex][colIndex].y,
//             this.instance.config.table.rows[rowIndex][colIndex].width,
//             this.instance.config.table.rows[rowIndex][colIndex].height
//           ]
//         }
//       })
//
//       describe('simple table:', function () {
//         beforeEach(function () {
//           this.makeTable({ numRows: 2, numCols: 2, width: 1000, height: 1000 })
//         })
//
//         it('places cell 0,0 correctly', function () { expect(this.placement(0, 0)).to.deep.equal([0, 0, 500, 500]) })
//         it('places cell 0,1 correctly', function () { expect(this.placement(0, 1)).to.deep.equal([500, 0, 500, 500]) })
//         it('places cell 1,0 correctly', function () { expect(this.placement(1, 0)).to.deep.equal([0, 500, 500, 500]) })
//         it('places cell 1,1 correctly', function () { expect(this.placement(1, 1)).to.deep.equal([500, 500, 500, 500]) })
//       })
//
//       describe('specify rowHeight and ColWidth:', function () {
//         beforeEach(function () {
//           this.makeTable({
//             numRows: 2,
//             numCols: 2,
//             width: 1000,
//             height: 1000,
//             colWidths: [200, 100],
//             rowHeights: [50, 25]
//           })
//         })
//
//         it('places cell 0,0 correctly', function () { expect(this.placement(0, 0)).to.deep.equal([0, 0, 200, 50]) })
//         it('places cell 0,1 correctly', function () { expect(this.placement(0, 1)).to.deep.equal([200, 0, 100, 50]) })
//         it('places cell 1,0 correctly', function () { expect(this.placement(1, 0)).to.deep.equal([0, 50, 200, 25]) })
//         it('places cell 1,1 correctly', function () { expect(this.placement(1, 1)).to.deep.equal([200, 50, 100, 25]) })
//       })
//
//       // @TODO: This IMO demonstrates a bug. We were given h/w = 1000/1000,
//       // but we generated a graphic of 1010/1010 because of padding
//       describe('specify rowGutterLength and columnGutterLength:', function () {
//         beforeEach(function () {
//           this.makeTable({
//             numRows: 2,
//             numCols: 2,
//             height: 1000,
//             width: 1000,
//             rowGutterLength: 10,
//             columnGutterLength: 10
//           })
//         })
//
//         it('places cell 0,0 correctly', function () { expect(this.placement(0, 0)).to.deep.equal([0, 0, 500, 500]) })
//         it('places cell 0,1 correctly', function () { expect(this.placement(0, 1)).to.deep.equal([510, 0, 500, 500]) })
//         it('places cell 1,0 correctly', function () { expect(this.placement(1, 0)).to.deep.equal([0, 510, 500, 500]) })
//         it('places cell 1,1 correctly', function () { expect(this.placement(1, 1)).to.deep.equal([510, 510, 500, 500]) })
//       })
//     })
//   })
//
//   describe('e2e tests:', function () {
//     describe('label and graphic cells are generated and placed in correct cells:', function () {
//       beforeEach(function () {
//         $('body').append('<div class="outer-container">')
//
//         this.graphicSetConfigSpy = sinon.spy(GraphicCell.prototype, 'setConfig')
//         this.labelSetConfigSpy = sinon.spy(LabelCell.prototype, 'setConfig')
//
//         this.instance = new Pictograph($('.outer-container'), 500, 500)
//         this.instance.setConfig({
//           table: {
//             rows: [
//               [this.gen.label('label1'), this.gen.graphic({ variableImage: 'circle:red' })],
//               [this.gen.graphic({ variableImage: 'circle:blue' }), this.gen.label('label2')],
//               [{ type: 'empty' }]
//             ]
//           }
//         })
//
//         this.instance.draw()
//       })
//
//       afterEach(function () {
//         GraphicCell.prototype.setConfig.restore()
//         LabelCell.prototype.setConfig.restore()
//       })
//
//       it('has six table cells', function () { expect($('.table-cell').length).to.equal(6) })
//
//       it('labels each cell by row and column', function () {
//         expect($('.table-cell-0-0').length).to.equal(1)
//         expect($('.table-cell-0-1').length).to.equal(1)
//         expect($('.table-cell-1-0').length).to.equal(1)
//         expect($('.table-cell-1-1').length).to.equal(1)
//         expect($('.table-cell-1-2').length).to.equal(0)
//       })
//
//       it('add a "label" class to indicate label cell type', function () {
//         expect(document.querySelector('.table-cell-0-0')).to.have.class('label')
//         expect(document.querySelector('.table-cell-1-1')).to.have.class('label')
//       })
//
//       it('add a "graphic" class to indicate label cell type', function () {
//         expect(document.querySelector('.table-cell-0-1')).to.have.class('graphic')
//         expect(document.querySelector('.table-cell-1-0')).to.have.class('graphic')
//       })
//
//       it('add a "empty" class to indicate label cell empty', function () { expect(document.querySelector('.table-cell-2-0')).to.have.class('empty') })
//
//       it('adds a second empty cell to the third row to balance the table', function () { expect(document.querySelector('.table-cell-2-1')).to.have.class('empty') })
//
//       it('passes config to GraphicCell.setConfig', function () {
//         expect(this.graphicSetConfigSpy.firstCall.args[0].variableImage).to.equal('circle:red')
//         expect(this.graphicSetConfigSpy.secondCall.args[0].variableImage).to.equal('circle:blue')
//       })
//
//       it('passes config to LabelCell.setConfig', function () {
//         expect(this.labelSetConfigSpy.firstCall.args[0]).to.equal('label1')
//         expect(this.labelSetConfigSpy.secondCall.args[0]).to.equal('label2')
//       })
//     })
//   })
// })
