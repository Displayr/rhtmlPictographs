const gulp = require('gulp');
const shell = require('gulp-shell');

gulp.task('makeExample', function () {
  return gulp.src('./build/scripts/convertContentToExamplesInR.js', { read: false })
    .pipe(shell([
      'node <%= file.path %>',
    ], {}));
});
