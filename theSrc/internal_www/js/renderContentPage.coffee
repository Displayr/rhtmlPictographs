
exampleCounter = 0

makeFormHtml = () ->
  '''
    <form class="resize-form" style="padding-top:10px">
      <div style="display:block">
        <label for="width-input">New Width:</label>
        <input type="text" id="width-input" class="width-input" value="200"/>
      </div>
      <div style="display:block">
        <label for="height-input">New Height:</label>
        <input type="text" id="height-input" class="height-input" value="200"/>
      </div>
      <div style="display:block">
        <button class="resize-button">Resize</button>
      </div>
    </form>
  '''

getRelativeResizersHtml = () ->
  # we are inside a pre so you cant newline these ...
  '''
  <div style="text-align:center;width:100%">
    <button class="relative-resize-button more-button">+25</button> <button class="relative-resize-button less-button">-25</button>
    <button class="relative-resize-button more-width-button">+25 W</button> <button class="relative-resize-button less-width-button">-25 W</button> <button class="relative-resize-button more-height-button">+25 H</button> <button class="relative-resize-button less-height-button">-25 H</button>
  </div>
  '''

addExampleTo = (rowConfig) ->
  exampleNumber = "example-#{exampleCounter++}"

  element = $(this)
  element.addClass exampleNumber

  exampleConfig = _.defaults $(this).data(), rowConfig

  graphicCellConfig = null
  configString = element.text()
  if configString.match(/^{/)
    graphicCellConfig = JSON.parse configString
    configString = JSON.stringify graphicCellConfig, {}, 2
  else
    graphicCellConfig = configString

  element.empty()

  configDiv = $('<div>')
  configPre = $('<pre>')
    .attr('class', 'config')
    .css('height', "auto")
    .html(configString)

  innerExampleDiv = $('<div>')
    .attr('class', 'inner-example')
    .css('width', "#{exampleConfig.exW}")
    .css('height', "#{exampleConfig.exH}")

  innerInnerExampleDiv = $('<div>')

  element.append configDiv.append(configPre)

  if (exampleConfig.resizeControls)
    relativeResizers = $(getRelativeResizersHtml())
    element.append(relativeResizers)

    newResizeHandler = (additionalWidth, additionalHeight) ->
      return (event) ->
        event.preventDefault()
        newWidth = $(".#{exampleNumber} .inner-example").width() + additionalWidth;
        newHeight = $(".#{exampleNumber} .inner-example").height() + additionalHeight;

        #TODO inner-example could be named better
        $(".#{exampleNumber} .inner-example")
        .css 'width', newWidth
        .css 'height', newHeight

        instance.resize newWidth, newHeight

      return false

    $(".#{exampleNumber} .more-button").bind 'click', newResizeHandler 25, 25
    $(".#{exampleNumber} .less-button").bind 'click', newResizeHandler -25, -25
    $(".#{exampleNumber} .more-width-button").bind 'click', newResizeHandler 25, 0
    $(".#{exampleNumber} .less-width-button").bind 'click', newResizeHandler -25, 0
    $(".#{exampleNumber} .more-height-button").bind 'click', newResizeHandler 0, 25
    $(".#{exampleNumber} .less-height-button").bind 'click', newResizeHandler 0, -25

  element.append innerExampleDiv.append(innerInnerExampleDiv)

  instance = new Pictograph innerInnerExampleDiv, exampleConfig.exW, exampleConfig.exH
  instance.setConfig graphicCellConfig
  instance.draw()

  instanceId = instance.config['table-id']
  innerInnerExampleDiv.attr('class', "inner-inner-example #{instanceId}")

  if (exampleConfig.resizeControls)
    resizeForm = $(makeFormHtml())
    element.append(resizeForm)

    $(".#{exampleNumber} .resize-form").bind 'submit', (event) ->
      event.preventDefault();
      console.log("resize submit");

      width = $(".#{exampleNumber} .width-input").val();
      height = $(".#{exampleNumber} .height-input").val();

      #TODO inner-example could be named better
      $(".#{exampleNumber} .inner-example")
        .css('width', width)
        .css('height', height)

      instance.resize width, height

      return false

defaultConfig = {
  exW: 100
  exH: 100
}

processRow = () ->
  row = $(this)

  rowConfig = _.defaults row.data(), defaultConfig

  $(this).find('.example').each () ->
    addExampleTo.bind(this)(rowConfig)

$(document).ready ->
  $('.row').each processRow
