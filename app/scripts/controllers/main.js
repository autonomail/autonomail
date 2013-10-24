'use strict';

(function(app) {

  app.controller('MainCtrl', function ($log, $scope, Random) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];

    $scope.randomStr = 'test';

    $scope.getRandomBytes = function() {
      Random.getRandomBytes().then(function(bytes) {
        $scope.randomStr = bytes;
      }, function(err) {
        $log.error(err);
      });
    }
  });

}(angular.module('App.controllers', ['App.crypto'])));

