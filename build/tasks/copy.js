const gulp = require('gulp');

gulp.task('copy', function () {
  gulp.src([
    'theSrc/**/*.html',
    'theSrc/**/*.css'
  ], {}).pipe(gulp.dest('browser'));

  gulp.src([
    'theSrc/images/**/*'
  ], {}).pipe(gulp.dest('browser/images'));

  var rename = require('gulp-rename');
  gulp.src('theSrc/R/htmlwidget.yaml')
    .pipe(rename(gulp.context.widgetName + '.yaml'))
    .pipe(gulp.dest('inst/htmlwidgets/'));

  gulp.src('theSrc/R/htmlwidget.R')
    .pipe(rename(gulp.context.widgetName + '.R'))
    .pipe(gulp.dest('R/'));

  gulp.src(require('../config/externalLibs.json'))
    .pipe(gulp.dest('inst/htmlwidgets/lib/'))
    .pipe(gulp.dest('browser/external/'))
});
