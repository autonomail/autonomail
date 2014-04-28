/**
 * Our custom logger.
 *
 * This is a light-weight logging mechanism which has the following benefits:
 *   - Ability to log in 'memory' mode. Messages get saved until they're ready to be output.
 *   - Ability to log to an Output handler
 *   - Ability to specify logging category, and create nested categories for more fine-grained logging.
 */

(function(app) {

  app.provider('Log', function() {

    // these  map to `console` methods
    var LEVEL_DEBUG = 'debug',
      LEVEL_INFO = 'info',
      LEVEL_WARN = 'warn',
      LEVEL_ERROR = 'error';


    var logToConsole = false,
      defaultMinLevel = LEVEL_DEBUG,
      observers = [];


    /**
     * Log a message.
     *
     * @param category {Array} the category hierarchy.
     * @param level {integer} the level.
     * @param msg {string} the message.
     * @param additionalContent {Array} additional content
     * @private
     */
    var _log = function(category, viewScope, level, msg, additionalContent) {
      category = 0 < category.length ? category.join('.') + ': ' : '';

      var levelStr = ('[' + level.toUpperCase() + ']     ').slice(0,8);

      var args = [levelStr + category + msg];
      if (0 < additionalContent.length) {
        args = args.concat(additionalContent);
      }

      if (logToConsole) {
        console[level].apply(console, args);
      }

      // view scope
      if (viewScope) {
        viewScope.error = msg;
      }

      // notify observers
      observers.forEach(function(obs) {
        obs.call(obs, level, args);
      })
    };



    /**
     * An actual logger.
     * @type {*}
     */
    var Logger = Class.extend({
      /**
       * @param category {string} the category to log messages under.
       * @param {Object} [options] options.
       * @param {Logger} [options.parent] the parent logger category. Default is null.
       * @param {Object} [options.viewScope] view scope. The `error` property of this scope will be set to any error message which occurs.
       */
      init: function(category, options) {
        options = options || {};

        if (category) {
          this.category = [category];
        } else {
          this.category = [];
        }

        if (options.parent) {
          this.category = options.parent.category.concat(this.category);
        }

        if (options.viewScope) {
          this.viewScope = options.viewScope;
        }

        this.minLevel = defaultMinLevel;
      },


      /**
       * Register to be notified of all logging events across all loggers.
       * @protected
       */
      registerObserver: function(cb) {
        observers.push(cb);
      },


      /**
       * Create a child logger of this logger.
       * @param {String} category the child category name.
       * @param {Object} [viewScope] view scope. The `error` property of this scope will be set to any error message which occurs.
       * @return {Logger}
       */
      create: function(category, viewScope) {
        return new Logger(category, {
          parent: this,
          viewScope: viewScope
        });
      },


      /**
       * Dummy function
       * @private
       */
      _noop: function() {}
    });


    /**
     * Property: minimum log level.
     */
    Logger.prop('minLevel', {
      get: function() {
        return this.__minLevel;
      },
      set: function(level) {
        var self = this;

        // nullify all methods
        self.debug = self.info = self.warn = self.error = self._noop;

        // reconstruct methods
        switch (level) {
          case LEVEL_DEBUG:
            self.debug = function(msg) {
              var extraArgs = Array.prototype.slice.call(arguments, 1);
              
              _log(self.category, null, LEVEL_DEBUG, msg, extraArgs);
            }       
          case LEVEL_INFO:
            self.info = function(msg) {
              var extraArgs = Array.prototype.slice.call(arguments, 1);
              
              _log(self.category, null, LEVEL_INFO, msg, extraArgs);
            }       
          case LEVEL_WARN:
            self.warn = function(msg) {
              var extraArgs = Array.prototype.slice.call(arguments, 1);
              
              _log(self.category, null, LEVEL_WARN, msg, extraArgs);
            }       
          case LEVEL_ERROR:
            self.error = function(msg) {
              var extraArgs = Array.prototype.slice.call(arguments, 1);
              
              _log(self.category, self.viewScope, LEVEL_ERROR, msg, extraArgs);
            }       

            this.__minLevel = level;

            break;
          default:
            throw new Error('Invalid logging level: ' + level);
        }
      }
    });


    return {
      /**
       * Whether to write log messages to the console.
       * @param {Boolean} val
       */
      logToConsole: function(val) {
        logToConsole = val;
      },

      /**
       * Set the default minimum log level.
       * @param level {Integer}
       */
      setDefaultLevel: function(level) {
        defaultMinLevel = level;
      },


      $get: function() {
        return new Logger();
      }
    }

  });



  app.controller('LogViewerCtrl', function($scope, Log) {
    $scope.messages = '';

    $scope.showMessages = false;

    $scope.toggleMessages = function() {
      $scope.showMessages = !$scope.showMessages;
    };

    // when a new log msg is available
    Log.registerObserver(function(level, args) {
      _.each(args, function(arg) {
        var str = '';

        // Error
        if (arg instanceof Error) {
          str = arg.stack.join("\n") + "\n";
        } 
        // Array
        else if (arg instanceof Array) {
          str = arg.join("\n") + "\n";          
        }
        // Object
        else if (arg instanceof Object) {
          str = arg.toString();
        }
        // everything else
        else {
          str = arg + '';
        }

        $scope.messages += str + "\n";
      })
    });



  });


}(angular.module('App.common', [])));

