'use strict';

(function(app) {

  app.controller('SignupProcessCtrl', function ($log, $scope, $timeout, SignupManager, Random, Keygen) {

    $scope.progressBar = {
      value: 0,
      type: 'success'
    };

    $scope.error = null;

    $scope.updateProgress = function(percent, text) {
      if (percent) {
        $scope.progressBar.value = percent;
      }
      if (text) {
        $scope.progressText = text;
      }
    };

    $scope.startProcess = function() {
      var signupFormData = SignupManager.getSavedSignupFormData();

      $scope.updateProgress('Generating random data for key generation', 0);

      Random.getRandomBytes()
        .then(function gotRandomBytes(bytes) {
          $scope.updateProgress('Generating secure storage key', 10);
          return Keygen.deriveNewKeyFromPassword(signupFormData.password, bytes);
        })
        .then(function derivedKey(data) {
          $log.debug('Derived key:', data);
          $scope.updateProgress('Registering secure key with server', 20);
          // TODO
        })
        .then(function registeredWithServer() {
          $scope.updateProgress('Generating secure storage area', 30);
          // TODO
        })
        .then(function storageReady() {
          $scope.updateProgress('Generating PGP keys', 40);
          // TODO
        })
        .then(function generatedPgpKeys() {
          $scope.updateProgress('All done!', 100);
          // TODO
        })
        .catch(function promiseErr(err) {
          $log.error(err);
        })
      ;
    };

    $scope.startProcess();
  });

}(angular.module('App.signup', ['App.server', 'ui.bootstrap.progressbar'])));

