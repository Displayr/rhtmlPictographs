
exampleList = $('.example-list')

$.ajax('/internal_www/content/examples').done (response) ->
  matches = response.match(new RegExp('"/internal_www/content/examples/([^"]+)\.html"', 'g'))
  for match in matches
    href = match.replace(/"/g, '')

    listItem = $('<li>')

    anchor = $('<a>')
      .html(href.substring("/internal_www/content/examples/".length))
      .attr('href', href)

    exampleList.append(listItem.append(anchor))

.fail (error) ->
  console.error("Failure to /internal_www/content/examples directory.")
  console.error(error)
  $('body').append($('<div>').text("Failure to /internal_www/content/examples directory. See dev tools console for error logging."))

