const gulp = require('gulp');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs-extra'));

gulp.task('clean', function(done) {
  const locationsToDelete = ['browser', 'inst', 'man', 'R', 'examples'];
  const deletePromises = locationsToDelete.map( function(location) { return fs.removeAsync(location); })
  Promise.all(deletePromises).then(function() { done() });
});
