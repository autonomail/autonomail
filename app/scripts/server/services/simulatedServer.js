'use strict';

(function(app) {

  app.factory('SimulatedServer', function($q, RuntimeError, ServerInterface) {

    /**
     * See the ServerInterface class specification for documentation regarding the functions here.
     */
    return new (ServerInterface.extend({
      checkUsernameAvailable: function(username) {
        var defer = $q.defer();
        if ('username' !== username) { // fails if you choose 'username'
          defer.resolve();
        } else {
          defer.reject(new RuntimeError('Username not available: ' + username));
        }
        return defer.promise;
      },


      toString: function() {
        return 'Simulated server';
      }
    }));

  });


}(angular.module('App.server', ['App.common'])));
