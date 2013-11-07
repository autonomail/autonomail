/**
 * Holds user authentication credentials.
 *
 * This data should never be persisted.
 */

(function(app) {
  'use strict';

  app.factory('AuthCredentials', function($log, $q, RuntimeError) {

    var credentials = {};


    return new (Class.extend({

      /**
       * Set login credentials for the given user.
       *
       * @param emailAddress {string} email id
       * @param credentails {Object} contains keys: username, password
       */
      set: function(emailAddress, data) {
        $log.debug('Setting credentials for ' + emailAddress, data);

        credentials[emailAddress] = {
          username: data.username,
          password: data.password
        };
      },


      get: function(emailAddress) {
        return credentials[emailAddress];
      }

    }));
  });


}(angular.module('App.data', ['App.common'])));
