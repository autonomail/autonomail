'use strict';

(function(app) {

  app.factory('Keygen', function($log, $q, RuntimeError, Random, WebWorker) {

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
       * @return {Promise} resolves to a { key: 512-bit key as a hex string, iterations: no. of PBKDF2 iterations used, timeElapsedMs: time taken for key }
       */
      deriveNewKeyFromPassword: function(password) {
        var defer = $q.defer();

        $log.debug('Deriving key from: ' + password);

        Random.getRandomBytes()
          .then(function deriveKey(salt) {

            return WebWorker.run(function(data) {
              var timeElapsedMs = 0,
                key = null;
              iterations = 10000;

              while (data.requiredStrengthMs > timeElapsedMs) {
                startTime = new Date();
                key = sjcl.misc.pbkdf2(data.password, data.salt, iterations, null, sjcl.misc.hmac512);
                timeElapsedMs = new Date().getTime() - startTime.getTime();

                if (0 === timeElapsedMs) {    // just in case it's super fast
                  iterations *= 2;
                } else {
                  iterations = parseInt(iterations * data.requiredStrengthMs / timeElapsedMs, 10) + 1;
                }
              }

              return {
                key: sjcl.codec.hex.fromBits(key),
                salt: sjcl.codec.hex.fromBits(data.salt),
                iterations: iterations
              };
            }, {
              password: password,
              salt: salt,
              requiredStrengthMs: REQUIRED_STRENGTH_MS
            });

          })
          .then(defer.resolve)
          .catch(defer.reject)
        ;

        return defer.promise;
      }

    }));
  });


}(angular.module('App.crypto', ['App.common'])));
