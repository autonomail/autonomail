/**
 * This is responsible for managing the user's secure data.
 */

(function(app) {
  'use strict';

  app.factory('SecureData', function($log, $q, RuntimeError, Storage, Encrypt, AuthCredentials) {

    /** Cached secure data encryption keys for users. */
    var cachedSecureDataKey = {};

    /** Cached decrypted secure data for users. */
    var cachedSecureData = {};


    return new (Class.extend({
      /**
       * Create secure skeleton data for the given user.
       *
       * This will fetch the user's auth credentials and use them to derive a secure key for encrypting the data with.
       *
       * @param userId {string} the user id.
       *
       * @return {Promise} will resolve to true.
       * @private
       */
      _createSecureDataStore: function(userId) {
        var defer = $q.defer();

        var auth = AuthCredentials.get(userId);

        $log.debug('Creating data store for: ' + userId);

        if (!auth) {
          defer.reject(new RuntimeError('No auth credentials found for: ' + userId));
        } else {
          var storageData = {};

          Encrypt.deriveNewKey(auth.password)
            .then(function createSkeletonSecureData(keyData) {
              storageData.salt = keyData.salt;
              storageData.iterations = keyData.iterations;
              cachedSecureDataKey[userId] = keyData.secureDataKey;

              return Encrypt.encrypt(keyData.secureDataKey, {});
            })
            .then(function setStorageItem(encryptedSecureData) {
              storageData.secureData = encryptedSecureData;
              cachedSecureData[userId] = {};

              return Storage.set(userId, storageData);
            })
            .then(defer.resolve)
            .catch(defer.reject)
          ;
        }

        return defer.promise;
      },



      /**
       * Get secure data encryption key for given user.
       * @param userId {string} user id.
       * @param storedData {Object} stored data for given user id.
       * @return {Promise} resolves to the encryption key.
       * @private
       */
      _getSecureDataKey: function(userId, storedData) {
        // already got it?
        if (cachedSecureDataKey[userId]) {

          var defer = $q.defer();
          defer.resolve(cachedSecureDataKey[userId]);
          return defer.promise;

        }
        // else calculate from scratch
        else {

          var auth = AuthCredentials.get(userId);

          if (!auth) {
            return $q.reject(new RuntimeError('No auth credentials found for: ' + userId));
          } else {
            return Encrypt.deriveKey(auth.password, {
              salt: storedData.salt,
              iterations: storedData.iterations
            })
              .then(function cacheKeys(keyData) {
                // cache the result for next time we need it
                cachedSecureDataKey[userId] = keyData.secureDataKey;
                return keyData.secureDataKey;
              });
          }

        }
      },



      /**
       * Load secure data for the given user.
       *
       * @param userId {string} the email id.
       *
       * @return {Promise} will resolve to plaintext secure data.
       * @private
       */
      _loadSecureData: function(userId) {
        var self = this;

        var defer = $q.defer();

        if (cachedSecureData[userId]) {
          defer.resolve(cachedSecureData[userId]);
        } else {
          $log.debug('Loading secure data for: ' + userId);

          Storage.get(userId)
            .then(function createStoredDataIfNeeded(data) {
              // already got secure key store
              if (data) {
                return data;
              }
              // need to create secure key store
              else {
                return self._createSecureDataStore(userId);
              }
            })
            .then(function getEncryptionKey(storedData) {
              return self._getSecureDataKey(userId, storedData)
                .then(function handleKey(key) {
                  return {
                    data: storedData.secureData,
                    key: key
                  };
                });
            })
            .then(function decryptSecureData(params) {
              return Encrypt.decrypt(params.key, params.data);
            })
            .then(function cacheDecryptedData(decryptedSecureData) {
              cachedSecureData[userId] = decryptedSecureData;
              return decryptedSecureData;
            })
            .then(defer.resolve)
            .catch(defer.reject)
          ;
        }

        return defer.promise;
      },





      /**
       * Get secure data for the given email address.
       *
       * This will create a secure data store if it doesn't already exist for the user.
       *
       * @param userId {string} the email id.
       * @param key {string} the key within the secure data store to retrieve the value for.
       *
       * @return {Promise} will resolve to the value.
       */
      get: function(userId, key) {
        return this._loadSecureData(userId)
          .then(function getValue(secureData) {
            var value = secureData[key];

            $log.debug('Secure data [' + key + '] -> ', value);

            return value;
          });
      },





      /**
       * Set a value within the secure data store.
       *
       * @param userId {string} the user id.
       * @param key {string} the key to set.
       * @param value {string} the value to set for the key.
       *
       * @return {Promise}
       */
      set: function(userId, key, value) {
        var self = this;

        $log.debug('Secure data [' + key + '] <- ', value);

        return self._loadSecureData(userId)
          .then(function setValue() {
            // first lets update the cache
            cachedSecureData[userId][key] = value;
          })
          .then(function getStoredDataBlob(){
            return Storage.get(userId);
          })
          .then(function getEncryptionKey(storedData) {
            return self._getSecureDataKey(userId, storedData)
              .then(function handleKey(key) {
                return {
                  key: key,
                  data: storedData
                }
              });
          })
          .then(function updateSecureDataInStorage(params) {
            return Encrypt.encrypt(params.key, cachedSecureData[userId])
              .then(function save(encryptedSecureData) {
                params.data.secureData = encryptedSecureData;

                return Storage.set(userId, params.data);
              });
          })
        ;
      }

    }));
  });


}(angular.module('App.data', ['App.common', 'App.crypto', 'App.user'])));
