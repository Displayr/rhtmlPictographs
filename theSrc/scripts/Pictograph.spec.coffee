
describe 'Pictograph class:', ->

  beforeEach ->
    @gen =
      graphic: (config={ variableImage: '/image/foo' }) =>
        return { type: 'graphic', value: config }
      label: (config='label') =>
        return { type: 'label', value: config }

  describe '_processConfig():', ->

    beforeEach ->
      @instantiateAndSetConfigTo = (config, width=100, height=100) ->
        @instance = new Pictograph '<div class="outer-container">', width, height
        @instance.setConfig config

    describe 'non-json string config', ->

      beforeEach ->
        @instantiateAndSetConfigTo 'circle'

      it 'creates a single image graphic in a one row table', ->
        expect(@instance.config.table.rows[0][0]).to.deep.equal { type: 'graphic', value: { variableImage: 'circle' } }

    describe 'without "table" field:', ->

      beforeEach ->
        @instantiateAndSetConfigTo { variableImage: 'images/foo' }

      it 'creates a top level "table" config field', ->
        expect(@instance.config).to.have.property 'table'

      it 'the table field contains a rows field', ->
        expect(@instance.config.table).to.have.property 'rows'

      it 'there is one graphic cell in the table', ->
        expect(@instance.config.table.rows.length).to.equal 1
        expect(@instance.config.table.rows[0].length).to.equal 1
        expect(@instance.config.table.rows[0][0].type).to.equal 'graphic'

    describe 'using strings for row definitions:', ->

      beforeEach ->
        @instantiateAndSetConfigTo { table: { rows: [ [ "label:alabel", "circle" ] ] } }

      it 'creates a label in the first cell', ->
        expect(@instance.config.table.rows[0][0]).to.deep.equal { type: 'label', value: 'alabel' }

      it 'creates a graphic in the second cell', ->
        expect(@instance.config.table.rows[0][1]).to.deep.equal { type: 'graphic', value: { variableImage: 'circle' } }

    describe 'setting default css:', ->

      beforeEach ->
        @baseCellSetDefaultSpy = sinon.spy BaseCell, 'setDefault'
        @baseCellSetCssSpy = sinon.spy BaseCell.prototype, 'setCss'

        @instantiateAndSetConfigTo { variableImage: 'images/foo' }

        @defaultWasSet = (param) ->
          defaultsThatWereSet = @baseCellSetDefaultSpy.args.map (callValues) -> callValues[0]
          expect(defaultsThatWereSet).to.include param

        @cssWasSet = (param) ->
          cssThatWasSet = @baseCellSetCssSpy.args.map (callValues) -> callValues[1]
          expect(cssThatWasSet).to.include param

      afterEach ->
        BaseCell.setDefault.restore()
        BaseCell.prototype.setCss.restore()

      it 'sets font-family to something', -> @cssWasSet 'font-family'
      it 'sets font-weight to something', -> @cssWasSet 'font-weight'
      it 'sets font-size default to something', -> @defaultWasSet 'font-size'
      it 'sets font-color to something', -> @cssWasSet 'font-color'

    describe 'setting custom css:', ->

      beforeEach ->
        @baseCellSetCssSpy = sinon.spy BaseCell.prototype, 'setCss'

        @instantiateAndSetConfigTo
          table: rows: [ [ 'url:/images/foo' ] ]
          css: {
            "cssLocation1" : { "cssAttr1" : "cssValue1", "cssAttr2" : "cssValue2" }
            "cssLocation2" : { "cssAttr3" : "cssValue3", "cssAttr4" : "cssValue4" }
          }

        @verifyCss = (location, attr, value) ->
          expect(@baseCellSetCssSpy).to.have.been.calledWith location, attr, value

      afterEach ->
        BaseCell.prototype.setCss.restore()

      it 'set css attr1 on css location 1', -> @verifyCss 'cssLocation1', 'cssAttr1', 'cssValue1'
      it 'set css attr2 on css location 1', -> @verifyCss 'cssLocation1', 'cssAttr2', 'cssValue2'
      it 'set css attr3 on css location 2', -> @verifyCss 'cssLocation2', 'cssAttr3', 'cssValue3'
      it 'set css attr4 on css location 2', -> @verifyCss 'cssLocation2', 'cssAttr4', 'cssValue4'

    it 'fails on unknown root attributes', ->
      badConfig = { table: { rows: [[]] }, foo: 'bar' }
      expect(=> @instantiateAndSetConfigTo badConfig).to.throw(/foo/)

    it 'fails on unknown table attributes', ->
      badConfig = { table: { rows: [[]], foo: 'bar' } }
      expect(=> @instantiateAndSetConfigTo badConfig).to.throw(/foo/)

  describe '_computeTableLayout():', ->

    beforeEach ->
      @setup = (config, width=100, height=100) ->
        @instance = new Pictograph '<div class="outer-container">', width, height
        @instance.setConfig config
        @instance._computeTableLayout()

      #params:
      #  - 'width=1000'
      #  - 'height=1000'
      #  - 'numRows=2'
      #  - 'numCols=2'
      #  - 'rowHeights'
      #  - 'colWidths'
      #  - 'rowGutterLength'
      #  - 'columnGutterLength'
      #  - 'lPLeft'
      #  - 'lPRight'
      #  - 'lPTop'
      #  - 'lPBottom'
      #  - 'hLines'
      #  - 'vLines'
      @makeTable = (c) ->
        tableConfig =
          table:
            rows: []

        for key in ['rowHeights', 'colWidths', 'rowGutterLength', 'columnGutterLength']
          tableConfig.table[key] = c[key] if c[key]?

        for i in _.range(0, c.numRows || 2)
          tableConfig.table.rows.push([])
          for j in _.range(0, c.numCols || 2)
            tableConfig.table.rows[i].push @gen.graphic()

        tableConfig.table.lines ?= {}
        for {alias, setting} in [
          { alias: 'lPLeft', setting: 'padding-left'}
          { alias: 'lPRight', setting: 'padding-right'}
          { alias: 'lPTop', setting: 'padding-top'}
          { alias: 'lPBottom', setting: 'padding-bottom'}
        ]
          tableConfig.table.lines[setting] = c[alias] if c[alias]?

        tableConfig.table.lines.horizontal = c.hLines if c.hLines?
        tableConfig.table.lines.vertical = c.vLines if c.vLines?

        @instance = new Pictograph '<div class="outer-container">', c.width || 1000, c.height || 1000
        @instance.setConfig tableConfig
        @instance._computeTableLayout()

      @badConfig = (c) ->
        return => @setup c

    describe 'invalid rows definition:', ->
      it 'throws error if row is not array', ->
        expect(@badConfig { table: rows: ['dogs'] }).to.throw(new RegExp 'row 0 must be array')

    describe 'jagged table:', ->
      it 'fills rows with empty columns to balance table', ->
        jaggedRows = [
          [@gen.graphic(), @gen.graphic()],
          [@gen.graphic()]
        ]
        @setup { table: rows: jaggedRows }
        expect(@instance.config.table.rows[1][1].type).to.deep.equal 'empty'
        expect(@instance.config.table.rows[1].length).to.equal 2

    describe 'row heights:', ->

      beforeEach ->
        @withRowHeights = (rowHeights, rowPadding, width=100, height=100) ->
          c = {
            table:
              rows: [
                [@gen.graphic()]
                [@gen.graphic()]
              ]
              rowHeights: rowHeights
          }
          c.table.rowGutterLength = rowPadding if rowPadding?
          @setup c, width, height

      describe 'invalid values:', ->
        it 'not array: triggers error', ->
          expect(=> @withRowHeights 'cats').to.throw(new RegExp 'must be array')

        it 'not array of numbers: triggers error', ->
          expect(=> @withRowHeights ['cats', 'dogs']).to.throw(new RegExp 'must be integer')

        it 'array of numberic strings is ok', ->
          expect(=> @withRowHeights ['10', '20']).not.to.throw()

        it 'not correct length: trigger length must match error', ->
          expect(=> @withRowHeights [1]).to.throw(new RegExp 'length must match')

        it 'too big with 0 padding:', ->
          expect(=> @withRowHeights [91, 10]).to.throw(new RegExp 'sum.*exceeds table height')

        it 'too big with padding=1:', ->
          expect(=> @withRowHeights [90,10], rowPadding=1).to.throw(new RegExp 'sum.*exceeds table height')

      describe 'auto calculated:', ->
        it 'divides the height evenly', ->
          @makeTable { height: 200, numRows: 2 }
          expect(@instance.config.table.rowHeights).to.deep.equal [100, 100]

        it 'rounds to lowest int', ->
          @makeTable { height: 100, numRows: 3 }
          expect(@instance.config.table.rowHeights).to.deep.equal [33, 33, 33]

    describe 'col widths:', ->

      beforeEach ->
        @withColWidths = (colWidths, colPadding=0, width=100, height=100) ->
          c = {
            table:
              rows: [
                [@gen.graphic(), @gen.graphic()]
              ]
              colWidths: colWidths
          }
          c.table.columnGutterLength = colPadding if colPadding?
          @setup c, width, height

      describe 'invalid values:', ->
        it 'not array: triggers error', ->
          expect(=> @withColWidths 'cats').to.throw(new RegExp 'must be array')

        it 'not array of numbers: triggers error', ->
          expect(=> @withColWidths ['cats', 'dogs']).to.throw(new RegExp 'must be integer')

        it 'array of numberic strings is ok', ->
          expect(=> @withColWidths ['10', '20']).not.to.throw()

        it 'not correct length: trigger length must match error', ->
          expect(=> @withColWidths [1]).to.throw(new RegExp 'length must match')

        it 'too big with 0 padding:', ->
          expect(=> @withColWidths [91, 10]).to.throw(new RegExp 'sum.*exceeds table width')

        it 'too big with padding=1:', ->
          expect(=> @withColWidths [91, 10], 1).to.throw(new RegExp 'sum.*exceeds table width')

      describe 'auto calculated:', ->
        it 'divides the width evenly', ->
          @makeTable { width: 200, numCols: 2 }
          expect(@instance.config.table.colWidths).to.deep.equal [100, 100]

        it 'rounds to lowest int', ->
          @makeTable { width: 100, numCols: 3 }
          expect(@instance.config.table.colWidths).to.deep.equal [33, 33, 33]

    describe 'horizontal table lines:', ->

      beforeEach ->
        @hLineWrapper = (horizontalLines, rowPadding=0, linePadLeft=0, linePadRight=0, width=2000, height=2000) ->
          @makeTable {
            width: width
            height: height
            numRows: 4
            numCols: 1
            rowHeights: [100,200,300,400]
            rowGutterLength: rowPadding
            hLines: horizontalLines
            lPLeft: linePadLeft
            lPRight: linePadRight
          }

        @linePosition = (lineIndex, rowPadding=0) ->
          @hLineWrapper [lineIndex], rowPadding
          return @instance.config.table.lines.horizontal[0].y1

      it 'line at -1', ->
        expect(=> @hLineWrapper [-1]).to.throw(new RegExp 'past end of table')

      it 'line at bottom of table + 1', ->
        expect(=> @hLineWrapper [5]).to.throw(new RegExp 'past end of table')

      it 'non numeric in line config', ->
        expect(=> @hLineWrapper ['cats']).to.throw(new RegExp 'must be numeric')

      describe 'no row padding:', ->
        it 'line at 0',      -> expect(@linePosition [0]).to.equal 0
        it 'line at 0.5',    -> expect(@linePosition [0.5]).to.equal 50
        it 'line at 1',      -> expect(@linePosition [1]).to.equal 0 + 100
        it 'line at 1.5',    -> expect(@linePosition [1.5]).to.equal 0 + 100 + 200/2
        it 'line at 2',      -> expect(@linePosition [2]).to.equal 0 + 100 + 200
        it 'line at bottom', -> expect(@linePosition [4]).to.equal 0 + 100 + 200 + 300 + 400

      describe 'row padding =10:', ->
        it 'line at 0',      -> expect(@linePosition [0], rowPadding=10).to.equal 0
        it 'line at 0.5',    -> expect(@linePosition [0.5], rowPadding=10).to.equal 50
        it 'line at 1',      -> expect(@linePosition [1], rowPadding=10).to.equal 0 + 100 + 10/2
        it 'line at 1.5',    -> expect(@linePosition [1.5], rowPadding=10).to.equal 0 + 100 + 10 + 200/2
        it 'line at 2',      -> expect(@linePosition [2], rowPadding=10).to.equal 0 + 100 + 10 + 200 + 10/2
        it 'line at bottom', -> expect(@linePosition [4], rowPadding=10).to.equal 0 + 100 + 10 + 200 + 10 + 300 + 10 + 400

      describe 'left/right padding:', ->
        it 'adjusts the x1 and x2 line values based on the left/right padding values', ->
          @hLineWrapper [0], rowPadding=0, leftPad=20, rightPad=50, width=2000
          expect(@instance.config.table.lines.horizontal[0].x1).to.equal 0 + 20
          expect(@instance.config.table.lines.horizontal[0].x2).to.equal 2000 - 50

    describe 'vertical table lines:', ->

      beforeEach ->
        @vLineWrapper = (verticalLines, colPadding=0, linePadTop=0, linePadBottom=0, width=2000, height=2000) ->
          @makeTable {
            width: width
            height: height
            numRows: 1
            numCols: 4
            colWidths: [100,200,300,400]
            columnGutterLength: colPadding
            vLines: verticalLines
            lPTop: linePadTop
            lPBottom: linePadBottom
          }

        @linePosition = (lineIndex, colPadding=0) ->
          @vLineWrapper [lineIndex], colPadding
          return @instance.config.table.lines.vertical[0].x1

      it 'line at -1', ->
        expect(=> @vLineWrapper [-1]).to.throw(new RegExp 'past end of table')

      it 'line at bottom of table + 1', ->
        expect(=> @vLineWrapper [5]).to.throw(new RegExp 'past end of table')

      it 'non numeric in line config', ->
        expect(=> @vLineWrapper ['cats']).to.throw(new RegExp 'must be numeric')

      describe 'no row padding:', ->
        it 'line at 0',      -> expect(@linePosition [0]).to.equal 0
        it 'line at 0.5',    -> expect(@linePosition [0.5]).to.equal 50
        it 'line at 1',      -> expect(@linePosition [1]).to.equal 0 + 100
        it 'line at 1.5',    -> expect(@linePosition [1.5]).to.equal 0 + 100 + 200/2
        it 'line at 2',      -> expect(@linePosition [2]).to.equal 0 + 100 + 200
        it 'line at bottom', -> expect(@linePosition [4]).to.equal 0 + 100 + 200 + 300 + 400

      describe 'row padding =10:', ->
        it 'line at 0',      -> expect(@linePosition [0], colPadding=10).to.equal 0
        it 'line at 0.5',    -> expect(@linePosition [0.5], colPadding=10).to.equal 50
        it 'line at 1',      -> expect(@linePosition [1], colPadding=10).to.equal 0 + 100 + 10/2
        it 'line at 1.5',    -> expect(@linePosition [1.5], colPadding=10).to.equal 0 + 100 + 10 + 200/2
        it 'line at 2',      -> expect(@linePosition [2], colPadding=10).to.equal 0 + 100 + 10 + 200 + 10/2
        it 'line at bottom', -> expect(@linePosition [4], colPadding=10).to.equal 0 + 100 + 10 + 200 + 10 + 300 + 10 + 400

      describe 'left/right padding:', ->
        it 'adjusts the y1 and y2 line values based on the top/bottom padding values', ->
          @vLineWrapper [0], rowPadding=0, topPad=20, bottomPad=50, width=2000, height=2000
          expect(@instance.config.table.lines.vertical[0].y1).to.equal 0 + 20
          expect(@instance.config.table.lines.vertical[0].y2).to.equal 2000 - 50

    describe 'cell placement:', ->
      beforeEach ->
        @placement = (rowIndex,colIndex) ->
          return [
            @instance.config.table.rows[rowIndex][colIndex].x
            @instance.config.table.rows[rowIndex][colIndex].y
            @instance.config.table.rows[rowIndex][colIndex].width
            @instance.config.table.rows[rowIndex][colIndex].height
          ]

      describe 'simple table:', ->
        beforeEach ->
          @makeTable { numRows: 2, numCols: 2, width: 1000, height: 1000 }

        it 'places cell 0,0 correctly', -> expect(@placement(0,0)).to.deep.equal [0  ,  0,500,500]
        it 'places cell 0,1 correctly', -> expect(@placement(0,1)).to.deep.equal [500,  0,500,500]
        it 'places cell 1,0 correctly', -> expect(@placement(1,0)).to.deep.equal [0  ,500,500,500]
        it 'places cell 1,1 correctly', -> expect(@placement(1,1)).to.deep.equal [500,500,500,500]

      describe 'specify rowHeight and ColWidth:', ->
        beforeEach ->
          @makeTable { numRows: 2, numCols: 2, width: 1000, height: 1000, colWidths: [200,100], rowHeights: [50,25] }

        it 'places cell 0,0 correctly', -> expect(@placement(0,0)).to.deep.equal [0  ,  0,200,50]
        it 'places cell 0,1 correctly', -> expect(@placement(0,1)).to.deep.equal [200,  0,100,50]
        it 'places cell 1,0 correctly', -> expect(@placement(1,0)).to.deep.equal [0  ,50 ,200,25]
        it 'places cell 1,1 correctly', -> expect(@placement(1,1)).to.deep.equal [200,50 ,100,25]


      # @TODO: This IMO demonstrates a bug. We were given h/w = 1000/1000,
      # but we generated a graphic of 1010/1010 because of padding
      describe 'specify rowGutterLength and columnGutterLength:', ->
        beforeEach ->
          @makeTable { numRows: 2, numCols: 2, height: 1000, width: 1000, rowGutterLength: 10, columnGutterLength: 10 }

        it 'places cell 0,0 correctly', -> expect(@placement(0,0)).to.deep.equal [0  ,  0,500,500]
        it 'places cell 0,1 correctly', -> expect(@placement(0,1)).to.deep.equal [510,  0,500,500]
        it 'places cell 1,0 correctly', -> expect(@placement(1,0)).to.deep.equal [0  ,510,500,500]
        it 'places cell 1,1 correctly', -> expect(@placement(1,1)).to.deep.equal [510,510,500,500]

  describe 'e2e tests:', ->

    describe 'label and graphic cells are generated and placed in correct cells:', ->

      beforeEach ->

        $('body').append('<div class="outer-container">')

        @graphicSetConfigSpy = sinon.spy GraphicCell.prototype, 'setConfig'
        @labelSetConfigSpy = sinon.spy LabelCell.prototype, 'setConfig'

        @instance = new Pictograph $('.outer-container'), 500, 500
        @instance.setConfig {
          table:
            rows: [
              [@gen.label('label1'), @gen.graphic({ 'variableImage': 'circle:red' })]
              [@gen.graphic({ 'variableImage': 'circle:blue' }), @gen.label('label2')]
              [{ type: 'empty' }]
            ]
        }

        @instance.draw()

      afterEach ->
        GraphicCell.prototype.setConfig.restore()
        LabelCell.prototype.setConfig.restore()

      it 'has six table cells', ->
        expect($('.table-cell').length).to.equal 6

      it 'labels each cell by row and column', ->
        #not sure twhy there are two of everything. Test artifact
        expect($('.table-cell-0-0').length).to.be.above 1
        expect($('.table-cell-0-1').length).to.be.above 1
        expect($('.table-cell-1-0').length).to.be.above 1
        expect($('.table-cell-1-1').length).to.be.above 1
        expect($('.table-cell-1-2').length).to.equal 0

      it 'add a "label" class to indicate label cell type', ->
        expect(document.querySelector('.table-cell-0-0')).to.have.class 'label'
        expect(document.querySelector('.table-cell-1-1')).to.have.class 'label'

      it 'add a "graphic" class to indicate label cell type', ->
        expect(document.querySelector('.table-cell-0-1')).to.have.class 'graphic'
        expect(document.querySelector('.table-cell-1-0')).to.have.class 'graphic'

      it 'add a "empty" class to indicate label cell empty', ->
        expect(document.querySelector('.table-cell-2-0')).to.have.class 'empty'

      it 'adds a second empty cell to the third row to balance the table', ->
        expect(document.querySelector('.table-cell-2-1')).to.have.class 'empty'

      it 'passes config to GraphicCell.setConfig', ->
        expect(@graphicSetConfigSpy.firstCall.args[0].variableImage).to.equal 'circle:red'
        expect(@graphicSetConfigSpy.secondCall.args[0].variableImage).to.equal 'circle:blue'

      it 'passes config to LabelCell.setConfig', ->
        expect(@labelSetConfigSpy.firstCall.args[0]).to.equal 'label1'
        expect(@labelSetConfigSpy.secondCall.args[0]).to.equal 'label2'
