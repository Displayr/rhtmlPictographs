
# I am a singleton, all my methods and variables are static
# I accept DOM and manipulate it

class ImageFactory

  @addImageTo: (config, width, height) ->
    d3Node = d3.select(this)
    {top,left} = $(this).offset()

    if _.isString config
      config = ImageFactory.parseConfigString config
    else
      unless config.type of ImageFactory.types
        throw new Error "Invalid image creation config : unknown image type #{config.type}"

    newImage = ImageFactory.types[config.type](d3Node, config, width, height, parseInt(left), parseInt(top))

    uniqueClipId = null
    if config.verticalclip
      config.verticalclip = ImageFactory.addVerticalClip d3Node, config, width, height
      newImage.attr 'clip-path', "url(##{config.verticalclip})"
    if config.horizontalclip
      config.horizontalclip = ImageFactory.addHorizontalClip d3Node, config, width, height
      newImage.attr 'clip-path', "url(##{config.horizontalclip})"
    if config.radialclip
      config.radialclip = ImageFactory.addRadialClip d3Node, config, width, height
      newImage.attr 'clip-path', "url(##{config.radialclip})"


    return null

  @parseConfigString: (configString) ->
    unless configString.length > 0
      throw new Error "Invalid image creation configString '' : empty string"

    config = {}
    configParts = []

    httpRegex = new RegExp '^(.*?):?(https?://.*)$'
    if matches = configString.match httpRegex
      configParts = _.without matches[1].split(':'), 'url'
      config.type = 'url'
      config.url = matches[2]
    else
      configParts = configString.split(':')

      type = configParts.shift()
      unless type of ImageFactory.types
        throw new Error "Invalid image creation configString '#{configString}' : unknown image type #{type}"
      config['type'] = type

    if type in ['url'] and !config.url?
      config.url = configParts.pop()
      hasDot = new RegExp /\./
      unless config.url and config.url.match(hasDot)
        throw new Error "Invalid image creation configString '#{configString}' : url string must end with a url"

    unknownParts = []
    while part = configParts.shift()

      if part of ImageFactory.keywordHandlers
        handler = ImageFactory.keywordHandlers[part]
        if _.isString handler
          config[handler] = true
      else
        unknownParts.push part

    if unknownParts.length > 1
      throw new Error "Invalid image creation configString '#{configString}' : too many unknown parts: [#{unknownParts.join(',')}]"
    if unknownParts.length == 1
      config['color'] = unknownParts[0]

    return config

  @addCircleTo: (d3Node, config, width, height) ->
    ratio = (p) ->
      return if config.scale then p else 1

    color = ColorFactory.getColor config.color

    return d3Node.append("svg:circle")
      .classed('circle', true)
      .attr 'cx', width/2
      .attr 'cy', height/2
      .attr 'r', (d) -> ratio(d.percentage) * Math.min(width,height) / 2
      .style 'fill', color

  @addEllipseTo: (d3Node, config, width, height) ->
    ratio = (p) ->
      return if config.scale then p else 1

    color = ColorFactory.getColor config.color

    return d3Node.append("svg:ellipse")
      .classed('ellipse', true)
      .attr 'cx', width/2
      .attr 'cy', height/2
      .attr 'rx', (d) -> width * ratio(d.percentage) / 2
      .attr 'ry', (d) -> height * ratio(d.percentage) / 2
      .style 'fill', color

  @addRectTo: (d3Node, config, width, height) ->
    ratio = (p) ->
      return if config.scale then p else 1

    color = ColorFactory.getColor config.color

    return d3Node.append("svg:rect")
      .classed('rect', true)
      .attr 'x', (d) -> width * (1 - ratio(d.percentage)) / 2
      .attr 'y', (d) -> height * (1 - ratio(d.percentage)) / 2
      .attr 'width', (d) -> width * ratio(d.percentage)
      .attr 'height', (d) -> height * ratio(d.percentage)
      .style 'fill', color

  @addRecoloredSvgTo: (d3Node, config, width, height) ->

    onDownloadSuccess = (data) ->
      svg = jQuery(data).find('svg');
      cleanedSvgString = RecolorSvg.recolor svg, config.color, width, height
      d3Node.html cleanedSvgString

    onDownloadFail = (data) ->
      throw new Error "could not download #{config.url}"

    jQuery.ajax({url: config.url, dataType: 'xml' })
      .done(onDownloadSuccess)
      .fail(onDownloadFail)

  @addRecoloredBitmapTo: (d3Node, config, width, height, x, y) ->
    # note canvas width height define the coordinate system, so they are only useful inside the canvas
    foreignCanvasHtml = """
    <foreignObject x="#{x}" y="#{y-100}">
      <canvas id="canvas#{x}" width="#{width}" height="#{height}"></canvas>
    </foreignObject>
"""

    d3Node.html foreignCanvasHtml

    canvas = document.getElementById "canvas#{x}"
    ctx = canvas.getContext '2d'

    ctx.fillStyle = config.color
    console.log "x y"
    console.log x, y
    ctx.fillRect(0, 0, width, height)

    if config.color == 'red'
      [newRed,newGreen,newBlue] = [255,0,0]
    if config.color == 'green'
      [newRed,newGreen,newBlue] = [0,255,0]
    if config.color == 'blue'
      [newRed,newGreen,newBlue] = [0,0,255]

    console.log "recoloring, #{[x, y, width, height]}  #{[newRed,newGreen,newBlue]}"

    img = new Image()
    img.crossOrigin = "anonymous"
    img.src = config.url
    img.onload = () ->
      ctx.drawImage img, 0, 0, width, height
      recolor width, height, newRed, newGreen, newBlue

    recolor = (width, height, newRed, newGreen, newBlue) ->
      imgData = ctx.getImageData(0, 0, width, height);
      data = imgData.data;

      i = 0
      console.log "data length #{data.length}"
      blackCount = 0
      while i < data.length
        red = data[i + 0]
        green = data[i + 1]
        blue = data[i + 2]
        #alpha = data[i + 3]
