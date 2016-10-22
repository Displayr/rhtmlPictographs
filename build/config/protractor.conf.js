'use strict';

const _ = require('lodash');
const testVisualConfig = require('../config/testVisual.json');

exports.config = {

  capabilities: {
    'browserName': 'chrome'
  },

  baseUrl: 'http://localhost:9000',

  onPrepare: function() {

    const validParams = ['testLabel', 'specFilter'];
    _(validParams).each( (validParam) => {
      if (_.has(browser.params, validParam)) {
        testVisualConfig[validParam] = browser.params[validParam];
      }
    });
    global['visualDiffConfig'] = testVisualConfig;
  },

  jasmineNodeOpts: {
    showColors: true,
    defaultTimeoutInterval: 240000
  }
};
