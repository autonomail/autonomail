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

    var LEVEL_DEBUG = 'debug',
      LEVEL_INFO = 'info',
      LEVEL_WARN = 'warn',
      LEVEL_ERROR = 'error';


    var outputDevice = console,
      defaultMinLevel = LEVEL_DEBUG;

    /**
     * Log a message.
     *
     * @param category {Array} the category hierarchy.
     * @param level {integer} the level.
     * @param msg {string} the message.
     * @param additionalContent {Array} additional content
     * @private
     */
    var _log = function(category, level, msg, additionalContent) {
      category = 0 < category.length ? category.join('.') + ': ' : '';

      switch (level) {
        case LEVEL_DEBUG:
          level = 'debug';
          break;
        case LEVEL_INFO:
          level = 'info';
          break;
        case LEVEL_WARN:
          level = 'warn';
          break;
        case LEVEL_ERROR:
          level = 'error';
          break;
      }

      var levelStr = ('[' + level.toUpperCase() + ']     ').slice(0,8);

      var args = [levelStr + category + msg];
      if (0 < additionalContent.length) {
        args = args.concat(additionalContent);
      }

      outputDevice[level].apply(outputDevice, args);
    };


    /**
     * An actual logger.
     * @type {*}
     */
    var Logger = Class.extend({
      /**
       * @param category {string} the category to log messages under.
       * @param [options] {Object} options.
       * @param [options.parent] {Logger} the parent logger category. Default is null.
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

        this.minLevel = defaultMinLevel;
      },


      /**
       * Create a child logger of this logger.
       * @param category {string} the child category name.
       * @return {Logger}
       */
      create: function(category) {
        return new Logger(category, this);
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
              _log(self.category, LEVEL_DEBUG, msg, Array.prototype.slice.call(arguments, 1));
            }       
          case LEVEL_INFO:
            self.info = function(msg) {
              _log(self.category, LEVEL_INFO, msg, Array.prototype.slice.call(arguments, 1));
            }       
          case LEVEL_WARN:
            self.warn = function(msg) {
              _log(self.category, LEVEL_WARN, msg, Array.prototype.slice.call(arguments, 1));
            }       
          case LEVEL_ERROR:
            self.error = function(msg) {
              _log(self.category, LEVEL_ERROR, msg, Array.prototype.slice.call(arguments, 1));
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
       * Set the log output device.
       * @param device {*}
       */
      setOutputDevice: function(device) {
        outputDevice = device;
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

}(angular.module('App.common', [])));

