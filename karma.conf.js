// Karma configuration
// http://karma-runner.github.io/0.10/config/configuration-file.html

module.exports = function(config) {
  config.set({
    // base path, that will be used to resolve files and exclude
    basePath: '',

    // testing framework to use (jasmine/mocha/qunit/...)
    frameworks: ['mocha'],

    // list of files / patterns to load in the browser
    files: [
      /* vendor libs */
      'app/bower_components/momentjs/moment.js',
      'app/bower_components/angular/angular.js',
      'app/bower_components/angular-bootstrap/ui-bootstrap-tpls.js',
      'app/bower_components/angular-ui-router/release/angular-ui-router.js',
      'app/bower_components/angular-mocks/angular-mocks.js',
      'app/bower_components/sjcl/sjcl.js',
      /* app src */
      'app/scripts/*.js',
      'app/scripts/**/*.js',
      /* test config */
      'test/sinon-1.7.3.js',
      'app/bower_components/chai/chai.js',
      'app/bower_components/sinon-chai/lib/sinon-chai.js',
      'test/config.js',
      /* test src */
      'test/mock/**/*.coffee',
      'test/spec/**/*.coffee'
    ],

    // list of files / patterns to exclude
    exclude: [],

    // web server port
    port: 8080,

    // level of logging
    // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,


    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera
    // - Safari (only Mac)
    // - PhantomJS
    // - IE (only Windows)
    browsers: ['PhantomJS'],


    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: false
  });
};
