var nbld = require('nbld');
var gulp = require('gulp');

nbld(gulp, {
    src: './src',
    dest: './build',
    metrika: 32909025
});

gulp.task('production', [ 'html:production' ]);
