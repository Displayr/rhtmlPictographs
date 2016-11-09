'use strict';

const _ = require('lodash');
const fs = require('fs-extra');
const path = require('path');
const recursiveReaddirSync = require('recursive-readdir-sync');

let snapshotsCount = 0;

// NV global.visualDiffConfig is set globally in protractor.conf.js
const baseContentPath = path.join(__dirname, '../../theSrc/internal_www/content');
const requiredConfigKeys = [
  'applitoolsKey',
  'testLabel',
  'browserWidth',
  'browserHeight',
  'checkRegionTimeout',
  'forceFullPageScreenshot'
];

// Why Syncronous ? Until we get deferred test registration working in Jasmine or Mocha we need to get the list of all the content files synchronously
// mocha fix (that I cant get to work w/ protractor) : https://github.com/mochajs/mocha/commit/b4312b0e6e6d0c1b88a80683189bba92017a1824
// jasmine fix - cant find one yet
const getContentFiles = function() {
  // NB +1 in substring to strip an additional slash
  return recursiveReaddirSync(baseContentPath).map( (absolutePath) => absolutePath.substring(baseContentPath.length+1) ).sort()
}

const registerTests = function(pathsToRegister) {

  _(requiredConfigKeys).each( (requiredKey) => {
    if (!_.has(global.visualDiffConfig, requiredKey)) {
      throw new Error(`required global.visualDiffConfig field ${requiredKey} not specified`)
    }
  })

  if (_.has(global.visualDiffConfig, 'specFilter')) {
    const specFilterRegex = new RegExp(global.visualDiffConfig.specFilter);
    pathsToRegister = pathsToRegister.filter( (candidatePath) => {
      return specFilterRegex.test(candidatePath);
    });
  }

  const Eyes = require('eyes.protractor').Eyes;
  const eyes = new Eyes();
  eyes.setApiKey(global.visualDiffConfig.applitoolsKey);
  eyes.setForceFullPageScreenshot(global.visualDiffConfig.forceFullPageScreenshot);

  describe('Take visual regression snapshots', function () {

    beforeEach(function () {
      browser.ignoreSynchronization = true;
    });

    _.forEach(pathsToRegister, (contentPath) => {
      it(`Capturing ${contentPath} visual regression content`, function(done) {

        eyes.open(
          browser,
          `rHtmlPictograph ${global.visualDiffConfig.testLabel}`,
          contentPath,
          { width: global.visualDiffConfig.browserWidth, height: global.visualDiffConfig.browserHeight }
        );

        browser.get(`/internal_www/content/${contentPath}`).then( () => {
          console.log(`Page ${contentPath} is loaded`);

          const donePromises = element.all(by.css('[snapshot-name]')).each(function(element) {
            return element.getAttribute('snapshot-name').then( (snapshotName) => {
              if (snapshotName) {
                console.log(`take snapshot ${contentPath} ${snapshotName}`);
                snapshotsCount++;
                eyes.checkRegionBy(by.css(`[snapshot-name="${snapshotName}"]`), snapshotName, global.visualDiffConfig.checkRegionTimeout);
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
}

registerTests(getContentFiles());


