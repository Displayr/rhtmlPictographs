const puppeteer = require('puppeteer')
const { snapshotTesting: { renderExamplePageTestHelper } } = require('rhtmlBuildUtils')
const loadWidget = require('../lib/loadWidget.helper')

const {
  configureImageSnapshotMatcher,
  puppeteerSettings,
  testSnapshots,
  jestTimeout,
} = renderExamplePageTestHelper

jest.setTimeout(jestTimeout)
configureImageSnapshotMatcher({ collectionIdentifier: 'resize' })

describe('resize', () => {
  let browser

  beforeEach(async () => {
    browser = await puppeteer.launch(puppeteerSettings)
  })

  afterEach(async () => {
    await browser.close()
  })

  test('basic resize', async function () {
    const { page } = await loadWidget({
      browser,
      configName: 'data.test_plan.two_blue_squares',
      width: 300,
      height: 100,
    })

    await testSnapshots({ page, testName: '1A_basic_initial' })

    const sizesToSnapshot = [
      { width: 600, height: 200 },
    ]

    for (const size of sizesToSnapshot) {
      const { width, height } = size
      await page.evaluate((width, height) => {
        window.resizeHook(width, height)
      }, width, height)

      await page.waitFor(1000)

      await testSnapshots({ page, testName: `1B_basic_after_resize_${width}x${height}` })
    }
    await page.close()
  })

  test('resize with top left orientation', async function () {
    const { page } = await loadWidget({
      browser,
      configName: 'data.test_plan.flexible_table_lots_of_labels_circles_and_urls_top_left_oriented',
      width: 200,
      height: 600,
    })

    await testSnapshots({ page, testName: '2A_with_title_initial' })

    const sizesToSnapshot = [
      { width: 400, height: 600 },
      { width: 600, height: 600 },
      { width: 800, height: 600 },
      { width: 800, height: 400 },
      { width: 800, height: 200 },
    ]

    for (const size of sizesToSnapshot) {
      const { width, height } = size
      await page.evaluate((width, height) => {
        window.resizeHook(width, height)
      }, width, height)

      await page.waitFor(1000)

      await testSnapshots({ page, testName: `2B_with_title_after_resize_${width}x${height}` })
    }
    await page.close()
  })

  test('resize with centered orientation', async function () {
    const { page } = await loadWidget({
      browser,
      configName: 'data.test_plan.flexible_table_lots_of_labels_circles_and_urls_centered',
      width: 200,
      height: 600,
    })

    await testSnapshots({ page, testName: '3A_with_title_initial' })

    const sizesToSnapshot = [
      { width: 400, height: 600 },
      { width: 600, height: 600 },
      { width: 800, height: 600 },
      { width: 800, height: 400 },
      { width: 800, height: 200 },
    ]

    for (const size of sizesToSnapshot) {
      const { width, height } = size
      await page.evaluate((width, height) => {
        window.resizeHook(width, height)
      }, width, height)

      await page.waitFor(1000)

      await testSnapshots({ page, testName: `3B_with_title_after_resize_${width}x${height}` })
    }
    await page.close()
  })

  test('resize with flip usecase', async function () {
    const { page } = await loadWidget({
      browser,
      configName: 'data.flip_usecases.flip_usecase_barchart_of_squares_variable_number_of_rows_per_cell',
      width: 200,
      height: 600,
    })

    await testSnapshots({ page, testName: '4A_with_title_initial' })

    const sizesToSnapshot = [
      { width: 400, height: 600 },
      { width: 600, height: 600 },
      { width: 800, height: 600 },
      { width: 800, height: 400 },
      { width: 800, height: 200 },
    ]

    for (const size of sizesToSnapshot) {
      const { width, height } = size
      await page.evaluate((width, height) => {
        window.resizeHook(width, height)
      }, width, height)

      await page.waitFor(1000)

      await testSnapshots({ page, testName: `4B_with_title_after_resize_${width}x${height}` })
    }
    await page.close()
  })
})
