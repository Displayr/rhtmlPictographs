const gulp = require('gulp');
const shell = require('gulp-shell');

gulp.task('makeDocs', function () {
  return gulp.src('./build/scripts/makeDoc.r', { read: false })
    .pipe(shell([
      'r --no-save 2>/dev/null >/dev/null < <%= file.path %>',
    ], {}));
});
