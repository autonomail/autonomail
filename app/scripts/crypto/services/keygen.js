'use strict';

(function(app) {

  app.factory('Keygen', function(RuntimeError, $log, $q) {

    return new (Class.extend({

      /**
       * Generate a secure password key from given user password and salt.
       *
       * @param password {string} user password.
       * @param salt {Array} 8 32-bit values representing the random salt.
       *
       * @return {Promise} resolves to a 512-bit key.
       */
      generatePassKey: function(password, salt) {
        var defer = $q.defer();



        return defer.promise;
      }

    }));
  });


}(angular.module('App.crypto', ['App.common'])));
