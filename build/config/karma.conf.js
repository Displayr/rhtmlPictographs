module.exports = function(config) {

  config.set({
    // browsers: ['PhantomJS'],
    browsers: ['Chrome'],
    basePath: '../../',
    files: require('./externalLibs.json').concat([
      'theSrc/scripts/RecolorSvg.coffee',
      'theSrc/scripts/ImageFactory.coffee',
      'theSrc/scripts/ColorFactory.coffee',
      'theSrc/scripts/BaseCell.coffee',
      'theSrc/scripts/DisplayError.coffee',
      'theSrc/scripts/GraphicCell.coffee',
      'theSrc/scripts/LabelCell.coffee',
      'theSrc/scripts/Pictograph.coffee',

      'theSrc/**/*.spec.coffee'
    ]),

    frameworks: ['mocha', 'sinon-chai', 'chai-dom', 'chai-as-promised', 'chai', 'sinon'],

    preprocessors: {
      '**/*.coffee': ['coffee']
    },

    reporters: ['mocha'],

    phantomjsLauncher: {
      exitOnResourceError: true
    },

    coffeePreprocessor: {
      options: {
        bare: true,
        sourceMap: false
      },
      transformPath: function(path) {
        return path.replace(/\.coffee$/, '.js')
      }
    }
  })
};

