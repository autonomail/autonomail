'use strict';

(function(app) {

  app.factory('Encrypt', function($log, $q, RuntimeError, Random, WebWorker) {

    /**
     * When deriving a key from a user password, keep iterating until the given amount of time has elapsed.
     * @type {number} milliseconds
     */
    var REQUIRED_STRENGTH_MS = 2000;


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
              salt: salt,
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
            timeElapsedMs = 0,
            key = null;

          do {
            var startTime = new Date();
            key = sjcl.misc.pbkdf2(data.password, data.salt, iterations, null, sjcl.misc.hmac512);
            timeElapsedMs = new Date().getTime() - startTime.getTime();

            if (!data.requiredStrengthMs) {
              break;
            }

            if (0 === timeElapsedMs) {    // just in case it's super fast
              iterations *= 2;
            } else {
              iterations = parseInt(iterations * data.requiredStrengthMs / timeElapsedMs, 10) + 1;
            }
          } while (data.requiredStrengthMs > timeElapsedMs);

          return {
            authKey: sjcl.codec.hex.fromBits(key.slice(0, key.length / 2)),
            secureDataKey: sjcl.codec.hex.fromBits(key.slice(key.length / 2)),
            salt: sjcl.codec.hex.fromBits(data.salt),
            iterations: iterations
          };
        }, {
          password: password,
          salt: sjcl.codec.hex.toBits(algorithmParams.salt),
          iterations: algorithmParams.iterations,
          requiredStrengthMs: algorithmParams.requiredStrengthMs
        });
      },


      /**
       * Create PGP key pair for given user.
       *
       * @param emailAddress {string} user id.
       * @return {Promise} resolves to {public: hex string, private: hex string}
       */
      createPGPKeys: function(emailAddress) {
        var defer = $q.defer();

        defer.resolve({
          public: 'ABC',
          private: 'DEF'
        });

        return defer.promise;
      }

    }));
  });


}(angular.module('App.crypto', ['App.common'])));
