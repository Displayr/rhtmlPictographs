
import $ from 'jquery'
import _ from 'lodash'
/* global window */

// TEMPLATE : you will need to import your widget here
import WidgetClass from '../../scripts/Pictograph.js'

const defaultConfig = {
  width: 200,
  height: 200
}

let exampleCounter = 0

// NB The window.stateUpdates is used by the visualTesting suite to check what stateCallbacks are made
// It assumes there is only one widget on the page
window.stateUpdates = []
const stateChangedCallback = (newState) => {
  window.stateUpdates.push(_.clone(newState))
  console.log(`stateCallback called with state =${JSON.stringify(newState, {}, 2)}`)
}

const retrieveState = function (configName, stateName) {
  return new Promise((resolve, reject) => {
    $.ajax(`/data/${configName}/${stateName}.json`).done(resolve).error(reject)
  })
}

const retrieveConfig = function (configName) {
  return new Promise((resolve, reject) => {
    $.ajax(`/data/${configName}/config.json`).done(resolve).error(reject)
  })
}

const relativeResizersHtmlSnippet = `
<div class="relative-resize-container">
  <button class="relative-resize-button more-button">+25</button>
  <button class="relative-resize-button less-button">-25</button>
  <button class="relative-resize-button more-width-button">+25 W</button>
  <button class="relative-resize-button less-width-button">-25 W</button>
  <button class="relative-resize-button more-height-button">+25 H</button>
  <button class="relative-resize-button less-height-button">-25 H</button>
</div>
`

const rerenderHtmlSnippet = `
<div class="rerender-container">
  <label for="rerender-config">New Config:</label>
  <input type="text" name="rerender-config" id="rerender-config" class="rerender-config rerender-element"/>
  <button class="rerender-button rerender-element">Rerender</button>
</div>
`

const addExampleTo = function () {
  const exampleNumber = `example-${exampleCounter++}`

  const element = $(this)
  element.addClass(exampleNumber)

  const dataAttributes = _.defaults($(this).data(), defaultConfig)

  let configPromise = null
  if (_.has(dataAttributes, 'config')) {
    configPromise = retrieveConfig(dataAttributes.config)
  } else {
    const configString = element.text() || '{}'

    if (configString.indexOf('{') === 0) {
      try {
        configPromise = JSON.parse(configString)
      } catch (err) {
        console.error(`Failed to JSON parse config string: ${configString}`)
        configPromise = Promise.reject(err)
      }
    } else {
      configPromise = configString
    }
  }

  let statePromise = null
  if (_.has(dataAttributes, 'state')) {
    statePromise = retrieveState(dataAttributes.config, dataAttributes.state)
  } else {
    statePromise = Promise.resolve({})
  }

  Promise.all([configPromise, statePromise]).then(([config, state = {}]) => {
    console.log('loading widget with config')
    console.log(config)

    console.log('loading widget with state')
    console.log(state)

    element.empty()
    let widgetInstance = null

    if (_.has(dataAttributes, 'showConfig')) {
      const configPre = $('<pre>')
        .attr('class', 'config')
        .css('height', 'auto')
        .html(JSON.stringify(config, {}, 2))

      element.append(configPre)
    }

    // NB this will not work with multiple widgets on the page, however the
    // only use case at present is via renderExample.html which always has a single widget on page
    window.resizeHook = function (newWidth, newHeight) {
      console.log(`resize to ${newWidth}x${newHeight}`)

      $(`.${exampleNumber} .inner-example`)
        .css('width', newWidth)
        .css('height', newHeight)

      return widgetInstance.resize(newWidth, newHeight)
    }

    if (_.has(dataAttributes, 'resizeControls')) {
      const resizeControls = $(relativeResizersHtmlSnippet)
      element.append(resizeControls)

      const newResizeHandler = function (additionalWidth, additionalHeight) {
        return function (event) {
          event.preventDefault()
          const newWidth = $(`.${exampleNumber} .inner-example`).width() + additionalWidth
          const newHeight = $(`.${exampleNumber} .inner-example`).height() + additionalHeight

          $(`.${exampleNumber} .inner-example`)
            .css('width', newWidth)
            .css('height', newHeight)

          return widgetInstance.resize(newWidth, newHeight)
        }
      }

      $(`.${exampleNumber} .more-button`).bind('click', newResizeHandler(25, 25))
      $(`.${exampleNumber} .less-button`).bind('click', newResizeHandler(-25, -25))
      $(`.${exampleNumber} .more-width-button`).bind('click', newResizeHandler(25, 0))
      $(`.${exampleNumber} .less-width-button`).bind('click', newResizeHandler(-25, 0))
      $(`.${exampleNumber} .more-height-button`).bind('click', newResizeHandler(0, 25))
      $(`.${exampleNumber} .less-height-button`).bind('click', newResizeHandler(0, -25))
    }

    if (_.has(dataAttributes, 'rerender')) {
      const rerenderControls = $(rerenderHtmlSnippet)
      element.append(rerenderControls)

      const rerenderHandler = function (event) {
        event.preventDefault()
        const newConfigName = $(`.${exampleNumber} .rerender-config`).val()
        console.log(`newConfig: ${newConfigName}`)

        retrieveConfig(newConfigName).then((newConfig) => {
          widgetInstance.setConfig(newConfig)
          if (widgetInstance.setUserState) {
            widgetInstance.setUserState(window.stateUpdates[window.stateUpdates.length - 1])
          }
          widgetInstance.draw()
        }).catch((error) => {
          console.error('Error in rerender:')
          console.error(error)
        })
      }

      $(`.${exampleNumber} .rerender-button`).bind('click', rerenderHandler)
    }

    const surroundingDiv = $('<div>')
      .attr('class', 'inner-example')
      .css('width', `${dataAttributes.width}`)
      .css('height', `${dataAttributes.height}`)

    if (_.has(dataAttributes, 'border')) {
      surroundingDiv.addClass((dataAttributes.border) ? 'border' : 'no-border')
    } else {
      surroundingDiv.addClass('border-unset')
    }

    const widgetDiv = $('<div>')

    surroundingDiv.append(widgetDiv)
    element.append(surroundingDiv)

    // TEMPLATE : you will need to instantiate your widget here
    widgetInstance = new WidgetClass(widgetDiv, dataAttributes.width, dataAttributes.height, stateChangedCallback)
    widgetInstance.setConfig(config)
    if (widgetInstance.setUserState) {
      widgetInstance.setUserState(state)
    }
    widgetInstance.draw()
  }).catch((error) => {
    console.log(error)
  })
}

const addLinkToIndex = function () {
  const indexLinkContainer = $('<div>')
    .addClass('index-link')

  const indexLink = $('<a>')
    .attr('href', '/')
    .html('back to index')

  indexLinkContainer.append(indexLink)
  return $('body').prepend(indexLinkContainer)
}

$(document).ready(function () {
  addLinkToIndex()
  $('.example').each(addExampleTo)
  $('body').attr('loaded', '')

  console.log('adding to window')
  // NB "export" addExampleTo function so it can be used in renderExample.html
  window.addExampleTo = addExampleTo
})
