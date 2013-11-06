'use strict';

(function(app) {

  app.controller('SignupProcessCtrl', function ($log, $scope, $timeout, SignupManager, Random, Keygen) {

    $scope.progressBar = {
      value: 40,
      type: 'success'
    };

    $scope.error = null;


    $scope.startProcess = function() {
      var signupFormData = SignupManager.getSavedSignupFormData();

      Random.getRandomBytes()
        .then(function gotRandomBytes(bytes) {
          return Keygen.generatePassKey(signupFormData.password, bytes);
        })
        .then(function generatedKey(key) {

        })
        .catch(function (err) {
          $log.error(err);
        })
      ;
    };

    $scope.startProcess();
  });

}(angular.module('App.signup', ['App.server', 'ui.bootstrap.progressbar'])));

