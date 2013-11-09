/**
 * This is responsible for managing the user's secure data.
 */

(function(app) {
  'use strict';

  app.factory('SecureData', function($log, $q, RuntimeError, Storage, AuthCredentials, Encrypt) {

    /** Cached secure data encryption keys for users. */
    var cachedSecureDataKey = {};

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
          var storageData = {};

          Encrypt.deriveNewKey(auth.password)
            .then(function createSkeletonSecureData(keyData) {
              storageData.salt = keyData.salt;
              storageData.iterations = keyData.iterations;
              cachedSecureDataKey[emailAddress] = keyData.secureDataKey;

              return Encrypt.encrypt(cachedSecureDataKey[emailAddress], {});
            })
            .then(function setStorageItem(encryptedSecureData) {
              storageData.secureData = encryptedSecureData;
              cachedSecureData[emailAddress] = {};

              return Storage.set(emailAddress, storageData);
            })
            .then(defer.resolve)
            .catch(defer.reject)
          ;
        }

        return defer.promise;
      },



      /**
       * Get secure data encryption key for given user.
       * @param emailAddress {string} user id.
       * @param storedData {Object} stored data for given user id.
       * @return {Promise} resolves to the master key
       * @private
       */
      _getSecureDataKey: function(emailAddress, storedData) {
        // already got it?
        if (cachedSecureDataKey[emailAddress]) {

          var defer = $q.defer();
          defer.resolve(cachedSecureDataKey[emailAddress]);
          return defer.promise;

        }
        // else calculate from scratch
        else {

          var auth = AuthCredentials.get(emailAddress);

          if (!auth) {
            return $q.reject(new RuntimeError('No auth credentials found for: ' + emailAddress));
          } else {
            return Encrypt.deriveKey(auth.password, {
              salt: storedData.salt,
              iterations: storedData.iterations
            })
              .then(function cacheKeys(keyData) {
                // cache the result for next time we need it
                cachedSecureDataKey[emailAddress] = keyData.secureDataKey;
                return cachedSecureDataKey[emailAddress];
              });
          }

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
        var self = this;

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
            .then(function getEncryptionKey(storedData) {
              return self._getSecureDataKey(emailAddress, storedData)
                .then(function handleKey(key) {
                  return {
                    data: storedData.secureData,
                    key: key
                  };
                });
            })
            .then(function decryptSecureData(params) {
              return Encrypt.decrypt(params.key, params.data)
            })
            .then(function cacheDecryptedData(decryptedSecureData) {
              cachedSecureData[emailAddress] = decryptedSecureData;
              return decryptedSecureData;
            })
          ;
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
        return this._loadSecureData(emailAddress)
          .then(function getValue(secureData) {
            var value = secureData[key];

            $log.debug('Secure data [' + key + '] -> ', value);

            return value;
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
        var self = this;

        $log.debug('Secure data [' + key + '] <- ', value);

        self._loadSecureData(emailAddress)
          .then(function setValue() {
            // first lets update the cache
            cachedSecureData[emailAddress][key] = value;
          })
          .then(function getStoredDataBlob(){
            return Storage.get(emailAddress);
          })
          .then(function getEncryptionKey(storedData) {
            return self._getSecureDataKey(emailAddress, storedData)
              .then(function handleKey(key) {
                return {
                  key: key,
                  data: storedData
                }
              });
          })
          .then(function updateSecureDataInStorage(params) {
            return Encrypt.encrypt(params.key, cachedSecureData[emailAddress])
              .then(function save(encryptedSecureData) {
                params.data.secureData = encryptedSecureData;

                return Storage.set(emailAddress, params.data);
              });
          })
        ;
      }

    }));
  });


}(angular.module('App.data', ['App.common', 'App.crypto'])));
