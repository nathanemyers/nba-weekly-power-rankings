const gulp = require('gulp');
const babel = require('gulp-babel');
const sass = require('gulp-sass');
const del = require('del');

gulp.task('js', () => {
  return gulp.src('./src/js/d3_rankings.js')
    .pipe(gulp.dest('./dist/index.js'));
});

gulp.task('html', () => {
  return gulp.src('./src/index.html')
    .pipe(gulp.dest('./dist/'));
});

gulp.task('sass', () => {
  return gulp.src('./src/sass/*.scss')
    .pipe(sass())
    .pipe(gulp.dest('./dist/'));
});

gulp.task('clean', () => {
  return del([ 'dist/*' ]);
})

gulp.task('build', ['clean', 'js', 'sass', 'html']);
