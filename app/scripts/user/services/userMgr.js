/**
 * Manages the logged-in user.
 */

(function(app) {
  'use strict';

  app.factory('UserMgr', function($log, $q, RuntimeError) {

    var currentUser = null;

    return new (Class.extend({

      /**
       * Set the active user.
       *
       * @param user {Object} user details.
       */
      setUser: function(user) {
        var emailAddress = user.name + '@' + user.domain;
        $log.info('Setting current user: ' + emailAddress);

        currentUser = {
          id: emailAddress,
          auth: user
        };
      }

    }));
  });


}(angular.module('App.user', ['App.common'])));
