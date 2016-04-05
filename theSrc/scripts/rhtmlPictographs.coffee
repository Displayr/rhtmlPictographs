'use strict'

HTMLWidgets.widget
  name: 'rhtmlPictographs'
  type: 'output'

  resize: (el, width, height, instance) ->
    console.log 'resizing rhtmlPictograph'
    console.log instance.svg

    instance.width = width
    instance.height = height

    $('.rhtml-pictograph-outer-svg').remove()

    this._draw el, instance

  initialize: (el, width, height) ->
    return {
      width: width
      height: height
    }

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


  renderValue: (el, params, instance) ->
    instance.input = this._normalizeInput params
    this._draw el, instance

  _makeTextBanner: (className, text, args) ->
    bannerContainer = $("<text class=\"#{className}\">")
      .css 'text-align', 'center'
      .attr 'width', '100'
      .attr 'height', '100'
      .text text

    bannerContainer.css('color', args['font-color']) if _.has args, 'font-color'
    for cssAttribute in ['font-family', 'font-size', 'font-weight']
      bannerContainer.css(cssAttribute, args[cssAttribute]) if _.has args, cssAttribute

    bannerContainer

  _draw: (el, instance) ->

    generateClip = (input) ->
      if input.direction == 'horizontal'
        x = input.percentage * instance.width
        return "rect(auto, #{x}px, auto, auto)"
      else if input.direction == 'vertical'
        x = instance.height - input.percentage * instance.height
        return "rect(#{x}px, auto, auto, auto)"
      else
        throw new Error "Invalid direction: '#{input.direction}'"

    generateDataArray = (percentage, numImages) ->
      d3Data = []
      totalArea = percentage * numImages
      for num in [1..numImages]
        percentage = Math.min(1, Math.max(0, 1 + totalArea - num))
        d3Data.push { percentage: percentage }
      return d3Data


    input = instance.input
    d3Data = generateDataArray input.percentage, input.numImages

    #d3.grid is provided by github.com/interactivethings/d3-grid
    gridLayout = d3.layout.grid()
      .bands()
      .size [instance.width, instance.height]
      .padding([0.1, 0.1]); #@TODO control padding ?

    gridLayout.rows(input['numRows']) if input['numRows']?
    gridLayout.cols(input['numCols']) if input['numCols']?

    instance.rootElement = if _.has(el, 'length') then el[0] else el
    instance.outerSvg = $("<svg class=\"rhtml-pictograph-outer-svg\">")
      .attr 'width': instance.width
      .attr 'height': instance.height

    $(instance.rootElement).append(instance.outerSvg)
    $(instance.outerSvg).append(this._makeTextBanner 'header-container', input['text-header'], input)
#    addTextBanner(rootElement, 'header-container', input['text-header'], input) if input['text-header']?

#    instance.svg = d3.select(rootElement).append("svg")

#    addTextBanner(rootElement, 'footer-container', input['text-footer'], input) if input['text-footer']?

    enteringLeafNodes = d3.select('.rhtml-pictograph-outer-svg').selectAll(".node")
      .data gridLayout(d3Data)
      .enter()
      .append "g"
        .attr "class", "node"
        .attr "transform", (d) ->
          return "translate(" + d.x + "," + d.y + ")"

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

    enteringLeafNodes.append("clipPath")
      .attr "id", "my-clip"
      .append "rect"
        .attr "x", 0

        .attr "y", (d) ->
          return 0 if input.direction == 'horizontal'
          return gridLayout.nodeSize()[1] * (1 -d.percentage)

        .attr "width", (d) ->
          return gridLayout.nodeSize()[0] * d.percentage if input.direction == 'horizontal'
          return gridLayout.nodeSize()[0]

        .attr "height", (d) ->
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
