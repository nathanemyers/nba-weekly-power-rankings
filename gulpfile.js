const gulp = require('gulp');
const babel = require('gulp-babel');
const sass = require('gulp-sass');

gulp.task('js', function() {
  return gulp.src('./src/js/*.js')
    .pipe(gulp.dest('./dist/'));
});

gulp.task('sass', function() {
  return gulp.src('./src/sass/*.scss')
    .pipe(sass())
    .pipe(gulp.dest('./dist/'));
});

gulp.task('build', ['js', 'sass'], function() {
  return;
});
