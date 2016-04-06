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

    input = this._normalizeInput params

    #@TODO parameterize
    input.bannerRatio = 0.1

    instance.rootElement = if _.has(el, 'length') then el[0] else el

    #NB the following sequence is a little rought because I am switching between native JS, jQuery, and D3
    #@TODO : clean this up

    anonSvg = $("<svg class=\"rhtml-pictograph-outer-svg\">")
      .attr 'width', '100%'
      .attr 'height', '100%'

    $(instance.rootElement).append(anonSvg)

    instance.outerSvg = d3.select('.rhtml-pictograph-outer-svg')

    #NB JQuery insists on lowercasing attributes, so we must use JS directly
    # when setting viewBox ?!
    document.getElementsByClassName("rhtml-pictograph-outer-svg")[0]
      .setAttribute 'viewBox', "0 0 #{instance.initialWidth} #{instance.initialHeight}"

    graphicRatio = 1
    graphicRatio -= input.bannerRatio if input['text-header']?
    graphicRatio -= input.bannerRatio if input['text-footer']?

    if input['text-header']?
      instance.textHeader = instance.outerSvg.append('svg:text')
        .attr 'x', instance.initialWidth / 2
        .attr 'y', (d) ->
          alreadyDrawn = 0
          alreadyDrawn + instance.initialHeight * input.bannerRatio / 2
        .style 'text-anchor', 'middle'
        #alignment-baseline and dominant-baseline should do same thing but are both may be necessary for browser compatabilitu
        .style 'alignment-baseline', 'central'
        .style 'dominant-baseline', 'central'
        .attr 'class', 'text-header'
        .text (d) -> input['text-header']

      instance.textHeader.attr('fill', input['font-color']) if _.has input, 'font-color'
      for cssAttribute in ['font-family', 'font-size', 'font-weight']
        instance.textHeader.attr(cssAttribute, input[cssAttribute]) if _.has input, cssAttribute

    graphicContainerVerticalOffset = 0
    graphicContainerVerticalOffset += input.bannerRatio * instance.initialHeight if input['text-header']?
    console.log "graphicContainerVerticalOffset"
    console.log graphicContainerVerticalOffset
    instance.graphicContainer = instance.outerSvg.append('g')
      .attr('class', 'graphic-container')
      .attr 'transform', "translate(0,#{graphicContainerVerticalOffset})"

    if input['text-footer']?
      instance.textFooter = instance.outerSvg.append('svg:text')
        .attr 'x', instance.initialWidth / 2
        .attr 'y', (d) ->
          alreadyDrawn = 0
          alreadyDrawn += input.bannerRatio * instance.initialHeight if input['text-header']?
          alreadyDrawn += graphicRatio * instance.initialHeight
          alreadyDrawn + instance.initialHeight * input.bannerRatio / 2
        .style 'text-anchor', 'middle'
        #alignment-baseline and dominant-baseline should do same thing but are both may be necessary for browser compatabilitu
        .style 'alignment-baseline', 'central'
        .style 'dominant-baseline', 'central'
        .attr 'class', 'text-footer'
        .text (d) -> input['text-footer']

      instance.textFooter.attr('fill', input['font-color']) if _.has input, 'font-color'
      for cssAttribute in ['font-family', 'font-size', 'font-weight']
        instance.textFooter.attr(cssAttribute, input[cssAttribute]) if _.has input, cssAttribute


    # bannerData = []
    # bannerData.push({ class: 'text-header', y: 50 }) if input['text-header']?
    # bannerData.push({ class: 'text-footer', y: 950 }) if input['text-footer']?

    # banners = instance.outerSvg.selectAll('.text-header')
    #   .data bannerData
    #   .enter()
    #   .append 'svg:text'
    #     .attr 'x', '500'
    #     .attr 'y', (d) -> d.y
    #     .style 'text-anchor', 'middle'
    #     #alignment-baseline and dominant-baseline should do same thing but are both may be necessary for browser compatabilitu
    #     .style 'alignment-baseline', 'central'
    #     .style 'dominant-baseline', 'central'
    #     .attr 'class', (d) -> d.class
    #     .text (d) -> input[d.class]

    # banners.attr('fill', input['font-color']) if _.has input, 'font-color'
    # for cssAttribute in ['font-family', 'font-size', 'font-weight']
    #   banners.attr(cssAttribute, input[cssAttribute]) if _.has input, cssAttribute


    d3Data = this._generateDataArray input.percentage, input.numImages

    #d3.grid is provided by github.com/interactivethings/d3-grid
    gridHeight = instance.initialHeight
    gridHeight -= input.bannerRatio * instance.initialHeight if input['text-header']?
    gridHeight -= input.bannerRatio * instance.initialHeight if input['text-footer']?
    console.log("initialHeight")
    console.log(instance.initialHeight)
    console.log("gridHeight")
    console.log(gridHeight)
    gridLayout = d3.layout.grid()
      .bands()
      .size [instance.initialWidth, gridHeight]
      .padding([0.1, 0.1]); #@TODO control padding

    gridLayout.rows(input['numRows']) if input['numRows']?
    gridLayout.cols(input['numCols']) if input['numCols']?

    enteringLeafNodes = instance.graphicContainer.selectAll(".node")
      .data gridLayout(d3Data)
      .enter()
      .append "g"
        .attr "class", "node"
        .attr "transform", (d) -> return "translate(#{d.x},#{d.y})"

    enteringLeafNodes.append("svg:rect")
      .attr 'width', gridLayout.nodeSize()[0]
      .attr 'height', gridLayout.nodeSize()[1]
      .attr 'class', 'background-rect'
      .attr 'fill', input['background-color'] || 'none'

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

  _normalizeInput: (params) ->
    input = null

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

    throw new Error "Must specify 'percent'" unless input.percentage?
    input.percentage = parseFloat input.percentage
    throw new Error "percentage must be a number" if _.isNaN input.percentage
    throw new Error "percentage must be >= 0" unless input.percentage >= 0
    throw new Error "percentage must be <= 1" unless input.percentage <= 1

    input['numImages'] = 1 unless input['numImages']?
    input['direction'] = 'horizontal' unless input['direction']?
    input['font-family'] = 'Verdana,sans-serif' unless input['font-family']?
    input['font-weight'] = '900' unless input['font-weight']?
    input['font-size'] = '20px' unless input['font-size']?
    input['font-color'] = 'white' unless input['font-color']?

    return input

  _generateDataArray: (percentage, numImages) ->
    d3Data = []
    totalArea = percentage * numImages
    for num in [1..numImages]
      percentage = Math.min(1, Math.max(0, 1 + totalArea - num))
      d3Data.push { percentage: percentage }
    return d3Data

