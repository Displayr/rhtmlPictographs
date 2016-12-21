
class Pictograph extends RhtmlSvgWidget

  @validRootAttributes = [
    'background-color'
    'css'
    'font-color'
    'font-family'
    'font-size'
    'font-weight'
    'table'
    'table-id'
    'resizable'
    'preserveAspectRatio'
  ]

  @validTableAttributes = [
    'colors'
    'columnGutterLength'
    'colWidths'
    'lines'
    'rowGutterLength'
    'rowHeights'
    'rows'
  ]

  constructor: (el, width, height) ->
    super el, width, height
    @_initializeSizing width, height

  #Push to SVG class
  _initializeSizing: (initialWidth, initialHeight) ->
    @sizes =
      specifiedContainerWidth: initialWidth
      specifiedContainerHeight: initialHeight

      actualWidth: initialWidth # we will override this with data from jquery
      actualHeight: initialHeight # we will override this with data from jquery

      viewBoxWidth: initialWidth
      viewBoxHeight: initialHeight

      ratios:
        textSize: null
        containerDelta: #NB this represents "on each resize how did size change"
          width: null
          height: null
        containerToViewBox: #NB this is ratio between current Actual, and the viewBox
          width: null
          height: null

  _recomputeSizing: (newSpecifiedWidth, newSpecifiedHeight) ->
    rootElement = $("##{@config['table-id']}")
    newActualWidth = rootElement.width()
    newActualHeight = rootElement.height()

    @sizes.ratios.containerToViewBox.width = newActualWidth * 1.0 / @sizes.viewBoxWidth
    @sizes.ratios.containerToViewBox.height = newActualHeight * 1.0 / @sizes.viewBoxHeight
    @sizes.ratios.containerDelta.width = newActualWidth * 1.0 / @sizes.actualWidth
    @sizes.ratios.containerDelta.height = newActualHeight * 1.0 / @sizes.actualHeight

    @sizes.actualWidth = newActualWidth
    @sizes.actualHeight = newActualHeight
    @sizes.newSpecifiedWidth = newSpecifiedWidth if newSpecifiedWidth
    @sizes.newSpecifiedHeight = newSpecifiedHeight if newSpecifiedHeight

    #TODO do I need to check for preserveAspectRatio and if == node then always take height ?
    @sizes.ratios.textSize = 1.0 / Math.min(@sizes.ratios.containerToViewBox.width, @sizes.ratios.containerToViewBox.height)

