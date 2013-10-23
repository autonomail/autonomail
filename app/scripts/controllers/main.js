'use strict';

(function(app) {

  app.controller('MainCtrl', function ($scope) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];

    $scope.randomStr = 'test';
  });

}(angular.module('App.controllers', [])));

