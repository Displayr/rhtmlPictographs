const gulp = require('gulp');

gulp.task('makeDocs', ['core'], function () {
  var shell = require('gulp-shell');
  return gulp.src('./build/makeDoc.r', {read: false})
    .pipe(shell([
      'r --no-save 2>/dev/null >/dev/null < <%= file.path %>',
    ], {}))
});
