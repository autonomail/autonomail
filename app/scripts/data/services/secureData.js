/**
 * This is responsible for managing the user's secure data.
 */

(function(app) {
  'use strict';

  app.factory('SecureData', function($log, $q, RuntimeError, Storage, AuthCredentials, Encrypt) {

    /** Cached master encryption keys for users. */
    var cachedMasterKey = {};

    /** Cached decrypted secure data for users. */
    var cachedSecureData = {};


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
      _createSecureDataStore: function(emailAddress) {
        var defer = $q.defer();

        var auth = AuthCredentials.get(emailAddress);

        $log.debug('Creating data store for: ' + emailAddress);

        if (!auth) {
          defer.reject(new RuntimeError('No auth credentials found for: ' + emailAddress));
        } else {
          Encrypt.deriveNewKey(auth.password)
            .then(function setStorageItem(keyData) {
              cachedSecureData[emailAddress] = '';

              return Storage.set(emailAddress, {
                salt: keyData.salt,
                iterations: keyData.iterations,
                secureData: cachedSecureData[emailAddress]
              });
            })
            .then(defer.resolve)
            .catch(defer.reject)
          ;
        }

        return defer.promise;
      },



      /**
       * Calculate master encryption keys for given user.
       * @param emailAddress {string} user id.
       * @param storedData {Object} stored data for given user id.
       * @return {Promise} resolves to the master key
       * @private
       */
      _calculateMasterKeys: function(emailAddress, storedData) {
        var auth = AuthCredentials.get(emailAddress);

        if (!auth) {
          return $q.reject(new RuntimeError('No auth credentials found for: ' + emailAddress));
        } else {
          return Encrypt.deriveKey(auth.password, {
            salt: storedData.salt,
            iterations: storedData.iterations
          });
        }
      },



      /**
       * Load secure data for the given user.
       *
       * @param emailAddress {string} the email id.
       *
       * @return {Promise} will resolve to plaintext secure data.
       * @private
       */
      _loadSecureData: function(emailAddress) {
        var defer = $q.defer();

        if (cachedSecureData[emailAddress]) {
          defer.resolve(cachedSecureData[emailAddress]);
        } else {
          $log.debug('Loading secure data for: ' + emailAddress);

          Storage.get(emailAddress)
            .then(function createStoredDataIfNeeded(data) {
              // already got secure key store
              if (data) {
                return data;
              }
              // need to create secure key store
              else {
                return self._createSecureDataStore(emailAddress);
              }
            })
            .then(function getMasterKey(storedData) {
              return self._calculateMasterKeys(emailAddress, storedData)
                .then(function handleMasterKeys(masterKeys) {
                  return {
                    data: storedData.secureData,
                    key: masterKeys.secureDataKey
                  };
                });
            })
            .then(function decryptSecureData(params) {
              // TODO: decrypt
              cachedSecureData[emailAddress] = params.data;

              return cachedSecureData[emailAddress];
            });
        }

        return defer.promise;
      },





      /**
       * Get secure data for the given email address.
       *
       * This will create a secure data store if it doesn't already exist for the user.
       *
       * @param emailAddress {string} the email id.
       * @param key {string} the key within the secure data store to retrieve the value for.
       *
       * @return {Promise} will resolve to the value.
       */
      get: function(emailAddress, key) {
        this._loadSecureData(emailAddress)
          .then(function getValue(secureData) {
            return secureData[key];
          });
      },





      /**
       * Set a value within the secure data store.
       *
       * @param emailAddress {string} the user id.
       * @param key {string} the key to set.
       * @param value {string} the value to set for the key.
       *
       * @return {Promise}
       */
      set: function(emailAddress, key, value) {
        this._loadSecureData(emailAddress)
          .then(function setValue() {
            cachedSecureData[emailAddress][key] = value;
          })
          .then(function getStoredDataBlog(){
            return Storage.get(emailAddress);
          })
          .then(function updateSecureDataInStorage(storedData) {
            // TODO: encrypt
            storedData.secureData = cachedSecureData[emailAddress];

            return Storage.set(emailAddress, storedData);
          })
        ;
      }

    }));
  });


}(angular.module('App.data', ['App.common', 'App.crypto'])));
