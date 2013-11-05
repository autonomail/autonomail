'use strict';

(function(app) {

  app.controller('SignupProcessCtrl', function ($log, $scope, $state, Server, SignupManager) {

    $scope.progressBar = {
      value: 40,
      type: 'success'
    };

  });

}(angular.module('App.signup', ['App.server'])));

