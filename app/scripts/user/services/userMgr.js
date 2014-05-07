
/**
 * Manages the logged-in user.
 */

(function(app) {
  'use strict';

  app.factory('UserMgr', function(Log, Alert, $q, $modal, RuntimeError, SecureData, AuthCredentials, GPG, Server) {

    var log = Log.create('UserMgr');

    var currentUser = null;

    var UserMgr = Class.extend({


      /**
       * Set the current user.
       *
       * Ensures that the given user's secure data store and accompanying crypto keys have been setup.
       * 
       * @param userId {Object} user id.
       * 
       * @return {Promise}
       */
      setCurrentUser: function(userId) {
        var self = this;

        return $q.when()
          .then(function setupData() {
            if (userId) {
              return self._ensureUserHasSecureDataSetup(userId);
            }
          })
          .then(function() {
            currentUser = userId;
          });
      },



      /**
       * Get the current user.
       *
       * @return {String} user id if set; null otherwise.
       */
      getCurrentUser: function() {
        return currentUser;
      },



      /** 
       * Backup GPG data for given user.
       * @param  {String} userId user id.
       * @return {Promise}        
       */
      backupGPGData: function(userId) {
        return GPG.backup()
          .then(function savePGPData(pgpData) {
            return SecureData.set(userId, 'pgp', pgpData);
          })
      },



      /**
       * Ensures that the given user's secure data store and accompanying crypto keys have been setup.
       *
       * @param [userId] {string} user id. 
       *
       * @return {Promise}
       * @private
       */
      _ensureUserHasSecureDataSetup: function(userId) {
        var self = this;

        var defer = $q.defer();

        // show modal
        var modalInstance = $modal.open({
          templateUrl: 'app/modals/userDataInit.html',
          keyboard: false,
          backdrop: 'static'
        });

        SecureData.get(userId, 'pgp')
          .then(function ensurePGPKeys(pgpData) {
            if (pgpData) {
              return GPG.restore(pgpData);
            } else {
              var user = AuthCredentials.get(userId);

              return GPG.generateKeyPair(user.email, user.passphrase, 2048)
                .then(function backup() {
                  return self.backupGPGData(userId);
                });
              ;
            }
          })
          .then(defer.resolve)
          .catch(function error(err) {
            Alert.error('An error ocurred whilst setting up your secure data.');

            defer.reject(err);
          })
          .finally(function() {
            // hide modal
            modalInstance.close();
          });

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



}(angular.module('App.user', ['App.common', 'App.data', 'ui.bootstrap.modal'])));
