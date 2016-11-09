'use strict';

var _ = require('lodash');
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs-extra'));

if (!_.has(gulp,'context')) {
  gulp.context = {
    widgetName: 'rhtmlPictographs'
  }
}
else {
  console.error('Unexpected build failure. gulp already has a context.')
  process.exit(1)
}

fs.readdirSync('./build/tasks').filter(function(file) {
  return (/\.js$/i).test(file);
}).map(function(file) {
  require('./build/tasks/' + file);
});

gulp.task('default', function () {
  gulp.start('build');
});

gulp.task('build', function(done) {
  var runSequence = require('run-sequence');
  runSequence('clean', 'testSpecs', 'core', ['makeDocs', 'makeExample'], done);
});

gulp.task('core', ['compileCoffee', 'less', 'copy']);

gulp.task('serve', ['connect', 'watch'], function () {
  require('opn')('http://localhost:9000');
});
