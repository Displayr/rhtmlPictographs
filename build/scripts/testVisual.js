'use strict';

const _ = require('lodash');

// NB global.visualDiffConfig is set globally in protractor.conf.js
const eyes = require('./initializeApplitools').getEyes(global.visualDiffConfig)

const contentManifest = require('../../browser/content/contentManifest.json')
let contentFiles = _.flattenDeep(_.values(contentManifest))

if (_.has(global.visualDiffConfig, 'specFilter')) {
  const specFilterRegex = new RegExp(global.visualDiffConfig.specFilter);
  contentFiles = contentFiles.filter( (candidatePath) => {
    return specFilterRegex.test(candidatePath);
  });
}

let snapshotsCount = 0;
describe('Take visual regression snapshots', function () {

  beforeEach(function () {
    browser.ignoreSynchronization = true;
  });

  _.forEach(contentFiles, (contentPath) => {
    it(`Capturing ${contentPath} visual regression content`, function(done) {

      eyes.open(
        browser,
        `rHtmlPictograph ${global.visualDiffConfig.testLabel}`,
        contentPath,
        { width: global.visualDiffConfig.browserWidth, height: global.visualDiffConfig.browserHeight }
      );

      browser.get(contentPath).then( () => {
        console.log(`Page ${contentPath} is loaded`);
      }).then( () => {
        console.log(`Waiting ${global.visualDiffConfig.pageLoadWaitSeconds * 1000} seconds for widgetsPage`);
        return new Promise( (resolve ) => {
          setTimeout(() => {
            return resolve()
          }, global.visualDiffConfig.pageLoadWaitSeconds * 1000)
        })
      }).then( () => {
        const donePromises = element.all(by.css('[snapshot-name]')).each(function(element) {
          return element.getAttribute('snapshot-name').then( (snapshotName) => {
            if (snapshotName) {
              console.log(`take snapshot ${contentPath} ${snapshotName}`);
              snapshotsCount++;
              eyes.checkRegionBy(by.css(`[snapshot-name="${snapshotName}"]`), snapshotName);
            }
            else {
              console.error(`snapshot on page ${contentPath} missing snapshot name`);
            }
          });
        });
        return donePromises;
      }).then( () => {
        console.log(`done taking snapshots on ${contentPath}. Running snapshot count: ${snapshotsCount}`);
        eyes.close(false);
        done();
      }).catch( (error) => {
        console.log("test error:");
        console.log(error)
        eyes.close(false);
        done();
      })
    })
  })
})


