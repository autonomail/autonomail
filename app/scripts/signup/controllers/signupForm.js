'use strict';

(function(app) {

  app.controller('SignupFormCtrl', function ($log, $scope) {

    $scope.user = {
      name: '',
      password: '',
      confirm: '',
      agree: false
    };

    $scope.canSubmit = function() {
      return $scope.signupForm.$dirty && $scope.signupForm.$valid;
    };

  });

}(angular.module('App.controllers', [])));

