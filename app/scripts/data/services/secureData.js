/**
 * This is responsible for managing the user's secure data.
 */

(function(app) {
  'use strict';

  app.factory('SecureData', function($log, $q, RuntimeError, Storage, AuthCredentials, Keygen) {

    /** Cached master encryption keys for users. */
    var cachedMasterKey = {};


    return new (Class.extend({
      /**
       * Create secure data for the given email address.
       *
       * This will fetch the user's auth credentials and use them to derive a secure key for encrypting the data with.
       *
       * @param emailAddress {string} the email id.
       *
       * @return {Promise} will resolve to true.
       * @private
       */
      _createSecureData: function(emailAddress) {
        var defer = $q.defer();

        var auth = AuthCredentials.get(emailAddress);

        if (!auth) {
          defer.reject(new RuntimeError('No auth credentials found for: ' + emailAddress));
        } else {

          Keygen.deriveNewKeyFromPassword(auth.password)
            .then(function setStorageItem(keyData) {
              return Storage.set(emailAddress, {
                salt: keyData.salt,
                iterations: keyData.iterations,
                keys: {
                  pgp: 'you wish!'
                }
              });
            })
            .then(defer.resolve)
            .catch(defer.reject)
          ;
        }

        return defer.promise;
      },




      /**
       * Load secure skeleton data for the given email address.
       *
       * @param emailAddress {string} the email id.
       *
       * @return {Promise} will resolve to stored data.
       * @private
       */
      _loadSecureData: function(emailAddress) {
        return Storage.get(emailAddress);
      },


      /**
       * Retrieve secure data master encryption key for given user.
       * @param emailAddress {string} user id.
       * @param params {Object} keygen parameters.
       * @return {Promise} resolves to the master key
       * @private
       */
      _calculateMasterKey: function(emailAddress, storedData) {
        var auth = AuthCredentials.get(emailAddress);

        if (!auth) {
          var defer = $q.defer();
          defer.reject(RuntimeError('No auth credentials found for: ' + emailAddress));
          return defer.promise;
        } else {
          return Keygen.deriveKeys({
            password: auth.password,
            salt: storedData.salt,
            iterations: storedData.iterations
          });
        }
      },



      /**
       * Get secure key store for the given email address.
       *
       * This will create one (and prompt the user accordingly) if a secure key store doesn't exist.
       *
       * @param emailAddress {string} the email id.
       *
       * @return {Promise} will resolve to an Object containing private key data.
       */
      get: function(emailAddress) {
        var self = this;

        var defer = $q.defer();

        self._loadSecureData(emailAddress)
          .then(function createStoredDataIfNeeded(data) {
            // already got secure key store?
            if (data) {
              return data;
            }
            // need to create secure key store
            else {
              return self._createSecureData(emailAddress);
            }
          })
          .then(function getMasterKey(storedData) {
            if (cachedMasterKey[emailAddress]) {
              return cachedMasterKey[emailAddress];
            } else {
              return self._calculateMasterKey(emailAddress, storedData);
            }
          })
          .then(function decryptSecureBlog(masterKey) {
            $log.debug('Master key: ', masterKey);
          })
          .then(defer.resolve)
          .catch(defer.reject);

        return defer.promise;
      },


    }));
  });


}(angular.module('App.data', ['App.common', 'App.crypto'])));
