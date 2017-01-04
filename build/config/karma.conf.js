module.exports = function (config) {

  config.set({
    browsers: ['Chrome'],
    basePath: '../../',
    files: [
      'theSrc/scripts/**/*.spec.js'
    ],

    frameworks: ['browserify', 'mocha', 'sinon-chai', 'chai-dom', 'chai-as-promised', 'chai', 'sinon'],

    preprocessors: {
      './theSrc/scripts/**/*.spec.js': ['browserify'],
    },

    browserify: {
      debug: true,
      transform: [['babelify', { presets: ['es2015'] }]],
    },
  });
};

