
class GraphicCell extends BaseCell

  @validRootAttributes = [
    'background-color',
    'baseImage',
    'columnGutter',
    'debugBorder',
    'font-color',
    'font-family',
    'font-size',
    'font-weight',
    'layout',
    'numCols',
    'numImages',
    'numRows',
    'padding',
    'proportion',
    'rowGutter',
    'image-background-color',
    'text-footer',
    'text-header',
    'text-overlay',
    'variableImage'
  ]

  setConfig: (config) ->
    @config = _.cloneDeep config

    invalidRootAttributes = _.difference _.keys(@config), GraphicCell.validRootAttributes
    if invalidRootAttributes.length > 0
      throw new Error "Invalid attribute(s): #{JSON.stringify invalidRootAttributes}"

    throw new Error "Must specify 'variableImage'" unless @config.variableImage?

    if _.isString(@config['proportion']) and @config['proportion'].startsWith('=')
      @config['proportion'] = eval(@config['proportion'].substring(1))

    @_verifyKeyIsFloat @config, 'proportion', 1, 'Must be number between 0 and 1'
    @_verifyKeyIsRatio @config, 'proportion'

    @_verifyKeyIsPositiveInt @config, 'numImages', 1
    @_verifyKeyIsPositiveInt(@config, 'numRows', 1) if @config['numRows']?
    @_verifyKeyIsPositiveInt(@config, 'numCols', 1) if @config['numCols']?
    if @config['numRows']? and @config['numCols']?
      throw new Error "Cannot specify both numRows and numCols. Choose one, and use numImages to control exact dimensions."

    @_verifyKeyIsFloat @config, 'columnGutter', 0.05, 'Must be number between 0 and 1'
    @_verifyKeyIsRatio @config, 'columnGutter'
    @_verifyKeyIsFloat @config, 'rowGutter', 0.05, 'Must be number between 0 and 1'
    @_verifyKeyIsRatio @config, 'rowGutter'

    @_processTextConfig 'text-header'
    @_processTextConfig 'text-overlay'
    @_processTextConfig 'text-footer'

    if (@config.padding)
      [paddingTop, paddingRight, paddingBottom, paddingLeft] = @config.padding.split(" ")

      @config.padding = {
        top: parseInt paddingTop.replace(/(px|em)/, '')
        right: parseInt paddingRight.replace(/(px|em)/, '')
        bottom: parseInt paddingBottom.replace(/(px|em)/, '')
        left: parseInt paddingLeft.replace(/(px|em)/, '')
      }
      for key of @config.padding
        if _.isNaN @config.padding[key]
          throw new Error "Invalid padding #{@config.padding}: #{key} must be Integer"

    else
      @config.padding = { top: 0, right: 0, bottom: 0, left: 0 }

    if @config.layout
      validLayoutValues = d3.layout.grid().validDirections()
      unless validLayoutValues.includes @config.layout
        throw new Error "Invalid layout #{@config.layout}. Valid values: [#{validLayoutValues.join('|')}]"

  _processTextConfig: (key) ->
    if @config[key]?
      textConfig = if _.isString(@config[key]) then { text : @config[key] } else @config[key]

      throw new Error "Invalid #{key} config: must have text field" unless textConfig['text']?

      if textConfig? and textConfig['text'].match(/^percentage$/)
        textConfig['text'] = "#{(100 * @config.proportion).toFixed(1).replace(/\.0$/,'')}%"

      if textConfig? and textConfig['text'].match(/^proportion$/)
        textConfig['text'] = "#{(@config.proportion).toFixed(3).replace(/0+$/, '')}"


      textConfig['horizontal-align'] ?= 'middle'
      textConfig['horizontal-align'] = 'middle' if textConfig['horizontal-align'] in ['center', 'centre']
      textConfig['horizontal-align'] = 'start' if textConfig['horizontal-align'] in ['left']
      textConfig['horizontal-align'] = 'end' if textConfig['horizontal-align'] in ['right']

      @_verifyKeyIsPositiveInt(textConfig, 'padding-left', 1)
      @_verifyKeyIsPositiveInt(textConfig, 'padding-right', 1)

      unless textConfig['horizontal-align'] in ['start', 'middle', 'end']
        throw new Error "Invalid horizontal align #{textConfig['horizontal-align']} : must be one of ['left', 'center', 'right']"

      #font-size must be present to compute dimensions
      textConfig['font-size'] ?= BaseCell.getDefault('font-size')
      for cssAttribute in ['font-family', 'font-weight', 'font-color']
        @setCss(key, cssAttribute, textConfig[cssAttribute]) if textConfig[cssAttribute]?

      @config[key] = textConfig

  _draw: () ->
    @_computeDimensions()

    @parentSvg.append("svg:rect")
    .attr 'width', @width
    .attr 'height', @height
    .attr 'class', 'background-rect'
    .attr 'fill', @config['background-color'] || 'none'

    if @config['text-header']?
      textSpanWidth = @dimensions.headerXOffset + @dimensions.headerWidth
      yMidpoint = @dimensions.headerYOffset + @dimensions.headerHeight / 2
      @_addTextTo @parentSvg, 'text-header', @config['text-header'], textSpanWidth, yMidpoint

    graphicContainer = @parentSvg.append('g')
      .attr('class', 'graphic-container')
      .attr 'transform', "translate(#{@dimensions.graphicXOffset},#{@dimensions.graphicYOffset})"

    if @config['text-footer']?
      textSpanWidth = @dimensions.footerXOffset + @dimensions.footerWidth
      yMidpoint = @dimensions.footerYOffset + @dimensions.footerHeight / 2
      @_addTextTo @parentSvg, 'text-footer', @config['text-footer'], textSpanWidth, yMidpoint

    d3Data = @_generateDataArray(@config.proportion, @config.numImages)

    #d3.grid is added to d3 via github.com/NumbersInternational/d3-grid
    gridLayout = d3.layout.grid()
      .bands()
      .size [@dimensions.graphicWidth, @dimensions.graphicHeight]
      .padding([@config['columnGutter'], @config['rowGutter']])

    gridLayout.rows(@config['numRows']) if @config['numRows']?
    gridLayout.cols(@config['numCols']) if @config['numCols']?

    if _.isString @config.variableImage
      if @config.variableImage.match /fromleft/
        gridLayout.direction('right,down')
      if @config.variableImage.match /fromright/
        gridLayout.direction('left,down')
      if @config.variableImage.match /fromtop/
        gridLayout.direction('right,down')
      if @config.variableImage.match /frombottom/
        gridLayout.direction('right,up')

    if @config.layout
      gridLayout.direction @config.layout

    enteringLeafNodes = graphicContainer.selectAll(".node")
      .data gridLayout(d3Data)
      .enter()
      .append "g"
        .attr "class", (d) ->
          cssLocation = "node-index-#{d.i} node-xy-#{d.row}-#{d.col}"
          "node #{cssLocation}"
        .attr "transform", (d) -> return "translate(#{d.x},#{d.y})"

    imageWidth = gridLayout.nodeSize()[0]
    imageHeight = gridLayout.nodeSize()[1]

    backgroundRect = enteringLeafNodes.append("svg:rect")
      .attr 'width', imageWidth
      .attr 'height', imageHeight
      .attr 'class', 'single-image-background-rect'
      .attr 'fill', @config['image-background-color'] || 'none'

    if @config['debugBorder']?
      backgroundRect
        .attr 'stroke', 'black'
        .attr 'stroke-width', '1'

    #NB To adhere to SVG "last drawn goes on top policy", we must delay variable image rendering until base image drawn
    #the baseImageCompletePrpmise will not resolve until base images are "appended"
    parentSvg = @parentSvg
    imageErrorHandler = (error) ->
      de = new DisplayError parentSvg, error.message
      de.drawSvg()
      throw error # This is thrown because we want visual err to user

    baseImageCompletePromise = Promise.resolve()
    if @config.baseImage?
      baseImageConfig = @config.baseImage
      baseImageRenderPromises = []
      enteringLeafNodes.each (dataAttributes) ->
        d3Node = d3.select(this)
        baseImageRenderPromises.push ImageFactory.addBaseImageTo(d3Node, baseImageConfig, imageWidth, imageHeight, dataAttributes)
      baseImageCompletePromise = Promise.all(baseImageRenderPromises).catch(imageErrorHandler)

    variableImageCompletePromise = Promise.resolve()
    if @config.variableImage?
      variableImageConfig = @config.variableImage
      variableImageCompletePromise = baseImageCompletePromise.then () ->
        variableImageRenderPromises = []
        enteringLeafNodes.each (dataAttributes) ->
          d3Node = d3.select(this)
          variableImageRenderPromises.push ImageFactory.addVarImageTo(d3Node, variableImageConfig, imageWidth, imageHeight, dataAttributes)
        return Promise.all(variableImageRenderPromises).catch(imageErrorHandler)

    #NB To adhere to SVG "last drawn goes on top policy", we must delay text-overlay image rendering until variable image drawn
    #the variableImageCompletePrpmise will not resolve until base images are "appended"
    variableImageCompletePromise.then () =>
      if @config['tooltip']
        enteringLeafNodes.append("svg:title")
          .text @config['tooltip']

      if @config['text-overlay']?
        textSpanWidth = gridLayout.nodeSize()[0]
        yMidpoint = gridLayout.nodeSize()[1] / 2
        @_addTextTo enteringLeafNodes, 'text-overlay', @config['text-overlay'], textSpanWidth, yMidpoint

  _computeDimensions: () ->

    @dimensions = {}

    #need these first to calc graphicHeight
    @dimensions.headerHeight = 0 + (if @config['text-header']? then @getAdjustedTextSize(@config['text-header']['font-size']) else 0)
    @dimensions.footerHeight = 0 + (if @config['text-footer']? then @getAdjustedTextSize(@config['text-footer']['font-size']) else 0)

    @dimensions.headerWidth = @width - @config.padding.left - @config.padding.right
    @dimensions.headerXOffset = 0 + @config.padding.left
    @dimensions.headerYOffset = 0 + @config.padding.top

    @dimensions.graphicWidth = @width - @config.padding.left - @config.padding.right
    @dimensions.graphicHeight = @height - @dimensions.headerHeight - @dimensions.footerHeight - @config.padding.top - @config.padding.bottom
    @dimensions.graphicXOffset = 0 + @config.padding.left
    @dimensions.graphicYOffset = 0 + @dimensions.headerYOffset + @dimensions.headerHeight

    @dimensions.footerWidth = @width - @config.padding.left - @config.padding.right
    @dimensions.footerXOffset = 0 + @config.padding.left
    @dimensions.footerYOffset = 0 + @dimensions.graphicYOffset + @dimensions.graphicHeight

  _addTextTo: (parent, myClass, textConfig, textSpanWidth, yMidpoint) ->

    x = switch
      when textConfig['horizontal-align'] is 'start' then 0 + textConfig['padding-left']
      when textConfig['horizontal-align'] is 'middle' then textSpanWidth/2
      when textConfig['horizontal-align'] is 'end' then textSpanWidth - textConfig['padding-right']

    parent.append('svg:text')
      .attr 'class', myClass
      .attr 'x', x
      .attr 'y', yMidpoint
      .attr 'text-anchor', textConfig['horizontal-align']
      #alignment-baseline and dominant-baseline should do same thing but are both may be necessary for browser compatability
      .style 'font-size', @getAdjustedTextSize textConfig['font-size']
      .style 'alignment-baseline', 'central'
      .style 'dominant-baseline', 'central'
      .text textConfig.text

  _generateDataArray: (proportion, numImages) ->
    d3Data = []
    #NB the alg uses terms based on assigning 2D area to an array of shapes
    remainingArea = proportion * numImages
    for i in [0...numImages]
      proportionForImageI = if (remainingArea > 1) then 1 else remainingArea
      remainingArea -= proportionForImageI
      d3Data.push { proportion: proportionForImageI, i: i }
    return d3Data

  _resize: () ->
    @parentSvg.selectAll('*').remove()
    @_draw()
