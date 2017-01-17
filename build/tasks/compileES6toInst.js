const gulp = require('gulp');
const browserify = require('browserify');
const babelify = require('babelify');
const gutil = require('gulp-util');
const tap = require('gulp-tap');
const buffer = require('gulp-buffer');
const uglify = require('gulp-uglify');

const widgetEntryPoint = require('../config/widget.config.json').widgetEntryPoint;

gulp.task('compileES6ToInst', function () {
  return gulp.src(widgetEntryPoint, { read: false })
    .pipe(tap(function (file) {

      gutil.log(`bundling ${file.path}`);

      file.contents = browserify(file.path, { debug: true })
        .transform(babelify, {
          presets: ['es2015-ie'],
          plugins: ['transform-object-assign', 'array-includes'],
        })
        .bundle();
    }))
    .pipe(buffer())
    .pipe(uglify())
    .pipe(gulp.dest('inst/htmlwidgets/'));
});
