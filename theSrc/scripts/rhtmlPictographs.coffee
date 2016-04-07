'use strict'

HTMLWidgets.widget
  name: 'rhtmlPictographs'
  type: 'output'
  resize: (el, width, height, instance) ->
    console.log 'resize not implemented'

  initialize: (el, width, height) ->
    #@TODO strip all em, px, etc from the width height - i am just using them for the ratio, as the SVG is 100% of its container anyway
    return {
      initialWidth: width
      initialHeight: height
      width: width
      height: height
    }

  renderValue: (el, params, instance) ->

    input = this._normalizeInput params, instance
    dimensions = this._computeDimensions input, instance

    instance.rootElement = if _.has(el, 'length') then el[0] else el

    #NB the following sequence is a little rough because I am switching between native JS, jQuery, and D3
    #@TODO : clean this up

    anonSvg = $("<svg class=\"rhtml-pictograph-outer-svg\">")
      .attr 'width', '100%'
      .attr 'height', '100%'

    $(instance.rootElement).append(anonSvg)

    instance.outerSvg = d3.select('.rhtml-pictograph-outer-svg')

    #NB JQuery insists on lowercasing attributes, so we must use JS directly
    # when setting viewBox and preserveAspectRatio ?!
    document.getElementsByClassName("rhtml-pictograph-outer-svg")[0]
      .setAttribute 'viewBox', "0 0 #{instance.initialWidth} #{instance.initialHeight}"
    if input['preserveAspectRatio']?
      document.getElementsByClassName("rhtml-pictograph-outer-svg")[0]
        .setAttribute 'preserveAspectRatio', input['preserveAspectRatio']

    if input['text-header']?
      instance.textHeader = instance.outerSvg.append('svg:text')
        .attr 'x', instance.initialWidth / 2 #NB /2 because its midpoint
        .attr 'y', dimensions.headerHeight / 2 #NB /2 because its midpoint
        .style 'text-anchor', 'middle'
        #alignment-baseline and dominant-baseline should do same thing but are both may be necessary for browser compatability
        .style 'alignment-baseline', 'central'
        .style 'dominant-baseline', 'central'
        .attr 'class', 'text-header'
        .text (d) -> input['text-header']

      instance.textHeader.attr('fill', input['font-color']) if _.has input, 'font-color'
      for cssAttribute in ['font-family', 'font-size', 'font-weight']
        instance.textHeader.attr(cssAttribute, input[cssAttribute]) if _.has input, cssAttribute

    instance.graphicContainer = instance.outerSvg.append('g')
      .attr('class', 'graphic-container')
      .attr 'transform', "translate(0,#{dimensions.graphicOffSet})"

    if input['text-footer']?
      instance.textFooter = instance.outerSvg.append('svg:text')
        .attr 'x', instance.initialWidth / 2 #NB /2 because its midpoint
        .attr 'y', dimensions.footerOffset + dimensions.footerHeight / 2 #NB /2 because its midpoint
        .style 'text-anchor', 'middle'
        #alignment-baseline and dominant-baseline should do same thing but are both may be necessary for browser compatabilitu
        .style 'alignment-baseline', 'central'
        .style 'dominant-baseline', 'central'
        .attr 'class', 'text-footer'
        .text (d) -> input['text-footer']

      instance.textFooter.attr('fill', input['font-color']) if _.has input, 'font-color'
      for cssAttribute in ['font-family', 'font-size', 'font-weight']
        instance.textFooter.attr(cssAttribute, input[cssAttribute]) if _.has input, cssAttribute

    d3Data = this._generateDataArray input.percentage, input.numImages

    #d3.grid is added to d3 via github.com/NumbersInternational/d3-grid
    gridLayout = d3.layout.grid()
      .bands()
      .size [instance.initialWidth, dimensions.graphicHeight]
      .padding([input['interColumnPadding'], input['interRowPadding']])

    gridLayout.rows(input['numRows']) if input['numRows']?
    gridLayout.cols(input['numCols']) if input['numCols']?

    enteringLeafNodes = instance.graphicContainer.selectAll(".node")
      .data gridLayout(d3Data)
      .enter()
      .append "g"
        .attr "class", "node"
        .attr "transform", (d) -> return "translate(#{d.x},#{d.y})"

    backgroundRect = enteringLeafNodes.append("svg:rect")
      .attr 'width', gridLayout.nodeSize()[0]
      .attr 'height', gridLayout.nodeSize()[1]
      .attr 'class', 'background-rect'
      .attr 'fill', input['background-color'] || 'none'

    if input['debugBorder']?
      backgroundRect
        .attr 'stroke', 'black'
        .attr 'stroke-width', '1'

    if input.baseImageUrl?
      enteringLeafNodes.append("svg:image")
        .attr 'width', gridLayout.nodeSize()[0]
        .attr 'height', gridLayout.nodeSize()[1]
        .attr 'xlink:href', input.baseImageUrl
        .attr 'class', 'base-image'

    enteringLeafNodes.append('clipPath')
      .attr 'id', 'my-clip'
      .append 'rect'
        .attr 'x', 0

        .attr 'y', (d) ->
          return 0 if input.direction == 'horizontal'
          return gridLayout.nodeSize()[1] * (1 -d.percentage)

        .attr 'width', (d) ->
          return gridLayout.nodeSize()[0] * d.percentage if input.direction == 'horizontal'
          return gridLayout.nodeSize()[0]

        .attr 'height', (d) ->
          return gridLayout.nodeSize()[1] * d.percentage if input.direction == 'vertical'
          return gridLayout.nodeSize()[1]

    enteringLeafNodes.append("svg:image")
      .attr 'width', gridLayout.nodeSize()[0]
      .attr 'height', gridLayout.nodeSize()[1]
      .attr 'clip-path', 'url(#my-clip)'
      .attr 'xlink:href', input.variableImageUrl
      .attr 'class', 'variable-image'

    if input['tooltip']
      enteringLeafNodes.append("svg:title")
        .text input['tooltip']

    if input['text-overlay']
      displayText = if input['text-overlay'].match(/^percentage$/) then "#{(100 * input.percentage).toFixed(0)}%" else input['text-overlay']

      textOverlay = enteringLeafNodes.append("svg:text")
        .attr 'x', (d) -> gridLayout.nodeSize()[0] / 2
        .attr 'y', (d) -> gridLayout.nodeSize()[1] / 2
        .style 'text-anchor', 'middle'
        #alignment-baseline and dominant-baseline should do same thing but are both may be necessary for browser compatabilitu
        .style 'alignment-baseline', 'central'
        .style 'dominant-baseline', 'central'
        .attr 'class', 'text-overlay'
        .text displayText


      textOverlay.attr('fill', input['font-color']) if _.has input, 'font-color'
      for cssAttribute in ['font-family', 'font-size', 'font-weight']
        textOverlay.attr(cssAttribute, input[cssAttribute]) if _.has input, cssAttribute

  _normalizeInput: (params, instance) ->
    input = null

    verifyKeyIsFloat = (input, key, defaultValue, message='Must be float') ->
      if !_.isUndefined defaultValue
        unless _.has input, key
          input[key] = defaultValue
          return

      if _.isNaN parseFloat input[key]
        throw new Error "invalid '#{key}': #{input[key]}. #{message}."

      input[key] = parseFloat input[key]
      return

    verifyKeyIsInt = (input, key, defaultValue, message='Must be integer') ->
      if !_.isUndefined defaultValue
        unless _.has input, key
          input[key] = defaultValue
          return

      if _.isNaN parseInt input[key]
        throw new Error "invalid '#{key}': #{input[key]}. #{message}."

      input[key] = parseFloat input[key]
      return

    verifyKeyIsRatio = (input, key) ->
      throw new Error "#{key} must be >= 0" unless input[key] >= 0
      throw new Error "#{key} must be <= 1" unless input[key] <= 1

    try
      if _.isString params.settingsJsonString
        input = JSON.parse params.settingsJsonString
      else
        input = params.settingsJsonString

      input.percentage = params.percentage
    catch err
      msg =  "rhtmlPictographs error : Cannot parse 'settingsJsonString'"
      console.error msg
      throw new Error err

    throw new Error "Must specify 'variableImageUrl'" unless input.variableImageUrl?

    verifyKeyIsFloat input, 'percentage', 1, 'Must be number between 0 and 1'
    verifyKeyIsRatio input, 'percentage'

    verifyKeyIsInt input, 'numImages', 1

    input['direction'] = 'horizontal' unless input['direction']?
    unless input['direction'] in ['horizontal', 'vertical']
      throw new Error "direction must be either (horizontal|vertical)"

    input['font-family'] = 'Verdana,sans-serif' unless input['font-family']?
    input['font-weight'] = '900' unless input['font-weight']?
    input['font-size'] = '24' unless input['font-size']?
    input['font-size'] = parseInt(input['font-size'].replace(/(px|em)/, '')) #all sizes are relative to viewBox and have no units
    input['font-color'] = 'black' unless input['font-color']?

    verifyKeyIsFloat input, 'interColumnPadding', 0.05, 'Must be number between 0 and 1'
    verifyKeyIsRatio input, 'interColumnPadding'
    verifyKeyIsFloat input, 'interRowPadding', 0.05, 'Must be number between 0 and 1'
    verifyKeyIsRatio input, 'interRowPadding'

    return input

  _computeDimensions: (input, instance) ->
    dimensions = {}

    dimensions.headerHeight = 0 + (if input['text-header']? then input['font-size'] else 0)
    dimensions.footerHeight = 0 + (if input['text-footer']? then input['font-size'] else 0)

    dimensions.graphicHeight = instance.height - dimensions.headerHeight - dimensions.footerHeight
    dimensions.graphicOffSet = 0 + dimensions.headerHeight

    dimensions.footerOffset = 0 + dimensions.headerHeight + dimensions.graphicHeight

    return dimensions

  _generateDataArray: (percentage, numImages) ->
    d3Data = []
    totalArea = percentage * numImages
    for num in [1..numImages]
      percentage = Math.min(1, Math.max(0, 1 + totalArea - num))
      d3Data.push { percentage: percentage }
    return d3Data

