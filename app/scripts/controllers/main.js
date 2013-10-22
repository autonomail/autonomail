'use strict';

(function(app) {

  app.controller('MainCtrl', function ($scope, prng) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];

    $scope.randomStr = 'test';
  });

}(angular.module('App')));

