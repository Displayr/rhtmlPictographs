const { snapshotTesting: { renderExamplePageTestHelper } } = require('rhtmlBuildUtils')

const {
  getExampleUrl,
  waitForWidgetToLoad,
} = renderExamplePageTestHelper

const PictographPlotPage = require('./pictographPlotPage')

const loadWidget = async ({
  browser,
  configName = '',
  stateName,
  width = 1000,
  rerenderControls,
  height = 600,
}) => {
  const page = await browser.newPage()
  const url = getExampleUrl({ configName, stateName, rerenderControls, width, height })
  const pictographPlot = new PictographPlotPage(page)

  await page.goto(url)
  await waitForWidgetToLoad({ page })

  return { page, pictographPlot }
}

module.exports = loadWidget
