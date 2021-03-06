'use strict';

(function(app) {

  app.factory('CryptoError', function(RuntimeError) {
    return RuntimeError.define('CryptoError');
  });


  /**
   * General encryptinon service using SJCL. For PGP encryption see the GPG service.
   */
  app.factory('Crypto', function(Log, $q, CryptoError, Random, WebWorker) {
    var log = Log.create('Crypto');


    /**
     * When deriving a key from a user password, keep iterating until the given amount of time has elapsed.
     * @type {number} milliseconds
     */
    var REQUIRED_STRENGTH_MS = 1000;


    return new (Class.extend({

      /**
       * Generate a new secure encryption key from given user password and salt.
       *
       * @param password {string} user password.
       *
       * @return {Promise} resolves to a { authKey: 256-bit auth key as a hex string, secureDataKey: 256-bit secure data key as hex string, iterations: no. of PBKDF2 iterations used, salt: salt as hex string }
       */
      deriveNewKey: function(password) {
        var self = this;

        return Random.getRandomBytes()
          .then(function deriveKey(salt) {
            return self.deriveKey(password, {
              salt: sjcl.codec.hex.fromBits(salt),
              requiredStrengthMs: REQUIRED_STRENGTH_MS
            });
          })
        ;
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
        log.debug('Deriving key from: ', password, algorithmParams);

        var worker = new WebWorker('deriveKey', function(data, cb) {
          try {
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

            cb(null, {
              authKey: sjcl.codec.hex.fromBits(key.slice(0, key.length / 2)),
              secureDataKey: sjcl.codec.hex.fromBits(key.slice(key.length / 2)),
              salt: data.salt,
              iterations: iterations
            });
          } catch (err) {
            cb(err);
          }
        });

        var defer = $q.defer();

        worker.run({
          password: password,
          salt: algorithmParams.salt,
          iterations: algorithmParams.iterations,
          requiredStrengthMs: algorithmParams.requiredStrengthMs          
        })
          .then(defer.resolve)
          .catch(function(err) {
            defer.reject(new CryptoError('Key derivation failed: ' + err));
          })
        ;

        return defer.promise;
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
        log.debug('Encrypting with key: ' + key);

        var plaintext = JSON.stringify(data),
          password = sjcl.codec.hex.toBits(key);

        if (8 !== password.length) {
          return $q.reject(new CryptoError('Encryption password must be 256 bits'));
        }

        var defer = $q.defer();

        Random.getRandomBytes(16)
          .then(function doEncryption(iv) {

            var worker = new WebWorker('encrypt', function(data, cb) {
              try {
                var r = 
                  sjcl.encrypt_b64(data.password, data.plaintext, data.iv);
                cb(null, r);
              } catch (err) {
                cb(err);
              }
            });

            return worker.run({
              password: password,
              plaintext: plaintext,
              iv: iv              
            });

          })
          .then(defer.resolve)
          .catch(function(err) {
            defer.reject(new CryptoError('Encryption failed: ' + err));
          })
        ;

        return defer.promise;
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
        log.debug('Decrypting with key: ' + key);

        var password = sjcl.codec.hex.toBits(key);

        if (8 !== password.length) {
          return $q.reject(new CryptoError('Decryption password must be 256 bits'));
        }

        var worker = new WebWorker('decrypt', function(data, cb) {
          try {
            var r = sjcl.decrypt_b64(data.password, data.ciphertext);
            cb(null, r);
          } catch (err) {
            cb(err);
          }
        });

        var defer = $q.defer();

        worker.run({
          password: password,
          ciphertext: ciphertext
        })
          .then(function parse(plaintext) {
            defer.resolve(JSON.parse(plaintext))
          })
          .catch(function(err) {
            defer.reject(new CryptoError('Decryption failed: ' + err));
          })
        ;

        return defer.promise;
      },



    }));
  });


}(angular.module('App.crypto', ['App.common'])));
