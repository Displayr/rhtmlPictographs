const gulp = require('gulp');
const path = require('path');

gulp.task('testSpecs', function (done) {
  var Server = require('karma').Server;
  new Server({
    configFile: path.join(__dirname, '../config/karma.conf.js'),
    singleRun: true
  }, done).start();
});
