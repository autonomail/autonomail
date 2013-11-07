/**
 * Server base interface.
 *
 * This specifies the API for use by client code to communicate with the server. All concrete child classes must
 * fully implement this interface.
 */

(function(app) {

  app.factory('ServerInterface', function($q, RuntimeError) {

    return Class.extend({
      /**
       * Check if given username is available.
       * @param username {string} the username to check.
       * @return {Promise} resolved if ok; rejected otherwise.
       */
      checkUsernameAvailable: function(username) {
        var defer = $q.defer();
        defer.reject(new RuntimeError('Not yet implemented'));
        return defer.promise;
      },

      toString: function() {
        throw new RuntimeError('Not yet implemented');
      }
    });

  });

}(angular.module('App.server', ['App.common'])));

