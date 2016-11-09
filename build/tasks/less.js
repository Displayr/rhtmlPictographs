const gulp = require('gulp');

gulp.task('less', function () {
  var less = require('gulp-less');
  return gulp.src('theSrc/styles/**/*.less')
    .pipe(less({}))
    .pipe(gulp.dest('browser/styles'))
    .pipe(gulp.dest('inst/htmlwidgets/lib/style'));
});
