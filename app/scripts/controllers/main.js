'use strict';

(function(app) {

  app.controller('MainCtrl', function ($scope, Random) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];

    $scope.randomStr = 'test';

    $scope.openModal = function() {
      Random.getRandomBytes();
    }
  });

}(angular.module('App.controllers', ['App.crypto'])));

