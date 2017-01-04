import _ from 'lodash';

import Pictograph from './Pictograph';
import DisplayError from './DisplayError';

HTMLWidgets.widget({
  name: 'rhtmlPictographs',
  type: 'output',

  resize(el, width, height, instance) {
    return instance.resize(width, height);
  },

  initialize(el, width, height) {
    return new Pictograph(el, width, height);
  },

  renderValue(el, inputConfig, instance) {
    let config = null;
    try {
      if (_.isString(inputConfig) && inputConfig.match(/^{/)) {
        config = JSON.parse(inputConfig);
      } else {
        config = inputConfig;
      }
    } catch (err) {
      const readableError = new Error(`Pictograph error : Cannot parse 'settingsJsonString': ${err}`);
      console.error(readableError);
      const errorHandler = new DisplayError(el, readableError);
      errorHandler.draw();
      throw new Error(err);
    }

    try {
      instance.setConfig(config);
      return instance.draw();
    } catch (err) {
      console.error(err.stack);
      const errorHandler = new DisplayError(el, err);
      errorHandler.draw();
      throw new Error(err);
    }
  },
});
