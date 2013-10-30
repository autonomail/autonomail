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

    $scope.validatePasswordConfirmation = function() {
      return $scope.user.confirm === $scope.user.password;
    };

  });

}(angular.module('App.signup', ['ui.validate'])));