#        if i % 100 == 0
#          console.log "looping r: #{red} g: #{green} b: #{blue}"

        #isBlack
        if (red < 30 && green < 30 && blue < 30)
          blackCount++
          data[i + 0] = newRed
          data[i + 1] = newGreen
          data[i + 2] = newBlue

        i += 4
      console.log "done looping"
      console.log "blackCount = #{blackCount}"
      ctx.putImageData(imgData, 0, 0);

  @addExternalImage: (d3Node, config, width, height, x, y) ->
    if config.color
      if config.url.match(/\.svg$/)
        ImageFactory.addRecoloredSvgTo d3Node, config, width, height
      else if config.url.match(/\.png$/)
        ImageFactory.addRecoloredBitmapTo d3Node, config, width, height, x, y
      else
        throw new Error "Cannot recolor #{config.url}: unsupported image type for recoloring"
    else
      ImageFactory._addExternalImage d3Node, config, width, height

  @_addExternalImage: (d3Node, config, width, height) ->
    ratio = (p) ->
      return if config.scale then p else 1

    return d3Node.append('svg:image')
      .attr 'x', (d) -> width * (1 - ratio(d.percentage)) / 2
      .attr 'y', (d) -> height * (1 - ratio(d.percentage)) / 2
      .attr 'width', (d) -> width * ratio(d.percentage)
      .attr 'height', (d) -> height * ratio(d.percentage)
      .attr 'xlink:href', config.url
      .attr 'class', 'variable-image'

  @addVerticalClip: (d3Node, config, width, height) ->
    uniqueId = "clip-id-#{Math.random()}".replace(/\./g, '')
    d3Node.append('clipPath')
      .attr 'id', uniqueId
      .append 'rect'
        .attr 'x', 0
        .attr 'y', (d) -> height * (1 - d.percentage)
        .attr 'width', width
        .attr 'height', (d) -> height * d.percentage
    return uniqueId

  @addRadialClip: (d3Node, config, w, h) ->
    uniqueId = "clip-id-#{Math.random()}".replace(/\./g, '')
    d3Node.append('clipPath')
    .attr 'id', uniqueId
    .style 'stroke', 'red'
    .style 'stroke-width', '3'
    .append 'path'
      .attr 'd', (d) ->
        p = d.percentage
        degrees = p * 360
        w2 = w/2
        h2 = h/2

        pathParts = ["M#{w2},#{h2} l0,-#{h2}"]

        #trace the edges of the rectangle, returning to the centre once we have "used up" all the percentage
        #probably can be optimized or expressed better ...

        if p > 1/8
          pathParts.push "l#{w2},0"
        else
          pathParts.push "l#{h2 * Math.tan(degrees * Math.PI/180)},0"

        if p > 2/8
          pathParts.push "l0,#{h2}"
        else if p > 1/8
          pathParts.push "l0,#{h2 - w2 * Math.tan((90-degrees)* Math.PI/180)}"

        if p > 3/8
          pathParts.push "l0,#{h2}"
        else if p > 2/8
          pathParts.push "l0,#{w2 * Math.tan((degrees-90)* Math.PI/180)}"

        if p > 4/8
          pathParts.push "l-#{w2},0"
        else if p > 3/8
          pathParts.push "l-#{w2 - h2 * Math.tan((180-degrees)* Math.PI/180)},0"

        if p > 5/8
          pathParts.push "l-#{w2},0"
        else if p > 4/8
          pathParts.push "l-#{h2 * Math.tan((degrees-180)* Math.PI/180)},0"

        if p > 6/8
          pathParts.push "l0,-#{h2}"
        else if p > 5/8
          pathParts.push "l0,-#{h2 - w2 * Math.tan((270-degrees)* Math.PI/180)}"

        if p > 7/8
          pathParts.push "l0,-#{h2}"
        else if p > 6/8
          pathParts.push "l0,-#{w2 * Math.tan((degrees-270)* Math.PI/180)}"

        if p >= 8/8
          pathParts.push "l#{w2},0"
        else if p > 7/8
          pathParts.push "l#{w2 - h2 * Math.tan((360-degrees)* Math.PI/180)},0"

        pathParts.push 'z'
        return pathParts.join ' '

    return uniqueId


  @addHorizontalClip: (d3Node, config, width, height) ->
    uniqueId = "clip-id-#{Math.random()}".replace(/\./g, '')
    d3Node.append('clipPath')
      .attr 'id', uniqueId
      .append 'rect'
        .attr 'x', 0
        .attr 'y', 0
        .attr 'width', (d) -> width * d.percentage
        .attr 'height', height
    return uniqueId

  @types = {
    circle: ImageFactory.addCircleTo
    ellipse: ImageFactory.addEllipseTo
    square: ImageFactory.addRectTo
    rect: ImageFactory.addRectTo
    url : ImageFactory.addExternalImage
  }

  @keywordHandlers = {
    scale: 'scale'
    verticalclip: 'verticalclip'
    vertical: 'verticalclip'
    radialclip: 'radialclip'
    radial: 'radialclip'
    pie: 'radialclip'
    horizontalclip: 'horizontalclip'
    horizontal: 'horizontalclip'
  }

  constructor: () ->
