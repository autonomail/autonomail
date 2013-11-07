'use strict';

(function(app) {

  app.controller('SignupProcessCtrl', function ($log, $scope, $timeout, SignupManager, SecureData) {

    $scope.progressBar = {
      value: 0,
      type: 'success'
    };

    $scope.error = null;

    $scope.startProcess = function() {
      var signupFormData = SignupManager.getSavedSignupFormData();

      SecureData.get(signupFormData.email)
        .then(function registerWithServer(data) {
          // TODO
        })
        .then(function storageReady() {
          // TODO
        })
        .then(function generatedPgpKeys() {
          // TODO
        })
        .catch(function promiseErr(err) {
          $log.error(err);
        })
      ;
    };

    $scope.startProcess();
  });

}(angular.module('App.signup', ['App.server', 'App.data', 'ui.bootstrap.progressbar'])));

