/**
 * This is responsible for managing the user's secure data.
 */

(function(app) {
  'use strict';

  app.factory('SecureData', function($log, $q, RuntimeError, Storage, AuthCredentials, Keygen) {

    return new (Class.extend({


      /**
       * Create secure skeleton data for the given email address.
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

        Storage.get(emailAddress)
          .then(function handleStorageData(data) {
            // already got secure key store?
            if (data) {
              return data;
            }
            // need to create secure key store
            else {
              return self._createSecureData(emailAddress);
            }
          })
          .then(function extractKeys(storedData) {
            return storedData.keys;
          })
          .then(defer.resolve)
          .catch(defer.reject);

        return defer.promise;
      },


    }));
  });


}(angular.module('App.data', ['App.common', 'App.crypto'])));
