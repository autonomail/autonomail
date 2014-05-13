/**
 * Runtime error base class. We use this intead of the built-in Error object to raise exceptions.
 */

(function(app) {

  app.factory('RuntimeError', function() {

    var RuntimeError = function(message) {
      Error.call(this, message);
      this.name = 'RuntimeError';
      this.message = message || 'An error occurred';
      this.data = _.toArray(arguments).slice(1);
      Error.captureStackTrace(this, RuntimeError);
    };

    // inherit from Error
    RuntimeError.prototype = new Error();
    RuntimeError.prototype.constructor = RuntimeError;



    /**
     * Get string representation of this error.
     * @return {Array} list of strings. 
     */
    RuntimeError.prototype.toStringLines = function() {
      var str = [this.name + ': ' + this.message];

      if (0 < this.data.length) {
        var prefixFirstLine = '-> ',
          prefixAfterFirstLine = '   ';

        this.data.forEach(function(d) {
          var toAdd = null;

          if (d instanceof RuntimeError) {
            toAdd = d.toStringLines();
          } 
          else if (d instanceof Error) {          
            toAdd = (d.message + '').split("\n");
          }
          else if (d instanceof Array) {
            toAdd = d;
          }
          else {
            toAdd = ('' + d).split("\n");
          }

          if (toAdd) {
            str.push(prefixFirstLine + toAdd[0]);
            for (var i=1; toAdd.length > i; ++i) {
              str.push(prefixAfterFirstLine + toAdd[i]);
            }
          }
        });        
      }

      return str;
    };



    /**
     * Get string representation of this error.
     * @return {String}
     */
    RuntimeError.prototype.toString = function() {
      return this.toStringLines().join("\n");
    };




    /**
     * Add a function to given base error class which will allow a caller to define a sub error type of that base class.
     *
     * @param {String} newClassName Name of this new error type.
     * @param {Class} [baseClass] Base class (should be a subtype of `Error`) to derive this new error from. Default is `RuntimeError`.
     *
     * @return {Function} The new error class.
     */
    var _enableSubClasses = function(errorClass) {
      /**
       * @param {String} newClassName Name of this new error type.
       *
       * @return {Function} The new error class.
       */
      (errorClass).define = function(newClassName) {
        var subClass = function() {
          (errorClass).apply(this, arguments);
          this.name = newClassName;
          Error.captureStackTrace(this, subClass);
        };
        inherits(subClass, (errorClass));
        _enableSubClasses(subClass);
        return subClass;        
      };
    };

    _enableSubClasses(RuntimeError);


    return RuntimeError;
  });

}(angular.module('App.common', [])));

