'use strict';

(function(app) {

  /**
   * Controller for pop-up modal.
   * @param $scope
   * @param $modalInstance
   * @constructor
   */
  var PrngModalCtrl = function($scope, $modalInstance) {
    $scope.str = 'blah';
  };


  app.factory('prng', ['BaseServiceClass', 'ui.bootstrap.modal', function(BaseServiceClass, $modal, $q, $log) {
    return new (BaseServiceClass.extend({
      /**
       * Get a random byte.
       * @returns {Promise}
       */
      getRandomByte: function() {
        var deferred = $q.defer();

        var modalInstance = $modal.open({
          templateUrl: 'views/prng.html',
          controller: PrngModalCtrl
        });

        modalInstance.result.then(function () {
          deferred.resolve();
        }, function () {
          $log.info('Failed to collect entropy from pop-up');
          deferred.reject();
        });

        return deferred.promise;
      },


      /**
       * Get String representation of this service.
       * @returns {string}
       */
      toString: function() {
        return 'PRNG service';
      }
    }));
  }]);

}(angular.module('App')));
