// Load plugins
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var browsersync = require('browser-sync');
var rimraf = require('rimraf');
var yargs = require('yargs');
var yaml = require('js-yaml');
var fs = require('fs');

// Check for --production flag
const PRODUCTION = !!(yargs.argv.production);

// Load settings from config.yml
var config = loadConfig();

function loadConfig() {
  ymlFile = fs.readFileSync('config.yml', 'utf8');
  return yaml.load(ymlFile);
}

var sassOptions = {
  errLogToConsole: true,
  outputStyle: 'expanded',
  includePaths: config.PATHS.sass
};

var autoprefixerOptions = {
  browsers: config.COMPATIBILITY
};

// Styles
function styles() {
  return gulp.src(config.PATHS.src +'/scss/all.scss')
    .pipe($.sourcemaps.init())
    .pipe($.sass(sassOptions).on('error', $.sass.logError))
    .pipe($.autoprefixer(autoprefixerOptions))
    .pipe($.if(PRODUCTION, $.rename({ suffix: '.min' })))
    .pipe($.if(PRODUCTION, $.cssnano()))
    .pipe($.if(!PRODUCTION, $.sourcemaps.write('.', { sourceRoot: '../../assets/src/scss/' })))
    .pipe(gulp.dest(config.PATHS.dist + '/css'))
    .pipe($.notify({ message: 'Styles task complete' }));
};

// Scripts
function scripts() {
  return gulp.src(config.PATHS.javascript)
    .pipe($.sourcemaps.init())
    .pipe($.concat('all.js'))
    .pipe($.if(PRODUCTION, $.rename({ suffix: '.min' })))
    .pipe($.if(PRODUCTION, $.uglify()))
    .pipe($.if(!PRODUCTION, $.sourcemaps.write('.', { sourceRoot: '../../assets/src/js/' })))
    .pipe(gulp.dest(config.PATHS.dist + '/js'))
    .pipe($.notify({ message: 'Scripts task complete' }));
};

// Copy fonts
function fonts() {
  return gulp.src(config.PATHS.fonts)
    .pipe(gulp.dest(config.PATHS.dist + '/fonts'));
};

// Clean
function clean(done) {
    rimraf(config.PATHS.dist, done);
}

// The main build task
gulp.task('build', gulp.series(
  clean,
  gulp.parallel(styles, scripts, fonts)
));

// Watch
function watch() {

  // Initialize Browsersync
  browsersync.init({
    proxy: config.PROXY
  });

  // Watch .scss files
  gulp.watch(config.PATHS.src + '/scss/**/*.scss', styles);
  // Watch .js files
  gulp.watch(config.PATHS.src + '/js/**/*.js', scripts);
  // Watch any view files in 'views', reload on change
  gulp.watch(['views/**/*.php']).on('change', browsersync.reload);
  // Watch any files in 'assets/dist', reload on change
  gulp.watch([config.PATHS.dist + '/js/*']).on('change', browsersync.reload);
  gulp.watch([config.PATHS.dist + '/css/*']).on('change', browsersync.reload);
};

// Default task runs build and then watch
gulp.task('default', gulp.series('build', watch));

// Export these function to the Gulp client
gulp.task('clean', clean);
gulp.task('fonts', fonts);
gulp.task('styles', styles);
gulp.task('scripts', scripts);
