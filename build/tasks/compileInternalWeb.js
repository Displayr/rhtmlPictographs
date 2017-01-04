const gulp = require('gulp');

gulp.task('compileInternalWeb', [
  'compileRenderIndexPage',
  'compileRenderContentPage',
]);
