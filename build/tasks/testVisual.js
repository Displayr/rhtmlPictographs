'use strict';

const gulp = require('gulp');
const path = require('path');
const $ = require('gulp-load-plugins')();
const cliArgs = require('yargs').argv;
gulp.task('webdriverUpdate', $.protractor.webdriver_update);

function runProtractor (done) {
  let args = [];
  if (cliArgs.testLabel) {
    args.push(`--params.testLabel=${cliArgs.testLabel}`)
  }
  else {
    args.push(`--params.testLabel=Default`)
  }

  if (cliArgs.specFilter) {
    args.push(`--params.specFilter=${cliArgs.specFilter}`)
  }

  gulp.src('build/scripts/testVisual.js')
    .pipe($.protractor.protractor({
      configFile: path.join(__dirname, '../config/protractor.conf.js'),
      args: args
    }))
    .on('error', function (err) {
      throw err;
    })
    .on('end', function () {
      done();
    })
    .pipe($.exit());
}

gulp.task('testVisual', ['webdriverUpdate', 'connect'], runProtractor);

// NB p_skip skips the webdriver download step - it is downloading gecko drivers every time (30MB / run)
// TODO - need to detect which browser drivers are required - probavbly in protractor conf
gulp.task('testVisual_s', runProtractor);
