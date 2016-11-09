const gulp = require('gulp');

gulp.task('compileCoffee', function () {
  const gulp_coffee = require("gulp-coffee");

  gulp.src(['theSrc/scripts/**/*.coffee', '!theSrc/scripts/**/*.spec.coffee'])
    .pipe(gulp_coffee({ bare: true, header: true }))
    .pipe(gulp.dest('browser/scripts'))
    .pipe(gulp.dest('inst/htmlwidgets/'));

  gulp.src('theSrc/internal_www/**/*.coffee')
    .pipe(gulp_coffee({ bare: true, header: true }))
    .pipe(gulp.dest('browser/internal_www'));
});
