
# I am a singleton, all my methods and variables are static
#NB @TODO if we have two active Pictographs at same time this becomes an issue

class ColorFactory

  @palettes = {}
  @aliases = {}

  @processNewConfig: (config) ->
    if config.palettes
      for newPalette of config.palettes
        if _.has ColorFactory.palettes, newPalette
          throw new Error "cannot define #{newPalette} palette twice"

        if _.has ColorFactory.aliases, newPalette
          throw new Error "cannot define #{newPalette} palette, an alias with same name already exists"

        ColorFactory.palettes[newPalette] = {
          colors: config.palettes[newPalette]
          index: 0
        }

    if config.aliases
      for alias of config.aliases
        if _.has ColorFactory.palettes, alias
          throw new Error "cannot define #{alias} alias, a palette with same name already exists"

        if _.has ColorFactory.aliases, alias
          throw new Error "cannot define #{alias} alias twice"

        ColorFactory.aliases[alias] = config.aliases[alias]

  @getColor: (color) ->
    if _.has ColorFactory.palettes, color
      return ColorFactory.getColorFromPalette color

    if _.has ColorFactory.aliases, color
      return ColorFactory.aliases[color]

    return color

  @getColorFromPalette: (paletteName) ->
    unless _.has ColorFactory.palettes, paletteName
      throw new Error "palette '#{paletteName}' does not exist"

    currentIndex = ColorFactory.palettes[paletteName].index
    ColorFactory.palettes[paletteName].index = (ColorFactory.palettes[paletteName].index += 1) % ColorFactory.palettes[paletteName].colors.length

    return ColorFactory.palettes[paletteName].colors[currentIndex]

  constructor: () ->

# http://bl.ocks.org/aaizemberg/78bd3dade9593896a59d
googleColors = ["#3366cc", "#dc3912", "#ff9900", "#109618", "#990099", "#0099c6", "#dd4477", "#66aa00", "#b82e2e", "#316395", "#994499", "#22aa99", "#aaaa11", "#6633cc", "#e67300", "#8b0707", "#651067", "#329262", "#5574a6", "#3b3eac"]
ColorFactory.processNewConfig
  palettes:
    google10: googleColors.slice(0,10)
    google20: googleColors.slice(0,20)
    displayr: ['#5b9bd5', '#ed7d31', '#a5a5a5', '#1ec000', '#4472c4', '#70ad47', '#255e91', '#9e480e', '#636363', '#997300', '#264478', '#43682b', '#000000', '#ff2323']

if (d3)

  ColorFactory.processNewConfig
    palettes:
      d310: _.range(0,10).map(d3.scale.category10())
      d320: _.range(0,20).map(d3.scale.category20())
      d320b: _.range(0,20).map(d3.scale.category20b())
      d320c: _.range(0,20).map(d3.scale.category20c())


