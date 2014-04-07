/**
 * Manages the logged-in user.
 */

(function(app) {
  'use strict';

  app.factory('UserMgr', function(Log, $q, RuntimeError, SecureData, AuthCredentials, GPG, Server) {

    var log = Log.create('UserMgr');

    var currentUser = null;

    var UserMgr = Class.extend({


      /**
       * Set the current user.
       *
       * @param userId {Object} user id.
       */
      setCurrentUser: function(userId) {
        currentUser = userId;
      },



      /**
       * Get the current user.
       *
       * @return {string} user id.
       */
      getCurrentUser: function() {
        return currentUser;
      },




      /**
       * Ensures that the given user's secure data store and accompanying crypto keys have been setup.
       *
       * @param [userId] {string} user id. If not given then current user's is used. If current user not set then
       * the Promise is rejected.
       *
       * @return {Promise}
       */
      ensureUserHasSecureDataSetup: function(userId) {
        var defer = $q.defer();

        if (!userId) {
          if (!currentUser) {
            defer.reject(new RuntimeError('User not yet logged in'));
          } else {
            userId = currentUser;
          }
        }

        if (userId) {
          SecureData.get(userId, 'pgp')
            .then(function ensurePGPKeys(pgpData) {
              if (pgpData) {
                return GPG.restore(pgpData);
              } else {
                var user = AuthCredentials.get(userId);

                return GPG.generateKeyPair(user.email, user.password, 2048)
                  .then(function getPGPData() {
                    return GPG.backup();
                  })
                  .then(function savePGPData(pgpData) {
                    return SecureData.set(userId, 'pgp', pgpData);
                  })
                ;
              }
            })
            .then(defer.resolve)
            .catch(function error(err) {
              defer.reject(err);
            });
        }

        return defer.promise;
      }

    });


    /**
     * The state to take the user to once logged-in.
     * @type {String}
     */
    UserMgr.prop('postLoginState', { set: true });


    return new UserMgr();
  });


}(angular.module('App.user', ['App.common', 'App.data'])));
