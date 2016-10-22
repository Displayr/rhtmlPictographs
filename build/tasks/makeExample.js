const gulp = require('gulp');

gulp.task('makeExample', ['core'], function () {
  var shell = require('gulp-shell');
  // TODO this should be in build/helpers
  return gulp.src('./build/scripts/convertContentToExamplesInR.coffee', {read: false})
    .pipe(shell([
      './node_modules/.bin/coffee <%= file.path %>',
    ], {}));
})
