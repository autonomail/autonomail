'use strict';

(function(app) {

  app.factory('Encrypt', function($log, $q, RuntimeError, Random, WebWorker, GPG) {

    /**
     * When deriving a key from a user password, keep iterating until the given amount of time has elapsed.
     * @type {number} milliseconds
     */
    var REQUIRED_STRENGTH_MS = 1000;


    return new (Class.extend({

      /**
       * Generate a new secure password key from given user password and salt.
       *
       * @param password {string} user password.
       *
       * @return {Promise} resolves to a { authKey: 256-bit auth key as a hex string, secureDataKey: 256-bit secure data key as hex string, iterations: no. of PBKDF2 iterations used, salt: salt as hex string }
       */
      deriveNewKey: function(password) {
        var self = this;

        var defer = $q.defer();

        Random.getRandomBytes()
          .then(function deriveKey(salt) {
            return self.deriveKey(password, {
              salt: sjcl.codec.hex.fromBits(salt),
              requiredStrengthMs: REQUIRED_STRENGTH_MS
            });
          })
          .then(defer.resolve)
          .catch(defer.reject)
        ;

        return defer.promise;
      },


      /**
       * Derive key from existing password and algorithm options.
       *
       * @param password {string} password input by the user.
       * @param algorithmParams {Object} key-derivation algorithm parameters.
       * @param algorithmParams.salt {string} salt as hex string.
       * @param [algorithmParams.iterations] {Number} no. of iterations to perform.
       * @param [algorithmParams.requiredStrengthMs] {Number} if set then the passed-in `iterations` will be ignored.
       * Instead, key derivation will be repeated until the time taken to derive the key is more than what is specified
       * in this parameter
       *
       * @return {Promise} resolves to a { authKey: 256-bit auth key as a hex string, secureDataKey: 256-bit secure data key as hex string, iterations: no. of PBKDF2 iterations used, salt: salt as hex string }
       */
      deriveKey: function(password, algorithmParams) {
        $log.debug('Deriving key from: ', password, algorithmParams);

        return WebWorker.run('deriveKey', function(data) {
          var
            iterations = data.iterations || 10000,
            saltBits = sjcl.codec.hex.toBits(data.salt),
            timeElapsedMs = 0,
            key = null;

          do {
            // check time taken for previous calculation
            if (key) {
              if (0 === timeElapsedMs) {    // just in case it's super fast
                iterations *= 2;
              } else {
                iterations = parseInt(iterations * data.requiredStrengthMs / timeElapsedMs, 10) + 1;
              }
            }

            var startTime = new Date();
            key = sjcl.misc.pbkdf2(data.password, saltBits, iterations, null, sjcl.misc.hmac512);
            timeElapsedMs = new Date().getTime() - startTime.getTime();

          } while (data.requiredStrengthMs && data.requiredStrengthMs > timeElapsedMs);

          return {
            authKey: sjcl.codec.hex.fromBits(key.slice(0, key.length / 2)),
            secureDataKey: sjcl.codec.hex.fromBits(key.slice(key.length / 2)),
            salt: data.salt,
            iterations: iterations
          };
        }, {
          password: password,
          salt: algorithmParams.salt,
          iterations: algorithmParams.iterations,
          requiredStrengthMs: algorithmParams.requiredStrengthMs
        });
      },


      /**
       * Perform AES 256-bit encryption on given data.
       *
       * @param key {string} 256-bit key as hex string.
       * @param data {*} data to encrypt - will be automatically passed through JSON.stringify().
       *
       * @return {Promise} resolves to cipherText
       */
      encrypt: function(key, data) {
        var plaintext = JSON.stringify(data),
          password = sjcl.codec.hex.toBits(key);

        if (8 !== password.length) {
          return $q.reject(new RuntimeError('Encryption password must be 256 bits'));
        }

        return Random.getRandomBytes(16)
          .then(function doEncryption(iv) {

            return WebWorker.run('encrypt', function(data) {
              return sjcl.encrypt_b64(data.password, data.plaintext, data.iv);
            }, {
              password: password,
              plaintext: plaintext,
              iv: iv
            });

          })
          .then(function (cipherText) {
            return cipherText;
          });
        ;
      },




      /**
       * Perform AES 256-bit decryption on given data.
       *
       * @param key {string} 256-bit key as hex string.
       * @param ciphertext {*} data to decrypt - decrypted output will be automatically passed through JSON.parse() to get
       * final JS object/string.
       *
       * @return {Promise} resolves to JS object/string (the plaintext).
       */
      decrypt: function(key, ciphertext) {
        var password = sjcl.codec.hex.toBits(key);

        if (8 !== password.length) {
          return $q.reject(new RuntimeError('Decryption password must be 256 bits'));
        }

        return WebWorker.run('decrypt', function(data) {
          return sjcl.decrypt_b64(data.password, data.ciphertext);
        }, {
            password: password,
            ciphertext: ciphertext
          }
        )
          .then(function parse(plaintext) {
            return JSON.parse(plaintext);
          });
      },



    }));
  });


}(angular.module('App.crypto', ['App.common'])));
