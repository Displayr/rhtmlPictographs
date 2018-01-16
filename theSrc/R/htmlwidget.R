#' rhtmlPictographs HTML Widget
#'
#' @description A HTMLWidget that can generate single image graphics, mutli image graphics, or a table of single/multi image graphics. See scenarios and examples below for different use cases.
#'
#' The usage documentation is maintained as a self hosted tutorial. For instructions on how to run and view this tutorial see the project readme : https://github.com/Displayr/rhtmlPictographs
#'
#' @examples
#'
#' red circle
#' rhtmlPictographs::graphic('circle:red')
#'
#' single horizontally cropped image - minimal settings
#' rhtmlPictographs::graphic('{"variableImage":"circle:horizontal:blue","percentage":"0.4","width":400,"height":400}')
#'
#' for a list of up to date examples see here : https://github.com/Displayr/rhtmlPictographs/tree/master/examples
#'
#' @author Kyle Zeeuwen <kyle.zeeuwen@gmail.com>
#'
#' @source https://github.com/Displayr/rhtmlPictographs
#'
#' @import htmlwidgets
#'
#' @export
#'

graphic <- function(settingsJsonString = '{}') {

  if (grepl('^\\{', settingsJsonString)) {

    parsedInput <- NULL
    parsedInput = tryCatch({
      jsonlite::fromJSON(settingsJsonString)
    }, warning = function(w) {
      print("warning while parsing JSON:")
      print(w)
    }, error = function(e) {
      print("error while parsing JSON:")
      print(e)
      stop(e)
    }, finally = {})

    if('width' %in% names(parsedInput)) {
      width <- as.numeric(unlist(parsedInput['width']))
    }

    if('height' %in% names(parsedInput)) {
      height <- as.numeric(unlist(parsedInput['height']))
    }
  }

  htmlwidgets::createWidget(
    name = 'rhtmlPictographs',
    settingsJsonString,
    sizingPolicy = htmlwidgets::sizingPolicy(
      browser.fill = TRUE,
      viewer.fill = TRUE,
      padding = 0
    ),
    package = 'rhtmlPictographs'
  )
}
