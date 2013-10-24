'use strict';

(function(app) {

  app.factory('Random', function(BaseServiceClass, $log, $q, $timeout, $modal) {


    // max. paranoia level
    var randomNumGenerator = sjcl.random;
    randomNumGenerator.setDefaultParanoia(10);

    randomNumGenerator.notYetReady = function() {
      return this.isReady() != this._READY;
    };

    return new (BaseServiceClass.extend({

      /**
       * Begin entropy collection.
       */
      startEntropyCollection: function() {
        $log.log('Starting RNG entropy collection...');
        randomNumGenerator.startCollectors();
      },


      /**
       * Get random bytes.
       *
       * If there isn't enough entropy this will trigger a modal pop-up informing the user of so, and will only close
       * and resolve the Promise once enough entropy is available.
       *
       * @return {Promise} resolved with an Array of values.
       */
      getRandomBytes: function() {
        var self = this;

        var deferred = $q.defer();

        // if rng not yet ready
        if (randomNumGenerator.notYetReady()) {
          // inform the user
          var modalInstance = $modal.open({
            templateUrl: 'views/modals/entropy.html'
          });

          // once closed
          modalInstance.result.then(function() {
            // generate
            deferred.resolve(self._getRandomBytes());
          }, function() {
            $log.error('Error closing RNG entropy modal');
            deferred.reject();
          });

          // once opened
          modalInstance.opened.then(function() {
            // wait until entropy is enough
            $timeout(function() {
              if (randomNumGenerator.notYetReady()) {
                modalInstance.close();
              }
            }, 1000, false);
          }, function() {
            $log.error('Error showing RNG entropy modal');
            deferred.reject();
          });

        } else {
          // since we already have enough entropy just do it!
          deferred.resolve(self._getRandomBytes());
        }

        return deferred.promise;
      },


      /**
       * Get random bytes.
       * @return {array}
       * @private
       */
      _getRandomBytes: function() {
        return randomNumGenerator.randomWords(8);
      },


      /**
       * Get String representation of this service.
       * @returns {string}
       */
      toString: function() {
        return 'Cryptographically secure randomness generator';
      }
    }));

  });

}(angular.module('App.crypto', ['App.common', 'ui.bootstrap'])));
