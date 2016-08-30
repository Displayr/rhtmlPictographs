
# I am a singleton, all my methods and variables are static

class ImageFactory

  # NB there is a chance that setting timeouts in the browser will mess with automation scripts, so consider this timeout in that scenario
  # NB the timeout cn be set very low. Even at 0 all image requests for a Pictograph will share the same promise,
  # because all calls to getOrDownload take place before the JS "next tick"
  # NB Main benefit of setting higher is to aid during redraws etc.
  @imageDownloadPromises = {}
  @getOrDownload: (url) ->
    unless url of ImageFactory.imageDownloadPromises
      ImageFactory.imageDownloadPromises[url] = jQuery.ajax({url: url, dataType: 'text' })
      setTimeout () ->
        delete ImageFactory.imageDownloadPromises[url]
      , 10000
    return ImageFactory.imageDownloadPromises[url]

  @imageSvgDimensions = {}
  @getImageDimensions: (url, imageBoxDim, width, height) ->
    return new Promise((resolve, reject) -> resolve(imageBoxDim)) unless url

    unless url of ImageFactory.imageSvgDimensions
      ImageFactory.imageSvgDimensions[url] = new Promise((resolve, reject) ->
        tmpImg = document.createElement('img')
        tmpImg.setAttribute 'src', url
        document.body.appendChild(tmpImg)
        tmpImg.onerror = ->
          tmpImg.remove()
          reject(new Error("Image not found: #{url}"))

        tmpImg.onload = () ->
          aspectRatio = tmpImg.getBoundingClientRect().height/tmpImg.getBoundingClientRect().width
          if aspectRatio > 1
            imageBoxDim.width = height / aspectRatio
            imageBoxDim.height = height
            imageBoxDim.x = (width - imageBoxDim.width)/2
            imageBoxDim.y = 0
          else
            imageBoxDim.width = width
            imageBoxDim.height = width*aspectRatio
            imageBoxDim.y = (height - imageBoxDim.height)/2
            imageBoxDim.x = 0
          imageBoxDim.aspectRatio = aspectRatio
          tmpImg.remove()
          resolve(imageBoxDim)
          )


    return ImageFactory.imageSvgDimensions[url]

  @addImageTo: (d3Node, config, width, height, dataAttributes) ->
    if _.isString config
      config = ImageFactory.parseConfigString config
    else
      unless config.type of ImageFactory.types
        throw new Error "Invalid image creation config : unknown image type #{config.type}"

    # we need to get the aspect ratio for the clip, this is an ugly but effective way
    # perhaps another way to figure out aspect ratio: http://stackoverflow.com/questions/38947966/how-to-get-a-svgs-aspect-ratio?noredirect=1#comment65284650_38947966
    imageBoxDim =
      height: height
      width: width
      x: 0
      y: 0
    config.imageBoxDim = imageBoxDim

    getDimensionsPromise = ImageFactory.getImageDimensions(config.url, imageBoxDim, width, height)
    getImageDataPromise = ImageFactory.types[config.type](d3Node, config, width, height, dataAttributes)
    return Promise.all([getDimensionsPromise, getImageDataPromise]).then((values) ->
      config.imageBoxDim = values[0]
      newImageData = values[1]

      #why unscaledBox? if we place a 100x100 circle in a 200x100 container, the circle goes in the middle.
      #when we create the clipPath, we need to know the circle doesn't start at 0,0 it starts at 50,0
      imageBox = newImageData.unscaledBox || {
        x: config.imageBoxDim.x
        y: config.imageBoxDim.y
        width: config.imageBoxDim.width
        height: config.imageBoxDim.height
      }
      newImage = newImageData.newImage

      if config.clip
        clipMaker = switch
          when config.clip is 'fromLeft' then ImageFactory.addClipFromLeft
          when config.clip is 'fromRight' then ImageFactory.addClipFromRight
          when config.clip is 'fromTop' then ImageFactory.addClipFromTop
          when config.clip is 'fromTop' then ImageFactory.addClipFromTop
          when config.clip is 'fromBottom' then ImageFactory.addClipFromBottom

        clipId = clipMaker d3Node, imageBox
        newImage.attr 'clip-path', "url(##{clipId})"

      if config.radialclip
        config.radialclip = ImageFactory.addRadialClip d3Node, imageBox
        newImage.attr 'clip-path', "url(##{config.radialclip})"

      return newImage
    ).catch (err) ->
      console.log "image error: #{err.message}"
      throw err

  @parseConfigString: (configString) ->
    unless configString.length > 0
      throw new Error "Invalid image creation configString '' : empty string"

    config = {}
    configParts = []

    httpRegex = new RegExp '^(.*?):?(https?://.*)$'
    if matchesHttp = configString.match httpRegex
      configParts = _.without matchesHttp[1].split(':'), 'url'
      config.type = 'url'
      config.url = matchesHttp[2]
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

    if type in ['data']
      config.url = 'data:' + configParts.pop()
      unless config.url
        throw new Error "Invalid image creation configString '#{configString}' : data string must have a data url as last string part"

    unknownParts = []
    while part = configParts.shift()

      if part of ImageFactory.keywordHandlers
        handler = ImageFactory.keywordHandlers[part]
        if _.isString handler
          config[handler] = true
        else
          _.extend config, handler
      else
        unknownParts.push part

    if unknownParts.length > 1
      throw new Error "Invalid image creation configString '#{configString}' : too many unknown parts: [#{unknownParts.join(',')}]"
    if unknownParts.length == 1
      config['color'] = unknownParts[0]

    return config

  @addCircleTo: (d3Node, config, width, height) ->
    ratio = (p) -> if config.scale then p else 1
    diameter = Math.min(width, height)
    color = ColorFactory.getColor config.color

    newImage = d3Node.append("svg:circle")
      .classed('circle', true)
      .attr 'cx', width/2
      .attr 'cy', height/2
      .attr 'r', (d) -> ratio(d.proportion) * diameter / 2
      .style 'fill', color

    return Promise.resolve {
      newImage: newImage
      unscaledBox:
        x: (width - diameter) / 2
        y: (height - diameter) / 2
        width: diameter
        height: diameter
    }

  @addEllipseTo: (d3Node, config, width, height) ->
    ratio = (p) ->
      return if config.scale then p else 1

    color = ColorFactory.getColor config.color

    newImage = d3Node.append("svg:ellipse")
      .classed('ellipse', true)
      .attr 'cx', width/2
      .attr 'cy', height/2
      .attr 'rx', (d) -> width * ratio(d.proportion) / 2
      .attr 'ry', (d) -> height * ratio(d.proportion) / 2
      .style 'fill', color

    return Promise.resolve { newImage: newImage }

  @addSquareTo: (d3Node, config, width, height) ->
    ratio = (p) -> return if config.scale then p else 1
    length = Math.min(width,height)

    color = ColorFactory.getColor config.color

    newImage = d3Node.append("svg:rect")
      .classed('square', true)
      .attr 'x', (d) -> (width - length) / 2 + width * (1 - ratio(d.proportion)) / 2
      .attr 'y', (d) -> (height - length) / 2 + height * (1 - ratio(d.proportion)) / 2
      .attr 'width', (d) -> ratio(d.proportion) * length
      .attr 'height', (d) -> ratio(d.proportion) * length
      .style 'fill', color

    return Promise.resolve {
      newImage: newImage
      unscaledBox:
        x: (width - length) / 2
        y: (height - length) / 2
        width: length
        height: length
    }

  @addRectTo: (d3Node, config, width, height) ->
    ratio = (p) ->
      return if config.scale then p else 1

    color = ColorFactory.getColor config.color

    newImage = d3Node.append("svg:rect")
      .classed('rect', true)
      .attr 'x', (d) -> width * (1 - ratio(d.proportion)) / 2
      .attr 'y', (d) -> height * (1 - ratio(d.proportion)) / 2
      .attr 'width', (d) -> width * ratio(d.proportion)
      .attr 'height', (d) -> height * ratio(d.proportion)
      .style 'fill', color

    return Promise.resolve { newImage: newImage }

  @addExternalImage: (d3Node, config, width, height, dataAttributes) ->
    if config.color
      if config.url.match(/\.svg$/)
        return ImageFactory.addRecoloredSvgTo d3Node, config, width, height, dataAttributes
      else
        throw new Error "Cannot recolor #{config.url}: unsupported image type for recoloring"
    else
      return ImageFactory._addExternalImage d3Node, config, width, height, dataAttributes

  # TODO this is extremely inefficient for multiImage graphics - SO BAD !
  @addRecoloredSvgTo: (d3Node, config, width, height, dataAttributes) ->
    newColor = ColorFactory.getColor config.color


    return new Promise (resolve, reject) ->
      onDownloadSuccess = (xmlString) ->
        data = jQuery.parseXML xmlString
        svg = jQuery(data).find('svg')

        ratio = if config.scale then dataAttributes.proportion else 1
        x = width * (1 - ratio) / 2
        y = height * (1 - ratio) / 2
        width = width * ratio
        height = height * ratio

        cleanedSvgString = RecolorSvg.recolor(svg, newColor, x, y, width, height)

        return resolve { newImage: d3Node.append('g').html(cleanedSvgString) }

      onDownloadFailure = reject(new Error("Downloading svg failed: #{config.url}"))

      return ImageFactory.getOrDownload(config.url)
                         .done(onDownloadSuccess)
                         .fail(onDownloadFailure)

  @_addExternalImage: (d3Node, config, width, height) ->
    ratio = (p) ->
      return if config.scale then p else 1

    if config.url.match(/\.svg$/)
      return new Promise (resolve, reject) ->
        onDownloadSuccess = (xmlString) ->
          data = jQuery.parseXML xmlString
          svg = jQuery(data).find('svg')

          ratio = if config.scale then dataAttributes.proportion else 1
          x = width * (1 - ratio) / 2
          y = height * (1 - ratio) / 2
          width = width * ratio
          height = height * ratio

          currentWidth = svg.attr 'width'
          currentHeight = svg.attr 'height'

          svg.attr 'x', x
          svg.attr 'y', y
          svg.attr 'width', width
          svg.attr 'height', height
          svg.attr 'preserveAspectRatio', 'xMidYMid meet'

          if currentWidth and currentHeight and !svg.attr('viewBox')
            svg.attr 'viewBox', "0 0 #{currentWidth.replace(/(px|em)/, '')} #{currentHeight.replace(/(px|em)/, '')}"

          svgString = $('<div />').append(svg).html();

          return resolve { newImage: d3Node.append('g').html(svgString) }

        onDownloadFailure = reject(new Error("Downloading img failed: #{config.url}"))

        return ImageFactory.getOrDownload(config.url)
                           .done(onDownloadSuccess)
                           .fail(onDownloadFailure)
    else
      newImage = d3Node.append("svg:image")
        .attr 'x', (d) -> width * (1 - ratio(d.proportion)) / 2
        .attr 'y', (d) -> height * (1 - ratio(d.proportion)) / 2
        .attr 'xlink:href', config.url
        .attr 'class', 'variable-image'
        .attr 'width', (d) -> width * ratio(d.proportion)
        .attr 'height', (d) -> height * ratio(d.proportion)
        .attr 'preserveAspectRatio', 'xMidYMid meet'

      return Promise.resolve { newImage: newImage }

  @addClipFromBottom: (d3Node, imageBox) ->
    uniqueId = "clip-id-#{Math.random()}".replace(/\./g, '')
    d3Node.append('clipPath')
      .attr 'id', uniqueId
      .append 'rect'
        .attr 'x', imageBox.x
        .attr 'y', (d) -> imageBox.y + imageBox.height * (1 - d.proportion)
        .attr 'width', imageBox.width
        .attr 'height', (d) -> imageBox.height * d.proportion
    return uniqueId

  @addClipFromTop: (d3Node, imageBox) ->
    uniqueId = "clip-id-#{Math.random()}".replace(/\./g, '')
    d3Node.append('clipPath')
      .attr 'id', uniqueId
      .append 'rect'
        .attr 'x', imageBox.x
        .attr 'y', (d) -> imageBox.y
        .attr 'width', imageBox.width
        .attr 'height', (d) -> imageBox.height * d.proportion
    return uniqueId

  @addClipFromLeft: (d3Node, imageBox) ->
    uniqueId = "clip-id-#{Math.random()}".replace(/\./g, '')
    d3Node.append('clipPath')
      .attr 'id', uniqueId
      .append 'rect'
        .attr 'x', imageBox.x
        .attr 'y', imageBox.y
        .attr 'width', (d) -> imageBox.width * d.proportion
        .attr 'height', imageBox.height
    return uniqueId

  @addClipFromRight: (d3Node, imageBox) ->
    uniqueId = "clip-id-#{Math.random()}".replace(/\./g, '')
    d3Node.append('clipPath')
      .attr 'id', uniqueId
      .append 'rect'
        .attr 'x', (d) -> imageBox.x + imageBox.width * (1 - d.proportion)
        .attr 'y', imageBox.y
        .attr 'width', (d) -> imageBox.width * d.proportion
        .attr 'height', imageBox.height
    return uniqueId

  @addRadialClip: (d3Node, imageBox) ->
    {x, y, width, height} = imageBox

    uniqueId = "clip-id-#{Math.random()}".replace(/\./g, '')
    d3Node.append('clipPath')
    .attr 'id', uniqueId
    .append 'path'
      .attr 'd', (d) ->
        p = d.proportion
        degrees = p * 360
        w2 = width/2
        h2 = height/2

        #start in the centre, then go straight up, then ...
        pathParts = ["M#{x + w2},#{y + h2} l0,-#{h2}"]

        #trace the edges of the rectangle, returning to the centre once we have "used up" all the proportion
        #probably can be optimized or expressed better ...

        if p >= 1/8
          pathParts.push "l#{w2},0"
        else
          pathParts.push "l#{h2 * Math.tan(degrees * Math.PI/180)},0"

        if p >= 2/8
          pathParts.push "l0,#{h2}"
        else if p > 1/8
          pathParts.push "l0,#{h2 - w2 * Math.tan((90-degrees)* Math.PI/180)}"

        if p >= 3/8
          pathParts.push "l0,#{h2}"
        else if p > 2/8
          pathParts.push "l0,#{w2 * Math.tan((degrees-90)* Math.PI/180)}"

        if p >= 4/8
          pathParts.push "l-#{w2},0"
        else if p > 3/8
          pathParts.push "l-#{w2 - h2 * Math.tan((180-degrees)* Math.PI/180)},0"

        if p >= 5/8
          pathParts.push "l-#{w2},0"
        else if p > 4/8
          pathParts.push "l-#{h2 * Math.tan((degrees-180)* Math.PI/180)},0"

        if p >= 6/8
          pathParts.push "l0,-#{h2}"
        else if p > 5/8
          pathParts.push "l0,-#{h2 - w2 * Math.tan((270-degrees)* Math.PI/180)}"

        if p >= 7/8
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

  @types = {
    circle: ImageFactory.addCircleTo
    ellipse: ImageFactory.addEllipseTo
    square: ImageFactory.addSquareTo
    rect: ImageFactory.addRectTo
    url: ImageFactory.addExternalImage
    data: ImageFactory._addExternalImage
  }

  @keywordHandlers = {
    vertical: { clip: 'fromBottom' }
    horizontal: { clip: 'fromLeft'}
    fromleft: { clip: 'fromLeft' }
    fromright: { clip: 'fromRight' }
    frombottom: { clip: 'fromBottom' }
    fromtop: { clip: 'fromTop' }
    scale: 'scale'
    radialclip: 'radialclip'
    radial: 'radialclip'
    pie: 'radialclip'
  }

  constructor: () ->
