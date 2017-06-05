'use strict';

var gulp = require('gulp'),
	concat = require('gulp-concat'),
	csso = require('gulp-csso'),
	debug = require('gulp-debug'),
	del = require('del'),
	inject = require('gulp-inject'),
    path = require('path'),
	rename = require('gulp-rename'),
	runSequence = require('run-sequence'),
	sass = require('gulp-sass'),
	series = require('stream-series'),
	size = require('gulp-size'),
	sourcemaps = require('gulp-sourcemaps'),
	uglify = require('gulp-uglify'),
	watch = require('gulp-watch'),
	neat = require('node-neat').includePaths,
	normalize = require('node-normalize-scss').includePaths,
    browserSync = require('browser-sync').create(),
    autoprefixer = require('gulp-autoprefixer');

var paths = {
    js: ['./src/js/**/*.js'],
    img: ['./src/images/**/*.png', './src/images/**/*.JPG', './src/images/**/*.jpg', './src/images/**/*.gif', './src/images/**/*.svg'],
    html: [
        './src/**/*.shtml',
        './src/**/*.html',
        '!./src/index.shtml',
        './src/**/*.php',
        './src/.htaccess'
    ],
    scss: [
        './bower_components/slick-carousel/slick/slick.scss',
        './src/styles/main.scss'
    ],
    fonts: [
        './src/fonts/*.eot',
        './src/fonts/*.otf',
        './src/fonts/*.svg',
        './src/fonts/*.ttf',
        './src/fonts/*.woff',
    ],
    js_vendor: [
        './bower_components/jquery/dist/jquery.min.js',
        './bower_components/slick-carousel/slick/slick.min.js'
    ]
};

var distPath = "./dist";


/* Run "gulp build" to bulid the source to /dist */
gulp.task('build', function (cb) {
    runSequence(
        'clean',
        ['styles', 'fonts', 'images', 'scripts', 'copy_libs', 'copy_html'],
        'add_js_to_index',
        cb);
});

gulp.task('clean', function () {
    return del(['dist/**/*']);
});

// Copy images
gulp.task('images', function () {
    return gulp.src(paths.img)
        .pipe(debug())
        .pipe(gulp.dest(distPath + '/images/'))
        .pipe(size({title: 'images'}));
});

gulp.task('fonts', function () {
    return gulp.src(paths.fonts)
        .pipe(debug())
        .pipe(gulp.dest(distPath + '/fonts/'))
        .pipe(size({title: 'fonts'}));
});

gulp.task('styles', function () {
    return gulp.src(paths.scss)
        .pipe(sourcemaps.init())
        .pipe(sass({
        	includePaths: ['styles'].concat(neat, normalize)
        }).on('error', sass.logError))
        .pipe(csso())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(distPath + '/styles/'))
        .pipe(size({title: 'styles'}));
});

// Copy all files at the root level (src)
gulp.task('copy_html', function () {
    return gulp.src(paths.html)
        .pipe(gulp.dest(distPath));
});

gulp.task('copy_libs', function () {
    return gulp.src(paths.js_vendor)
        .pipe(debug())
        .pipe(gulp.dest(function (file) {
            return distPath + '/js/' + file.base.replace(file.cwd, '').replace('bower_components', 'vendor').replace('\\', '/');
        }));
});

// Concatenate and minify JavaScript
gulp.task('scripts', function () {
    return gulp.src(paths.js)
        .pipe(concat('main.min.js'))
        .pipe(uglify({preserveComments: 'some'}))
        .pipe(sourcemaps.init())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(distPath + '/js'))
        .pipe(size({title: 'scripts'}));
});

gulp.task('add_js_to_index', function () {
    var super_vendors = gulp.src(['./js/vendor/jquery/dist/*.js'], {read: false, cwd: distPath}),
        vendors = gulp.src(['./js/vendor/**/*.js', '!./js/vendor/jquery/dist/*.js'], {read: false, cwd: distPath}),
        vendorsorder = gulp.src(['./js/vendor/**/*.js', '!./js/vendor/jquery/dist/*.js'], {read: false, cwd: 'dist/'}),
        ours = gulp.src(['./js/**/*.js', './js/*.js', '!./js/vendor/**/*.js'], {read: false, cwd: distPath});
        return gulp.src(['./src/*.shtml', './src/*.html'])
        .pipe(debug())
        .pipe(inject(series(super_vendors, vendors, vendorsorder, ours), {
            starttag: '<!-- inject:js -->',
            endtag: '<!-- endinject -->',
            addRootSlash: false,
            ignorePath: '../dist',
            relative: true,
            removeTags: true
        }))
        .pipe(gulp.dest(distPath));
});

/* Run "gulp watch" to watch the css change on save  */

gulp.task('watch', ['styles'], function() {
	gulp.watch( "src/styles/**/*.scss", ['styles'] );
    gulp.watch( "src/*.html", ['copy_html'] );
});

// Static Server + watching scss/html files
gulp.task('serve', ['styles'], function() {

    browserSync.init({
        server: "./dist"
    });

    gulp.watch( "src/styles/**/*.scss", ['styles'] );
    gulp.watch( "src/*.html", ['copy_html'] );
});
