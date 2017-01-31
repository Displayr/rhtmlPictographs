const fs = require('fs-extra');
const path = require('path');
const Eyes = require('eyes.protractor').Eyes;
const _ = require('lodash');

const requiredConfigKeys = [
  'testLabel',
  'browserWidth',
  'browserHeight',
  'defaultMatchTimeout',
  'pageLoadWaitSeconds',
  'forceFullPageScreenshot',
];


function getKey() {
  let applitoolsKey = null;
  const keyFile = path.join(__dirname, '../../', '.keys', 'applitools.key');
  try {
    applitoolsKey = fs.readFileSync(keyFile, 'utf-8');
  } catch (err) {
    console.error(`ERROR: Could not read key file: ${keyFile}`);
    process.exit(1);
  }
  return applitoolsKey;
}

module.exports = {
  getEyes(applitoolsConfig) {
    _(requiredConfigKeys).each((requiredKey) => {
      if (!_.has(applitoolsConfig, requiredKey)) {
        throw new Error(`required applitoolsConfig field ${requiredKey} not specified`);
      }
    });

    const eyes = new Eyes();
    eyes.setApiKey(getKey());
    eyes.setForceFullPageScreenshot(applitoolsConfig.forceFullPageScreenshot);
    eyes.setStitchMode(Eyes.StitchMode.CSS);
    eyes.setDefaultMatchTimeout(applitoolsConfig.defaultMatchTimeout);

    return eyes;
  },
};