# NB still not convinced displayr is working as advertised. If we encounter resize flicker issues uncomment these
#    console.log("pictograph recompute size complete:")
#    console.log(JSON.stringify @sizes, {}, 2)

  resize: (newSpecifiedWidth, newSpecifiedHeight) ->
    return if @config['resizable'] is false

    @_recomputeSizing newSpecifiedWidth, newSpecifiedHeight

    for cellInstance in @cellInstances
      cellInstance.resize @sizes

  # NB I am overriding this method from the baseclass so I can support string input
  setConfig: (@config) ->
    if _.isString @config
      @config = variableImage: @config
    super(@config)

  _processConfig: () ->
    #do not accept width and height from config, they were passed to constructor
    delete @config.width
    delete @config.height

    unless @config['table']?

      keysToKeepInPictograph = _.difference Pictograph.validRootAttributes, GraphicCell.validRootAttributes

      newConfig = _.pick @config, keysToKeepInPictograph
      newConfig.table = rows: [[ { type: 'graphic', value: _.omit(@config, keysToKeepInPictograph) } ]]
      @config = newConfig

    invalidRootAttributes = _.difference _.keys(@config), Pictograph.validRootAttributes
    if invalidRootAttributes.length > 0
      throw new Error "Invalid attribute(s): #{JSON.stringify invalidRootAttributes}"

    invalidTableAttributes = _.difference _.keys(@config.table), Pictograph.validTableAttributes
    if invalidTableAttributes.length > 0
      throw new Error "Invalid table attribute(s): #{JSON.stringify invalidTableAttributes}"

    @config['resizable'] = true if @config['resizable'] is 'true'
    @config['resizable'] = false if @config['resizable'] is 'false'
    @config['resizable'] = true unless @config['resizable']?
    throw new Error 'resizable must be [true|false]' unless _.isBoolean(@config['resizable'])

    #@TODO extract CssCollector from BaseCell. This is hacky
    @cssCollector = new BaseCell(null, "#{@config['table-id']}",fakeWidth=1,fakeHeight=1)
    @cssCollector._draw = () -> _.noop

    pictographDefaults = {
      'font-family': 'Verdana,sans-serif'
      'font-weight': '900'
      'font-size': '24px'
      'font-color': 'black'
    }

    throw new Error "Must specify 'table.rows'" unless @config.table.rows?

    @numTableRows = @config.table.rows.length
    @numTableCols = Math.max.apply(null, @config.table.rows.map( (row) -> row.length ))
    @config.table.rows.forEach (row, rowIndex) =>

      unless _.isArray row
        throw new Error "Invalid rows spec: row #{rowIndex} must be array of cell definitions"

      if @numTableCols != row.length
        row.push({ type: 'empty' }) for i in [row.length...@numTableCols]

      @config.table.rows[rowIndex] = row.map (cellDefinition) =>
        if _.isString cellDefinition
          return @_convertStringDefinitionToCellDefinition cellDefinition
        else
          return cellDefinition

    _.forEach pictographDefaults, (defaultValue, cssAttribute) =>
      cssValue = if @config[cssAttribute] then @config[cssAttribute] else defaultValue

      #NB font-size must be explicitly provided to child cells, because it is required for calculating height offsets
      # whereas other css values we can leave them implicitly set via CSS inheritance
      # also font-size must be a string (containing a number), so cast it to string
      # TODO explain why font-size cant be used here.
      if cssAttribute is 'font-size'
        BaseCell.setDefault cssAttribute, "#{cssValue}"
      else
        @cssCollector.setCss '', cssAttribute, cssValue

    if @config['css']
      _.forEach @config['css'], (cssBlock, cssLocationString) =>
        _.forEach cssBlock, (cssValue, cssAttribute) =>
          @cssCollector.setCss cssLocationString, cssAttribute, cssValue

    ColorFactory.processNewConfig(@config.table.colors) if @config.table.colors

  _convertStringDefinitionToCellDefinition: (stringDefinition) ->
    if stringDefinition.startsWith "label:"
      return {
        type: 'label'
        value: stringDefinition.replace(/^label:/,'')
      }

    return {
      type: 'graphic'
      value: { variableImage: stringDefinition }
    }

  #@TODO I am a beast of a 100 line function. Could create a custom layout function, could combine with d3-grid
  _computeTableLayout: () ->

    numGuttersAtIndex = (index) -> index

    @_verifyKeyIsInt @config.table, 'rowGutterLength', 0
    @_verifyKeyIsInt @config.table, 'columnGutterLength', 0

    if @config.table.rowHeights
      #@TODO: verify and cast Array values to Ints
      unless _.isArray @config.table.rowHeights
        throw new Error "rowHeights must be array"

      unless @config.table.rowHeights.length == @numTableRows
        throw new Error "rowHeights length must match num rows specified"

      @config.table.rowHeights = @config.table.rowHeights.map (candidate) ->
        rowHeight = parseInt candidate
        if _.isNaN rowHeight
          throw new Error "Invalid rowHeight '#{candidate}': must be integer"
        rowHeight

      sumSpecified = _.sum(@config.table.rowHeights) + (@numTableRows-1) * @config.table.rowGutterLength
      unless sumSpecified <= @initialHeight
        throw new Error "Cannot specify rowHeights/rowGutterLength where sum(rows+padding) exceeds table height: #{sumSpecified} !< #{@initialHeight}"

    else
      @config.table.rowHeights = [1..@numTableRows].map ( => parseInt(@initialHeight / @numTableRows) )

    if @config.table.colWidths
      #@TODO: verify and cast Array values to Ints
      unless _.isArray @config.table.colWidths
        throw new Error "colWidths must be array"

      unless @config.table.colWidths.length == @numTableCols
        throw new Error "colWidths length must match num columns specified"

      @config.table.colWidths = @config.table.colWidths.map (candidate) ->
        colWidth = parseInt candidate
        if _.isNaN colWidth
          throw new Error "Invalid colWidth '#{candidate}': must be integer"
        colWidth

      sumSpecified = _.sum(@config.table.colWidths) + (@numTableCols-1) * @config.table.columnGutterLength
      unless sumSpecified <= @initialWidth
        throw new Error "Cannot specify colWidths/columnGutterLength where sum(cols+padding) exceeds table width: : #{sumSpecified} !< #{@initialWidth}"

    else
      @config.table.colWidths = [1..@numTableCols].map ( => parseInt(@initialWidth / @numTableCols) )

    @config.table.lines = {} unless @config.table.lines
    @config.table.lines.horizontal = (@config.table.lines.horizontal || []).sort()
    @config.table.lines.vertical = (@config.table.lines.vertical || []).sort()

    ["padding-left", "padding-right", "padding-top", "padding-bottom"].forEach (attr) =>
      @_verifyKeyIsInt @config.table.lines, attr, 0

    calcLineVariableDimension = (linePosition, cellSizes, paddingSize) ->
      numCellsPast = Math.floor(linePosition)
      fractionOfCell = linePosition - numCellsPast

      sizeOfNumCellsPast = _.sum(_.slice(cellSizes, 0, numCellsPast))

      sizeOfGuttersPast = 0
      if numCellsPast > 0 and numCellsPast < cellSizes.length
        sizeOfGuttersPast = numGuttersAtIndex(numCellsPast) * paddingSize - 0.5 * paddingSize
      else if numCellsPast > 0 and numCellsPast == cellSizes.length
        sizeOfGuttersPast = numGuttersAtIndex(numCellsPast - 1) * paddingSize

      sizeOfFraction = 0
      if numCellsPast == 0
        sizeOfFraction = fractionOfCell * cellSizes[numCellsPast]
      else if numCellsPast < cellSizes.length
        sizeOfFraction = fractionOfCell * (cellSizes[numCellsPast] + paddingSize)

      return sizeOfNumCellsPast + sizeOfGuttersPast + sizeOfFraction

    @config.table.lines.horizontal = @config.table.lines.horizontal.map (lineIndexCandidate) =>

      lineIndex = parseFloat lineIndexCandidate
      if _.isNaN lineIndex
        throw new Error "Invalid vertical line position '#{lineIndexCandidate}': must be numeric"

      if lineIndex > @numTableRows or lineIndex < 0
        throw new Error "Cannot create line at '#{lineIndex}': past end of table"

      y = calcLineVariableDimension lineIndex, @config.table.rowHeights, @config.table.rowGutterLength
      return {
        position: lineIndex
        x1: 0 + @config.table.lines['padding-left']
        x2: @initialWidth - @config.table.lines['padding-right']
        y1: y
        y2: y
        style: @config.table.lines.style || "stroke:black;stroke-width:2"
      }

    @config.table.lines.vertical = @config.table.lines.vertical.map (lineIndexCandidate) =>

      lineIndex = parseFloat lineIndexCandidate
      if _.isNaN lineIndex
        throw new Error "Invalid vertical line position '#{lineIndexCandidate}': must be numeric"

      if lineIndex > @numTableCols  or lineIndex < 0
        throw new Error "Cannot create line at '#{lineIndex}': past end of table"

      x = calcLineVariableDimension lineIndex, @config.table.colWidths, @config.table.columnGutterLength
      return {
        position: lineIndex
        x1: x
        x2: x
        y1: 0 + @config.table.lines['padding-top']
        y2: @initialHeight - @config.table.lines['padding-bottom']
        style: @config.table.lines.style || "stroke:black;stroke-width:2"
      }

    @config.table.rows.forEach (row, rowIndex) =>
      row.forEach (cell, columnIndex) =>
        cell.x = _.sum( _.slice(@config.table.colWidths, 0, columnIndex)) + numGuttersAtIndex(columnIndex) * @config.table.columnGutterLength
        cell.y = _.sum( _.slice(@config.table.rowHeights, 0, rowIndex)) + numGuttersAtIndex(rowIndex) * @config.table.rowGutterLength
        cell.width = @config.table.colWidths[columnIndex]
        cell.height = @config.table.rowHeights[rowIndex]
        cell.row = rowIndex
        cell.col = columnIndex

  _redraw: () ->
    @cssCollector.draw()
    @_computeTableLayout()
    @_recomputeSizing()

    tableCells = _.flatten(@config.table.rows)

    addLines = (lineType, data) =>
      @outerSvg.selectAll(".#{lineType}")
        .data data
        .enter()
        .append 'line'
          .attr 'x1', (d) -> d.x1
          .attr 'x2', (d) -> d.x2
          .attr 'y1', (d) -> d.y1
          .attr 'y2', (d) -> d.y2
          .attr 'style', (d) -> d.style
          .attr 'class', (d) -> "line #{lineType} line-#{d.position}"

    if @config['background-color']
      @outerSvg.append 'svg:rect'
      .attr 'class', 'background'
      .attr 'width', @initialWidth
      .attr 'height', @initialHeight
      .attr 'fill', @config['background-color']

    addLines 'horizontal-line', @config.table.lines.horizontal
    addLines 'vertical-line', @config.table.lines.vertical

    enteringCells = @outerSvg.selectAll('.table-cell')
      .data tableCells
      .enter()
      .append 'g'
        .attr 'class', 'table-cell'
        .attr 'transform', (d) ->
          return "translate(" + d.x + "," + d.y + ")"

    tableId = @config['table-id']
    @cellInstances = []
    cellInstances = @cellInstances
    sizes = @sizes
    enteringCells.each (d, i) ->

      cssWrapperClass = "table-cell-#{d.row}-#{d.col}"
      d3.select(this).classed cssWrapperClass, true

      if d.type is 'graphic'
        d3.select(this).classed 'graphic', true
        graphic = new GraphicCell d3.select(this), [tableId, cssWrapperClass], d.width, d.height, sizes
        graphic.setConfig d.value
        graphic.draw()
        cellInstances.push graphic

      else if d.type is 'label'
        d3.select(this).classed 'label', true
        label = new LabelCell d3.select(this), [tableId, cssWrapperClass], d.width, d.height, sizes
        label.setConfig d.value
        label.draw()
        cellInstances.push label

      else if d.type is 'empty'
        d3.select(this).classed 'empty', true

      else
        throw new Error "Invalid cell definition: #{JSON.stringify(d)} : missing or invalid type"

    return null

  _verifyKeyIsInt: (input, key, defaultValue, message='Must be integer') ->
    if !_.isUndefined defaultValue
      unless _.has input, key
        input[key] = defaultValue
        return

    if _.isNaN parseInt input[key]
      throw new Error "invalid '#{key}': #{input[key]}. #{message}."

    input[key] = parseInt input[key]
    return
