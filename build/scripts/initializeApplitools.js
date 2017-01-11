const Eyes = require('eyes.protractor').Eyes;
const _ = require('lodash');

const requiredConfigKeys = [
  'applitoolsKey',
  'testLabel',
  'browserWidth',
  'browserHeight',
  'defaultMatchTimeout',
  'pageLoadWaitSeconds',
  'forceFullPageScreenshot',
];

module.exports = {
  getEyes: function(applitoolsConfig) {
    _(requiredConfigKeys).each( (requiredKey) => {
      if (!_.has(applitoolsConfig, requiredKey)) {
        throw new Error(`required applitoolsConfig field ${requiredKey} not specified`)
      }
    })

    const eyes = new Eyes();
    eyes.setApiKey(applitoolsConfig.applitoolsKey);
    eyes.setForceFullPageScreenshot(applitoolsConfig.forceFullPageScreenshot);
    eyes.setStitchMode(Eyes.StitchMode.CSS);
    eyes.setDefaultMatchTimeout(applitoolsConfig.defaultMatchTimeout);

    return eyes;
  }
}
