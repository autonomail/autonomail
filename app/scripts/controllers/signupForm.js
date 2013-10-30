'use strict';

(function(app) {

  app.controller('SignupFormCtrl', function ($log, $scope) {
    $scope.user = {
      name: '',
      password: '',
      confirm: '',
      agree: false
    };
  });

}(angular.module('App.controllers', [])));

