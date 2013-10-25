'use strict';

(function(app) {

  var randomNumGenerator = sjcl.random;

  /**
   * Wraps around more complex internal logic of SJCL's .isReady() method.
   */
  randomNumGenerator.isReadyToGenerate = function() {
    // To be ready we can only be in one more of: _READY, _REQUIRES_RESEED
    return this.isReady() !== this._NOT_READY;
  };


  app.factory('Random', function(BaseServiceClass, $log, $q, $timeout, $modal) {

    return new (BaseServiceClass.extend({
      /**
       * Begin entropy collection.
       */
      startEntropyCollection: function() {
        $log.log('Starting RNG entropy collection...');
        randomNumGenerator.setDefaultParanoia(10);
        randomNumGenerator.startCollectors();
      },


      /**
       * Get random bytes.
       *
       * If there isn't enough entropy this will trigger a modal pop-up informing the user of so, and will only close
       * and resolve the Promise once enough entropy is available.
       *
       * @return {Promise} resolved with an Array of values if successful.
       */
      getRandomBytes: function() {
        var self = this;

        var deferred = $q.defer();

        // if rng not yet ready
        if (!randomNumGenerator.isReadyToGenerate()) {
          // show a modal
          var modalInstance = $modal.open({
            templateUrl: 'views/modals/entropy.html',
            controller: 'EntropyModalCtrl',
            keyboard: false,
            backdrop: 'static'
          });

          // once closed
          modalInstance.result.then(function() {
            // generate
            deferred.resolve(self._getRandomBytes());
          }, function(reason) {
            deferred.reject(new Error('Error using RNG entropy modal: ', reason.toString()));
          });

        } else {
          // since we already have enough entropy just do it!
          deferred.resolve(self._getRandomBytes());
        }

        return deferred.promise;
      },


      /**
       * Get 256 random bits (or 32 bytes).
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


  app.controller('EntropyModalCtrl', function($scope, $modalInstance, $timeout) {
    // once opened
    $modalInstance.opened.then(function() {
      var openedAt = new Date();

      var poller;

      (poller = function() {
        // keep checking
        if (!randomNumGenerator.isReadyToGenerate) {
          $timeout(poller, 1000);
        }
        // if entropy is enough then we're done
        else {
          // show for atleast 3 seconds so that the user can read the text (we're fairly certain we won't need to show this
          // modal that often so this is ok to do).
          var secondsElapsed = new Date().getTime() - openedAt.getTime();
          var waitFor = (secondsElapsed < 3 ? 3 : 0);

          $timeout(function() {
            $modalInstance.close();
          }, waitFor);
        }
      })();
    }, function() {
      $modalInstance.dismiss(new Error('Error showing RNG entropy modal'));
    });
  });

}(angular.module('App.crypto', ['App.common', 'ui.bootstrap'])));
