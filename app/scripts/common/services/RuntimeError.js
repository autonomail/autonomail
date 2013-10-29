/**
 * Runtime error base class. We use this intead of the built-in Error object to raise exceptions.
 */

(function(app) {

  app.factory('RuntimeError', function() {

    var RuntimeError = function(message, error) {
      if (1 === arguments.length) {
        error = message;
        message = '';
      }

      var messages = [];
      if (0 < message.length) {
        messages.push(message);
      }

      if (error) {
        if ('string' === typeof error) {
          messages.push(error);
        } else if (error instanceof RuntimeError) {
          this.rootCause = error;
          messages = messages.concat(error.messages);
        } else if (error instanceof Error) {
          this.rootCause = error;
          messages.push(error.message);
        }
      }

      this.messages = messages;  // for convenient access to individual messages (very useful during testing)
      this.message = messages.join('; ');
    };

    // inherit from Error
    RuntimeError.prototype = new Error();
    RuntimeError.prototype.constructor = RuntimeError;


    return RuntimeError;

  });

}(angular.module('App.common', [])));

