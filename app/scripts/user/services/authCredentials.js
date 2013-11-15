/**
 * Holds user authentication credentials.
 *
 * This data should never be persisted.
 */

(function(app) {
  'use strict';

  app.factory('AuthCredentials', function(Log, RuntimeError) {
    var log = Log.create('AuthCred');

    var credentials = {};


    return new (Class.extend({

      /**
       * Set login credentials for the given user.
       *
       * @param data {Object} contains keys: name, password
       *
       * @return user id
       */
      set: function(data) {
        var emailAddress = data.name + '@' + data.domain;

        log.debug('Saving credentials for ' + emailAddress, data);

        credentials[emailAddress] = {
          email: emailAddress,
          username: data.name,
          password: data.password
        };

        return emailAddress;
      },

      /**
       * Get auth credentials for user.
       * @param userId {string} user id.
       * @return {Object}
       */
      get: function(userId) {
        if (!credentials[userId]) throw new RuntimeError('No credentials for user: ' + userId);

        return credentials[userId];
      }

    }));
  });


}(angular.module('App.user', ['App.common'])));
