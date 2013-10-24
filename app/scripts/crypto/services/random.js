'use strict';

(function(app) {

  app.factory('Random', ['BaseServiceClass', '$log', '$modal', function($BaseServiceClass, $log, $modal) {

    var ModalDemoCtrl = function ($scope) {

      $scope.items = ['item1', 'item2', 'item3'];

      $scope.open = function () {

        var modalInstance = $modal.open({
          templateUrl: 'views/prng.html',
          controller: ModalInstanceCtrl,
          resolve: {
            items: function () {
              return $scope.items;
            }
          }
        });

        modalInstance.result.then(function (selectedItem) {
          $scope.selected = selectedItem;
        }, function () {
          $log.info('Modal dismissed at: ' + new Date());
        });
      };
    };

    var ModalInstanceCtrl = function ($scope, $modalInstance, items) {

      $scope.items = items;
      $scope.selected = {
        item: $scope.items[0]
      };

      $scope.ok = function () {
        $modalInstance.close($scope.selected.item);
      };

      $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
      };
    };

    return new ($BaseServiceClass.extend({

      /**
       * Begin entropy collection.
       */
      startEntropyCollection: function() {
        $log.log('Starting RNG entropy collection...');
        sjcl.random.startCollectors();
      },



      getRandomBytes: function() {
        var scope = {};
        new ModalDemoCtrl(scope);
        scope.open();
      },




      /**
       * Get String representation of this service.
       * @returns {string}
       */
      toString: function() {
        return 'Cryptographically secure randomness generator';
      }
    }));

  }]);

}(angular.module('App.crypto', ['App.common', 'ui.bootstrap'])));
